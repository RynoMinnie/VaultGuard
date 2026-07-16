'use client';

import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';
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
  Star,
  ChevronRight,
  CalendarClock,
  AlertTriangle,
  CopyCheck,
  CopyX,
  FileText,
  ChevronDown,
} from 'lucide-react';
import { CategoryTag } from './category-tag';
import { cn } from '@/lib/utils';
import type { DecryptedEntry } from '@/store';
import { useVaultStore } from '@/store';
import { toast } from 'sonner';
import { formatDistanceToNow, format } from 'date-fns';

interface EntryCardProps {
  entry: DecryptedEntry;
  onEdit: (entry: DecryptedEntry) => void;
  onDuplicate: (entry: DecryptedEntry) => void;
  onDelete: (id: string) => void;
  onView: (entry: DecryptedEntry) => void;
}

function getExpiryStatus(expiryDate: string): 'expired' | 'expiring-soon' | 'valid' | null {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  if (expiry <= now) return 'expired';
  if (expiry <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) return 'expiring-soon';
  return 'valid';
}

function ExpiryBadge({ expiryDate }: { expiryDate: string }) {
  const status = getExpiryStatus(expiryDate);
  if (!status) return null;

  if (status === 'expired') {
    return (
      <Badge className="bg-red-500/15 text-red-400 border-red-500/25 text-[10px] h-5 gap-1 px-1.5 font-medium">
        <AlertTriangle className="h-3 w-3" />
        Expired
      </Badge>
    );
  }
  if (status === 'expiring-soon') {
    return (
      <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 text-[10px] h-5 gap-1 px-1.5 font-medium">
        <CalendarClock className="h-3 w-3" />
        Expiring Soon
      </Badge>
    );
  }
  return (
    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px] h-5 gap-1 px-1.5 font-medium">
      <Clock className="h-3 w-3" />
      {format(new Date(expiryDate), 'MMM d, yyyy')}
    </Badge>
  );
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

