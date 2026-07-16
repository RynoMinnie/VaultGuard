'use client';

import { useState, useRef } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuthStore, useVaultStore } from '@/store';
import { decryptEntry } from '@/lib/crypto';
import { toast } from 'sonner';
import { Loader2, FileDown, FileUp, AlertTriangle } from 'lucide-react';

interface ImportExportDialogProps {
  mode: 'export' | 'import';
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ImportExportDialog({ mode, open, onOpenChange }: ImportExportDialogProps) {
  const { token } = useAuthStore();
  const { entries, setEntries, addEntry } = useVaultStore();
  const [importMode, setImportMode] = useState<'merge' | 'replace'>('merge');
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/vault/export', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error('Export failed');

      const data = await res.json();

      // Create and download file
      const blob = new Blob([JSON.stringify(data.exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `vault-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success(`Exported ${data.exportData.entryCount} entries`);
      onOpenChange(false);
    } catch {
      toast.error('Failed to export vault');
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!token || !selectedFile) return;
    setLoading(true);
    try {
      const text = await selectedFile.text();
      const data = JSON.parse(text);

      if (!data.entries || !Array.isArray(data.entries)) {
        throw new Error('Invalid vault file format');
      }

      const res = await fetch('/api/vault/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ mode: importMode, entries: data.entries }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Import failed');
      }

      const result = await res.json();

      // Refresh entries from server
      await fetchEntries();

      toast.success(`Imported ${result.importedCount} entries (${importMode} mode)`);
      onOpenChange(false);
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to import vault');
    } finally {
      setLoading(false);
    }
  };

  const fetchEntries = async () => {
    if (!token) return;
    try {
      const res = await fetch('/api/vault/entries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const { entries: rawEntries } = await res.json();

      const { encryptionKey } = useAuthStore.getState();
      if (!encryptionKey) return;

      const decrypted: import('@/store').DecryptedEntry[] = [];
      for (const e of rawEntries) {
        try {
          const data = await decryptEntry(e.encryptedData, e.iv, encryptionKey);
          decrypted.push({
            id: e.id,
            data,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt,
          });
        } catch {
          // Skip entries that can't be decrypted
        }
      }
      setEntries(decrypted);
    } catch {
      // Silent fail
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {mode === 'export' ? (
              <FileDown className="h-5 w-5 text-primary" />
            ) : (
              <FileUp className="h-5 w-5 text-primary" />
            )}
            {mode === 'export' ? 'Export Vault' : 'Import Vault'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'export'
              ? 'Download your encrypted vault data as a JSON file. Entries remain encrypted.'
              : 'Import encrypted vault entries from a JSON file.'}
          </DialogDescription>
        </DialogHeader>

        {mode === 'export' ? (
          <div className="py-4 space-y-3">
            <div className="rounded-lg border border-border bg-muted/30 p-4 text-center space-y-2">
              <FileDown className="h-10 w-10 mx-auto text-primary" />
              <p className="text-sm text-muted-foreground">
                Your vault contains <strong className="text-foreground">{entries.length}</strong>{' '}
                encrypted {entries.length === 1 ? 'entry' : 'entries'}.
              </p>
              <p className="text-xs text-muted-foreground">
                The exported file contains encrypted data that can only be decrypted with your
                master password.
              </p>
            </div>
          </div>
        ) : (
          <div className="py-4 space-y-4">
            <div
              className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files[0];
                if (file && file.name.endsWith('.json')) {
                  setSelectedFile(file);
                }
              }}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                className="hidden"
                onChange={(e) => setSelectedFile(e.target.files?.[0] ?? null)}
              />
              {selectedFile ? (
                <div className="space-y-1">
                  <FileUp className="h-8 w-8 mx-auto text-primary" />
                  <p className="text-sm font-medium">{selectedFile.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <FileUp className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Click to select or drag & drop a JSON file
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Import Mode</Label>
              <Select value={importMode} onValueChange={(v) => setImportMode(v as 'merge' | 'replace')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="merge">Merge — Add to existing entries</SelectItem>
                  <SelectItem value="replace">Replace — Overwrite all entries</SelectItem>
                </SelectContent>
              </Select>
              {importMode === 'replace' && (
                <div className="flex items-start gap-2 text-destructive text-xs bg-destructive/10 rounded-md p-2.5">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <span>
                    Replace mode will delete all your current entries. This action cannot be undone.
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={mode === 'export' ? handleExport : handleImport}
            disabled={
              loading || (mode === 'import' && !selectedFile) || (mode === 'export' && entries.length === 0)
            }
            className="min-w-[100px]"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : mode === 'export' ? (
              <FileDown className="h-4 w-4 mr-2" />
            ) : (
              <FileUp className="h-4 w-4 mr-2" />
            )}
            {mode === 'export' ? 'Export' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}