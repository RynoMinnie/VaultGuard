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
  Clock,
} from 'lucide-react';
import { CategoryTag } from './category-tag';
import type { DecryptedEntry } from '@/store';
import { useVaultStore } from '@/store';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

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
      className="h-7 w-7 shrink-0 hover:bg-primary/10"
      onClick={copy}
      title={`Copy ${label.toLowerCase()}`}
    >
      {copied ? (
        <Check className="h-3.5 w-3.5 text-emerald-400" />
      ) : (
        <Copy className="h-3.5 w-3.5 text-muted-foreground" />
      )}
    </Button>
  );
}

export function EntryCard({ entry, onEdit, onDelete }: EntryCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const { touchEntry } = useVaultStore();
  const { data } = entry;

  const handleCardClick = () => {
    touchEntry(entry.id);
  };

  return (
    <Card
      className="group border-border/50 bg-card/70 backdrop-blur-sm hover:border-primary/30 hover:emerald-glow-sm card-hover-lift transition-all duration-300 animate-scale-in cursor-pointer"
      onClick={handleCardClick}
    >
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <Globe className="h-4 w-4 text-primary" />
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">{data.platform}</h3>
                {data.platformUrl && (
                  <a
                    href={
                      data.platformUrl.startsWith('http')
                        ? data.platformUrl
                        : `https://${data.platformUrl}`
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[11px] text-muted-foreground hover:text-primary transition-colors truncate block mt-0.5"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {data.platformUrl.replace(/^https?:\/\//, '')}
                    <ExternalLink className="inline h-2.5 w-2.5 ml-0.5 opacity-60" />
                  </a>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 hover:bg-primary/10"
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
                  className="h-7 w-7 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                  title="Delete"
                  onClick={(e) => e.stopPropagation()}
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

        {/* Category tag */}
        {data.category && (
          <div className="pl-1">
            <CategoryTag categoryId={data.category as import('./category-tag').CategoryId} size="sm" />
          </div>
        )}

        {/* Fields */}
        <div className="space-y-1.5 text-xs">
          {data.username && (
            <div className="flex items-center gap-2 rounded-md bg-muted/30 px-2.5 py-2 transition-colors hover:bg-muted/50">
              <User className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <span className="truncate flex-1 text-foreground/80">{data.username}</span>
              <CopyButton text={data.username} label="Username" />
            </div>
          )}

          {data.email && (
            <div className="flex items-center gap-2 rounded-md bg-muted/30 px-2.5 py-2 transition-colors hover:bg-muted/50">
              <Mail className="h-3.5 w-3.5 text-muted-foreground/60 shrink-0" />
              <span className="truncate flex-1 text-foreground/80">{data.email}</span>
              <CopyButton text={data.email} label="Email" />
            </div>
          )}

          {data.password && (
            <div className="flex items-center gap-2 rounded-md bg-muted/30 px-2.5 py-2 transition-colors hover:bg-muted/50">
              <Lock className="h-3.5 w-3.5 text-primary/60 shrink-0" />
              <span className="truncate flex-1 font-mono text-foreground/80">
                {showPassword ? data.password : '••••••••••••••••'}
              </span>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 shrink-0 hover:bg-primary/10"
                onClick={(e) => { e.stopPropagation(); setShowPassword(!showPassword); }}
                title={showPassword ? 'Hide' : 'Reveal'}
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

        {/* Footer: last accessed */}
        {data.lastAccessed && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 pt-1 border-t border-border/30">
            <Clock className="h-3 w-3" />
            Accessed {formatDistanceToNow(new Date(data.lastAccessed), { addSuffix: true })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}