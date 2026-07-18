'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Copy,
  Check,
  ExternalLink,
  Edit3,
  Trash2,
  Eye,
  EyeOff,
  FileText,
} from 'lucide-react';
import { PlatformIconDisplay } from '@/lib/platform-icons';
import type { DecryptedEntry } from '@/store';
import { cn } from '@/lib/utils';

import { copyWithAutoClear } from '@/hooks/use-clipboard-auto-clear';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { CategoryTag } from './category-tag';
import { useVaultStore } from '@/store';

interface EntryRowProps {
  entry: DecryptedEntry;
  onEdit: (entry: DecryptedEntry) => void;
  onDelete: (id: string) => void;
}

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    setCopied(true);
    await copyWithAutoClear(text, label);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 shrink-0"
      onClick={copy}
      title={`Copy ${label.toLowerCase()}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </Button>
  );
}

export function EntryRow({ entry, onEdit, onDelete }: EntryRowProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { data } = entry;
  const { touchEntry, toggleSelect, selectedIds } = useVaultStore();
  const isSelected = selectedIds.has(entry.id);

  const updatedDate = entry.updatedAt
    ? format(new Date(entry.updatedAt), 'MMM d, yyyy')
    : '';

  return (
    <div
      className={cn(
        "group flex items-center gap-3 rounded-lg border border-border/40 bg-card/50 hover:bg-card/80 hover:border-primary/20 px-4 py-3 border-glow-subtle transition-all duration-200 cursor-pointer row-hover-accent min-w-[500px]",
        isSelected && 'border-primary/40 bg-primary/5 row-selected'
      )}
      onClick={() => touchEntry(entry.id)}
    >
      {/* Selection checkbox */}
      <button
        className={cn(
          "mr-1 shrink-0 h-4 w-4 rounded border flex items-center justify-center transition-all duration-150 select-check",
          isSelected && "is-active"
        )}
        onClick={(e) => { e.stopPropagation(); toggleSelect(entry.id); }}
        title={isSelected ? 'Deselect' : 'Select'}
        style={{
          backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
          borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
        }}
      >
        {isSelected && <Check className="h-2.5 w-2.5 text-primary-foreground" />}
      </button>
      {/* Platform + Category */}
      <div className="flex-1 min-w-0 flex items-center gap-2">
        <div className="h-6 w-6 rounded-md bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
          <PlatformIconDisplay platform={data.platform} className="h-3.5 w-3.5 text-primary" />
        </div>
        <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-medium text-sm truncate">{data.platform}</span>
          {data.category && <CategoryTag categoryId={data.category as import('./category-tag').CategoryId} size="sm" />}
          {data.platformUrl && (
            <a
              href={
                data.platformUrl.startsWith('http')
                  ? data.platformUrl
                  : `https://${data.platformUrl}`
              }
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
      </div>

      {/* Username */}
      <div className="hidden md:flex items-center gap-1 w-36 shrink-0">
        <span className="text-xs text-muted-foreground truncate">{data.username || '—'}</span>
        {data.username && <CopyBtn text={data.username} label="Username" />}
      </div>

      {/* Email */}
      <div className="hidden lg:flex items-center gap-1 w-44 shrink-0">
        <span className="text-xs text-muted-foreground truncate">{data.email || '—'}</span>
        {data.email && <CopyBtn text={data.email} label="Email" />}
      </div>

      {/* Password */}
      <div className="flex items-center gap-1 w-48 shrink-0">
        <span className="text-xs font-mono text-muted-foreground truncate">
          {data.password
            ? showPassword
              ? data.password
              : '••••••••••••'
            : '—'}
        </span>
        {data.password && (
          <>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
            </Button>
            <CopyBtn text={data.password} label="Password" />
          </>
        )}
      </div>

      {/* Notes - xl screens only */}
      <div className="hidden xl:flex items-center gap-1.5 w-40 shrink-0">
        {data.other ? (
          <span className="text-[11px] text-muted-foreground/60 italic truncate">
            {data.other.length > 30 ? data.other.slice(0, 30) + '...' : data.other}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/30">—</span>
        )}
        <FileText className="h-3 w-3 text-muted-foreground/30 shrink-0" />
      </div>

      {/* Updated */}
      <div className="hidden sm:block text-xs text-muted-foreground w-24 shrink-0 text-right">
        {updatedDate}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={(e) => { e.stopPropagation(); onEdit(entry); }}
          title="Edit"
        >
          <Edit3 className="h-3.5 w-3.5" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              title="Delete"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Entry</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete &ldquo;{data.platform}&rdquo;? This cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  onDelete(entry.id);
                  toast.success('Entry deleted');
                }}
                className="bg-destructive text-white hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}