export function EntryCard({ entry, onEdit, onDuplicate, onDelete, onView }: EntryCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [pwCopied, setPwCopied] = useState(false);
  const [notesExpanded, setNotesExpanded] = useState(false);
  const { touchEntry, toggleFavorite, toggleSelect, selectedIds } = useVaultStore();
  const { data } = entry;
  const isFav = data.isFavorite;
  const isSelected = selectedIds.has(entry.id);

  const handleCardClick = () => {
    touchEntry(entry.id);
    onView(entry);
  };

  const handlePasswordFieldClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowPassword(true);
    try {
      await navigator.clipboard.writeText(data.password);
      setPwCopied(true);
      toast.success('Password copied to clipboard');
      setTimeout(() => setPwCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  return (
    <ContextMenu>
      <ContextMenuTrigger>
        <Card
          className={cn(
            "group border-border/50 bg-card/70 backdrop-blur-sm hover:border-primary/30 hover:emerald-glow-sm card-hover-lift transition-all duration-300 animate-scale-in cursor-pointer",
            isSelected && "card-selected"
          )}
        >
          <CardContent className="p-4 space-y-3" onClick={handleCardClick}>
            {/* Selection checkbox */}
            <button
              className={cn(
                "absolute top-2.5 left-2.5 z-10 h-5 w-5 rounded-md border-2 flex items-center justify-center transition-all duration-150 select-check",
                isSelected && "is-active"
              )}
              onClick={(e) => { e.stopPropagation(); toggleSelect(entry.id); }}
              title={isSelected ? 'Deselect' : 'Select'}
              style={{
                backgroundColor: isSelected ? 'var(--primary)' : 'transparent',
                borderColor: isSelected ? 'var(--primary)' : 'var(--border)',
              }}
            >
              {isSelected && <Check className="h-3 w-3 text-primary-foreground" />}
            </button>

            {/* Header */}
            <div className="flex items-start justify-between gap-2">
              <button
                className="min-w-0 flex-1 text-left"
                onClick={() => onView(entry)}
                title="View details"
              >
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-sm truncate">{data.platform}</h3>
                    {data.platformUrl && (
                      <a
                        href={data.platformUrl.startsWith('http') ? data.platformUrl : `https://${data.platformUrl}`}
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
                <ChevronRight className="h-4 w-4 text-muted-foreground/30 group-hover:text-muted-foreground/60 transition-all shrink-0 translate-x-0 group-hover:translate-x-0.5" />
              </button>

              <div className="flex items-center gap-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 hover:bg-primary/10"
                  onClick={(e) => { e.stopPropagation(); toggleFavorite(entry.id); toast.success(isFav ? 'Unstarred' : 'Starred'); }}
                  title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                >
                  <Star className={`h-3.5 w-3.5 transition-colors ${isFav ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground/40 hover:text-amber-400'}`} />
                </Button>
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

            {/* Favorite indicator */}
            {isFav && (
              <div className="flex items-center gap-1 text-[10px] text-amber-400/70">
                <Star className="h-3 w-3 fill-amber-400/70" />
                <span>Favorited</span>
              </div>
            )}

            {/* Category + Expiry row */}
            {(data.category || data.expiryDate) && (
              <div className="flex items-center gap-1.5 flex-wrap pl-1">
                {data.category && (
                  <CategoryTag categoryId={data.category as import('./category-tag').CategoryId} size="sm" />
                )}
                {data.expiryDate && <ExpiryBadge expiryDate={data.expiryDate} />}
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
                <div
                  className="flex items-center gap-2 rounded-md bg-muted/30 px-2.5 py-2 transition-all hover:bg-primary/5 cursor-pointer group/pw"
                  onClick={handlePasswordFieldClick}
                  title="Click to reveal & copy password"
                >
                  <Lock className="h-3.5 w-3.5 text-primary/60 shrink-0" />
                  <span className="truncate flex-1 font-mono text-foreground/80">
                    {showPassword ? data.password : '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022'}
                  </span>
                  {pwCopied ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  ) : (
                    <CopyCheck className="h-3.5 w-3.5 text-muted-foreground/40 group-hover/pw:text-primary/60 shrink-0 transition-colors" />
                  )}
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

            {/* Notes preview */}
            {data.other && (
              <div
                className="flex items-start gap-1.5 text-[11px] text-muted-foreground/60 italic cursor-pointer select-none hover:text-muted-foreground/80 transition-colors"
                onClick={(e) => { e.stopPropagation(); setNotesExpanded(!notesExpanded); }}
              >
                <FileText className="h-3 w-3 shrink-0 mt-0.5" />
                <span className="min-w-0">
                  {notesExpanded
                    ? data.other
                    : data.other.length > 60
                      ? data.other.slice(0, 60) + '...'
                      : data.other
                  }
                </span>
                {data.other.length > 60 && (
                  <ChevronDown className={cn("h-3 w-3 shrink-0 mt-0.5 transition-transform duration-200", notesExpanded && "rotate-180")} />
                )}
              </div>
            )}

            {/* Footer: last accessed */}
            {data.lastAccessed && (
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/50 pt-1 border-t border-border/30">
                <Clock className="h-3 w-3" />
                Accessed {formatDistanceToNow(new Date(data.lastAccessed), { addSuffix: true })}
              </div>
            )}
          </CardContent>
        </Card>
      </ContextMenuTrigger>
      <ContextMenuContent className="w-48">
        <ContextMenuItem onClick={() => onView(entry)}>
          <ExternalLink className="h-4 w-4 mr-2" />
          View Details
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onEdit(entry)}>
          <Edit3 className="h-4 w-4 mr-2" />
          Edit
        </ContextMenuItem>
        <ContextMenuItem onClick={() => onDuplicate(entry)}>
          <CopyX className="h-4 w-4 mr-2" />
          Duplicate
        </ContextMenuItem>
        <ContextMenuSeparator />
        <ContextMenuItem
          className="text-destructive focus:text-destructive"
          onClick={() => { onDelete(entry.id); toast.success('Entry deleted'); }}
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </ContextMenuItem>
      </ContextMenuContent>
    </ContextMenu>
  );
}