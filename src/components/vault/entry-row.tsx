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
} from 'lucide-react';
import type { DecryptedEntry } from '@/store';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface EntryRowProps {
  entry: DecryptedEntry;
  onEdit: (entry: DecryptedEntry) => void;
  onDelete: (id: string) => void;
}

function CopyBtn({ text, label }: { text: string; label: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(`${label} copied`);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
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

  const updatedDate = entry.updatedAt
    ? format(new Date(entry.updatedAt), 'MMM d, yyyy')
    : '';

  return (
    <div className="group flex items-center gap-3 rounded-lg border border-border/60 bg-card/60 hover:bg-card/90 hover:border-primary/20 px-4 py-3 transition-all duration-200">
      {/* Platform */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-sm truncate">{data.platform}</span>
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
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
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

      {/* Updated */}
      <div className="hidden sm:block text-xs text-muted-foreground w-24 shrink-0 text-right">
        {updatedDate}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onEdit(entry)}
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