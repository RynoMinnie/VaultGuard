'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PasswordGenerator } from './password-generator';
import { useAuthStore } from '@/store';
import { encryptEntry } from '@/lib/crypto';
import type { VaultEntryData } from '@/lib/crypto';
import type { DecryptedEntry } from '@/store';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

interface EntryFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  entry?: DecryptedEntry | null;
  onSaved: (entry: DecryptedEntry) => void;
  onUpdated: (entry: DecryptedEntry) => void;
}

const emptyData: VaultEntryData = {
  platform: '',
  platformUrl: '',
  username: '',
  email: '',
  password: '',
  other: '',
};

export function EntryFormDialog({
  open,
  onOpenChange,
  entry,
  onSaved,
  onUpdated,
}: EntryFormDialogProps) {
  const { encryptionKey, token } = useAuthStore();
  const [data, setData] = useState<VaultEntryData>(emptyData);
  const [saving, setSaving] = useState(false);
  const platformRef = useRef<HTMLInputElement>(null);

  const isEditing = !!entry;

  useEffect(() => {
    if (open) {
      if (entry) {
        setData(entry.data);
      } else {
        setData(emptyData);
      }
      setTimeout(() => platformRef.current?.focus(), 100);
    }
  }, [open, entry]);

  const handleSave = async () => {
    if (!data.platform.trim()) {
      toast.error('Platform name is required');
      return;
    }
    if (!encryptionKey || !token) {
      toast.error('Not authenticated');
      return;
    }

    setSaving(true);
    try {
      const { encryptedData, iv } = await encryptEntry(data, encryptionKey);

      if (isEditing) {
        const res = await fetch(`/api/vault/entries/${entry.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ encryptedData, iv }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to update');
        }

        const { entry: updated } = await res.json();
        onUpdated({
          id: updated.id,
          data,
          createdAt: updated.createdAt,
          updatedAt: updated.updatedAt,
        });
        toast.success('Entry updated successfully');
      } else {
        const res = await fetch('/api/vault/entries', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ encryptedData, iv }),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to create');
        }

        const { entry: created } = await res.json();
        onSaved({
          id: created.id,
          data,
          createdAt: created.createdAt,
          updatedAt: created.updatedAt,
        });
        toast.success('Entry created successfully');
      }

      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field: keyof VaultEntryData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto custom-scrollbar">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold">
            {isEditing ? 'Edit Entry' : 'New Entry'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="platform">Platform *</Label>
            <Input
              ref={platformRef}
              id="platform"
              value={data.platform}
              onChange={(e) => updateField('platform', e.target.value)}
              placeholder="e.g. Netflix, Gmail, GitHub"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="platformUrl">Platform URL</Label>
            <Input
              id="platformUrl"
              value={data.platformUrl}
              onChange={(e) => updateField('platformUrl', e.target.value)}
              placeholder="https://..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={data.username}
                onChange={(e) => updateField('username', e.target.value)}
                placeholder="john_doe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="john@example.com"
              />
            </div>
          </div>

          <PasswordGenerator
            value={data.password}
            onChange={(pw) => updateField('password', pw)}
          />

          <div className="space-y-2">
            <Label htmlFor="other">Notes</Label>
            <Textarea
              id="other"
              value={data.other}
              onChange={(e) => updateField('other', e.target.value)}
              placeholder="Additional notes or information..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !data.platform.trim()}
            className="min-w-[100px]"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isEditing ? 'Update' : 'Save'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}