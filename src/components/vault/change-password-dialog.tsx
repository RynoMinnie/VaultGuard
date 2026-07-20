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
import { hashPassword, generateSalt, deriveEncryptionKey, encryptEntry, decryptEntry } from '@/lib/crypto';
import { getVaultCredentials, updateVaultCredentials, getAllEntries, saveEntries, type StoredEntry } from '@/lib/db-local';
import type { DecryptedEntry } from '@/store';
import { toast } from 'sonner';
import { ShieldCheck, Loader2 } from 'lucide-react';

interface ChangePasswordDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: ChangePasswordDialogProps) {
  const { encryptionKey, encryptionSalt, login, username } = useAuthStore();
  const { entries } = useVaultStore();
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
    if (!encryptionKey || !encryptionSalt) {
      toast.error('Not authenticated');
      return;
    }

    setLoading(true);
    try {
      // 1. Verify current password against stored hash
      const credentials = await getVaultCredentials();
      if (!credentials) {
        toast.error('No vault found');
        return;
      }
      const oldHash = await hashPassword(currentPassword, credentials.salt);
      if (oldHash !== credentials.passwordHash) {
        toast.error('Current password is incorrect');
        return;
      }

      // 2. Generate new salts and hash
      const newSalt = generateSalt();
      const newEncryptionSalt = generateSalt();
      const newHash = await hashPassword(newPassword, newSalt);
      const newKey = await deriveEncryptionKey(newPassword, newEncryptionSalt);

      // 3. Re-encrypt all entries from IndexedDB
      const storedEntries = await getAllEntries();
      const updatedEntries: StoredEntry[] = [];
      for (const entry of storedEntries) {
        const data = await decryptEntry(entry.encryptedData, entry.iv, encryptionKey);
        const { encryptedData, iv } = await encryptEntry(data, newKey);
        updatedEntries.push({ ...entry, encryptedData, iv, updatedAt: new Date().toISOString() });
      }

      // 4. Save everything to IndexedDB
      await updateVaultCredentials({ passwordHash: newHash, salt: newSalt, encryptionSalt: newEncryptionSalt });
      await saveEntries(updatedEntries);

      // 5. Update auth store
      login('local', 'local', username || credentials.name, newKey, newEncryptionSalt);

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