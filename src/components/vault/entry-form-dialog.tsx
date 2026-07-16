'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PasswordGenerator } from './password-generator';
import { PasswordStrengthMeter } from './password-strength-meter';
import { CategoryPicker, type CategoryId } from './category-tag';
import { useAuthStore } from '@/store';
import { encryptEntry } from '@/lib/crypto';
import type { VaultEntryData } from '@/lib/crypto';
import type { DecryptedEntry } from '@/store';
import { toast } from 'sonner';
import { Loader2, Save, Tag, CalendarClock } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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
  category: '',
  lastAccessed: '',
  isFavorite: false,
  expiryDate: '',
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
      const saveData = { ...data, lastAccessed: entry?.data.lastAccessed || '', isFavorite: entry?.data.isFavorite ?? false };
      const { encryptedData, iv } = await encryptEntry(saveData, encryptionKey);

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
          data: saveData,
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
          data: saveData,
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
          <DialogTitle className="text-lg font-semibold flex items-center gap-2">
            {isEditing ? (
              <>
                <div className="h-6 w-1 rounded-full bg-primary" />
                Edit Entry
              </>
            ) : (
              <>
                <div className="h-6 w-1 rounded-full bg-primary" />
                New Entry
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground -mt-1">
            {isEditing ? 'Update your password entry details.' : 'Add a new credential to your vault.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Platform */}
          <div className="space-y-2">
            <Label htmlFor="platform" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Platform *
            </Label>
            <Input
              ref={platformRef}
              id="platform"
              value={data.platform}
              onChange={(e) => updateField('platform', e.target.value)}
              placeholder="e.g. Netflix, Gmail, GitHub"
              className="h-10"
            />
          </div>

          {/* URL + Category row */}
          <div className="grid grid-cols-[1fr_auto] gap-3 items-end">
            <div className="space-y-2">
              <Label htmlFor="platformUrl" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                URL
              </Label>
              <Input
                id="platformUrl"
                value={data.platformUrl}
                onChange={(e) => updateField('platformUrl', e.target.value)}
                placeholder="https://..."
                className="h-10"
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2.5">
            <Label className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <Tag className="h-3 w-3" />
              Category
            </Label>
            <CategoryPicker
              value={data.category as CategoryId}
              onChange={(v) => updateField('category', v)}
            />
          </div>

          <Separator className="opacity-50" />

          {/* Username + Email */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Username
              </Label>
              <Input
                id="username"
                value={data.username}
                onChange={(e) => updateField('username', e.target.value)}
                placeholder="john_doe"
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={data.email}
                onChange={(e) => updateField('email', e.target.value)}
                placeholder="john@example.com"
                className="h-10"
              />
            </div>
          </div>

          {/* Password generator with strength meter */}
          <div className="space-y-3">
            <PasswordGenerator
              value={data.password}
              onChange={(pw) => updateField('password', pw)}
            />
            <PasswordStrengthMeter password={data.password} />
          </div>

          {/* Expiry Date */}
          <div className="space-y-2">
            <Label htmlFor="expiryDate" className="text-xs font-medium uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <CalendarClock className="h-3 w-3" />
              Expiry Date (Optional)
            </Label>
            <Input
              id="expiryDate"
              type="date"
              value={data.expiryDate}
              onChange={(e) => updateField('expiryDate', e.target.value)}
              className="h-10"
              min={new Date().toISOString().split('T')[0]}
            />
            {data.expiryDate && (
              <p className="text-[11px] text-muted-foreground">
                {new Date(data.expiryDate) < new Date()
                  ? 'This entry has already expired'
                  : new Date(data.expiryDate) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                    ? 'Expiring within 7 days'
                    : 'Password expiry reminder will show when within 7 days'}
              </p>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="other" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Notes
            </Label>
            <Textarea
              id="other"
              value={data.other}
              onChange={(e) => updateField('other', e.target.value)}
              placeholder="Additional notes or information..."
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/50">
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={saving}
            className="text-muted-foreground"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || !data.platform.trim()}
            className="min-w-[110px] shadow-lg shadow-primary/20"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {isEditing ? 'Update' : 'Save Entry'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}