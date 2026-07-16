'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

import { useAuthStore, useVaultStore } from '@/store';
import { hashPassword, generateSalt, deriveEncryptionKey, encryptEntry } from '@/lib/crypto';
import type { DecryptedEntry } from '@/store';
import { toast } from 'sonner';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { token, encryptionKey, userId, encryptionSalt, logout } = useAuthStore();
  const { entries, setEntries } = useVaultStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields are required');
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    if (newPassword.length < 8) {
      toast.error('Master password must be at least 8 characters');
      return;
    }
    if (!token || !encryptionKey || !encryptionSalt) {
      toast.error('Not authenticated');
      return;
    }

    setLoading(true);
    try {
      // Verify current password
      const oldHash = await hashPassword(currentPassword, encryptionSalt);

      // Generate new salts
      const newSalt = generateSalt();
      const newEncryptionSalt = generateSalt();
      const newHash = await hashPassword(newPassword, newEncryptionSalt);

      // Derive new encryption key
      const newKey = await deriveEncryptionKey(newPassword, newEncryptionSalt);

      // Re-encrypt all entries
      const reEncryptedEntries: { id: string; encryptedData: string; iv: string }[] = [];
      for (const entry of entries) {
        const { encryptedData, iv } = await encryptEntry(entry.data, newKey);
        reEncryptedEntries.push({
          id: entry.id,
          encryptedData,
          iv,
        });
      }

      // Send to server
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          oldPasswordHash: oldHash,
          newPasswordHash: newHash,
          newSalt,
          newEncryptionSalt,
          reEncryptedEntries,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to change password');
      }

      const data = await res.json();

      // Re-login with new credentials
      const derivedKey = await deriveEncryptionKey(newPassword, newEncryptionSalt);

      // Update store
      useAuthStore.getState().login(
        data.token,
        userId!,
        useAuthStore.getState().username!,
        derivedKey,
        newEncryptionSalt
      );

      toast.success('Master password changed successfully');
      onOpenChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            Change Master Password
          </DialogTitle>
          <DialogDescription>
            This will re-encrypt all your vault entries with the new password.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label>Current Master Password</Label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Enter current password"
            />
          </div>
          <div className="space-y-2">
            <Label>New Master Password</Label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Min. 8 characters"
            />
          </div>
          <div className="space-y-2">
            <Label>Confirm New Password</Label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Re-enter new password"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !currentPassword || !newPassword || !confirmPassword}
            className="min-w-[100px]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <ShieldCheck className="h-4 w-4 mr-2" />
            )}
            Update
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}