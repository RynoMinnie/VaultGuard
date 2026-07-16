'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  Globe,
  User,
  Mail,
  Lock,
} from 'lucide-react';
import type { DecryptedEntry } from '@/store';
import { toast } from 'sonner';

interface EntryCardProps {
  entry: DecryptedEntry;
  onEdit: (entry: DecryptedEntry) => void;
  onDelete: (id: string) => void;
}

function CopyButton({ text, label }: { text: string; label: string }) {
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

export function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { data } = entry;

  return (
    <Card className="group border-border/60 bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:emerald-glow-sm transition-all duration-300">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-primary shrink-0" />
              <h3 className="font-semibold text-sm truncate">{data.platform}</h3>
            </div>
            {data.platformUrl && (
              <a
                href={
                  data.platformUrl.startsWith('http')
                    ? data.platformUrl
                    : `https://${data.platformUrl}`
                }
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-muted-foreground hover:text-primary transition-colors truncate block mt-0.5 ml-6"
              >
                {data.platformUrl}
                <ExternalLink className="inline h-3 w-3 ml-1" />
              </a>
            )}
          </div>
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    Are you sure you want to delete the entry for &ldquo;{data.platform}&rdquo;? This action
                    cannot be undone.
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

        {/* Fields */}
        <div className="space-y-2 text-xs">
          {data.username && (
            <div className="flex items-center gap-2 bg-muted/40 rounded-md px-2.5 py-1.5">
              <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate flex-1">{data.username}</span>
              <CopyButton text={data.username} label="Username" />
            </div>
          )}

          {data.email && (
            <div className="flex items-center gap-2 bg-muted/40 rounded-md px-2.5 py-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate flex-1">{data.email}</span>
              <CopyButton text={data.email} label="Email" />
            </div>
          )}

          {data.password && (
            <div className="flex items-center gap-2 bg-muted/40 rounded-md px-2.5 py-1.5">
              <Lock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <span className="truncate flex-1 font-mono">
                {showPassword ? data.password : '••••••••••••••••'}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="h-3.5 w-3.5" />
                ) : (
                  <Eye className="h-3.5 w-3.5" />
                )}
              </Button>
              <CopyButton text={data.password} label="Password" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}