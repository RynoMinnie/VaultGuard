'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import {
  Copy,
  Check,
  ExternalLink,
  Edit3,
  Star,
  Trash2,
  Eye,
  EyeOff,
  Globe,
  User,
  Mail,
  Lock,
  Clock,
  FileText,
  Shield,
  ShieldAlert,
  ShieldCheck,
  CalendarClock,
  AlertTriangle,
  CopyX,
  ClipboardCopy,
  KeyRound,
  History,
  Tags,
  TrendingUp,
} from 'lucide-react';
import { CategoryTag, type CategoryId } from './category-tag';
import { PasswordStrengthMeter } from './password-strength-meter';
import { useVaultStore, type DecryptedEntry } from '@/store';
import type { PasswordHistoryEntry } from '@/lib/crypto';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface EntryDetailSheetProps {
  entry: DecryptedEntry | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (entry: DecryptedEntry) => void;
  onDuplicate: (entry: DecryptedEntry) => void;
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
      size="sm"
      className="h-8 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-primary/10"
      onClick={copy}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
      {label}
    </Button>
  );
}

function getExpiryStatus(expiryDate: string): 'expired' | 'expiring-soon' | 'valid' | null {
  if (!expiryDate) return null;
  const now = new Date();
  const expiry = new Date(expiryDate);
  if (expiry <= now) return 'expired';
  if (expiry <= new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)) return 'expiring-soon';
  return 'valid';
}

function ExpiryInfo({ expiryDate }: { expiryDate: string }) {
  const status = getExpiryStatus(expiryDate);
  if (!status) return null;

  const daysLeft = Math.ceil((new Date(expiryDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (status === 'expired') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2.5">
        <AlertTriangle className="h-4 w-4 text-red-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-red-400">Expired</p>
          <p className="text-[11px] text-red-400/60">
            Expired {formatDistanceToNow(new Date(expiryDate), { addSuffix: true })} · {format(new Date(expiryDate), 'MMM d, yyyy')}
          </p>
        </div>
      </div>
    );
  }
  if (status === 'expiring-soon') {
    return (
      <div className="flex items-center gap-2 rounded-lg bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
        <CalendarClock className="h-4 w-4 text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-amber-400">Expiring Soon</p>
          <p className="text-[11px] text-amber-400/60">
            {daysLeft} day{daysLeft !== 1 ? 's' : ''} remaining · {format(new Date(expiryDate), 'MMM d, yyyy')}
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2.5">
      <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-emerald-400">Valid</p>
        <p className="text-[11px] text-emerald-400/60">
          Expires {format(new Date(expiryDate), 'MMM d, yyyy')} · {daysLeft} days remaining
        </p>
      </div>
    </div>
  );
}

function BreachCheck({ password }: { password: string }) {
  const [visible, setVisible] = useState(false);
  const score = useMemo(() => {
    if (!password) return null;
    const len = password.length;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNum = /[0-9]/.test(password);
    const hasSym = /[^a-zA-Z0-9]/.test(password);
    const hasCommon = /password|123456|qwerty|abc123|letmein|admin|welcome|monkey/i.test(password);
    const hasSeq = /(.)\1{2,}/.test(password);

    let s = 50;
    if (len >= 12) s += 10;
    if (len >= 16) s += 10;
    if (hasUpper && hasLower) s += 10;
    if (hasNum) s += 5;
    if (hasSym) s += 10;
    if (hasCommon) s -= 20;
    if (hasSeq) s -= 15;
    return Math.max(0, Math.min(100, s));
  }, [password]);

  useEffect(() => {
    if (!password) return;
    const timer = setTimeout(() => setVisible(true), 400);
    return () => { clearTimeout(timer); setVisible(false); };
  }, [password]);

  const getLevel = (s: number) => {
    if (s >= 80) return { label: 'Strong', color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    if (s >= 50) return { label: 'Moderate', color: 'text-amber-400', bg: 'bg-amber-500/10', border: 'border-amber-500/20' };
    return { label: 'Weak', color: 'text-red-400', bg: 'bg-red-500/10', border: 'border-red-500/20' };
  };

  if (!visible && score !== null) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <ShieldAlert className="h-3.5 w-3.5 animate-pulse" />
        Checking...
      </div>
    );
  }

  if (score === null) return null;

  const level = getLevel(score);
  return (
    <div className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 ${level.bg} ${level.border} border`}>
      {level.label === 'Strong' ? (
        <ShieldCheck className="h-4 w-4 text-emerald-400" />
      ) : level.label === 'Moderate' ? (
        <ShieldAlert className="h-4 w-4 text-amber-400" />
      ) : (
        <ShieldAlert className="h-4 w-4 text-red-400" />
      )}
      <span className={`text-xs font-medium ${level.color}`}>
        Breach Risk: {score}%
      </span>
    </div>
  );
}

export function EntryDetailSheet({ entry, open, onOpenChange, onEdit, onDuplicate, onDelete }: EntryDetailSheetProps) {
  const { toggleFavorite, touchEntry } = useVaultStore();
  const [showPassword, setShowPassword] = useState(false);

  if (!entry) return null;

  const { data, id, createdAt, updatedAt } = entry;
  const isFav = data.isFavorite;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-lg custom-scrollbar">
        {/* Header gradient */}
        <div className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent px-6 pt-6 pb-2 -mx-6 -mt-6">
          <SheetHeader className="text-left">
            <SheetTitle className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                <Globe className="h-5 w-5 text-primary" />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-bold truncate">{data.platform}</h2>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {data.category && <CategoryTag categoryId={data.category as CategoryId} size="sm" />}
                  {data.totpSecret && (
                    <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/25 text-[10px] h-5 gap-1 px-1.5 font-medium">
                      <KeyRound className="h-3 w-3" />
                      2FA Enabled
                    </Badge>
                  )}
                  {data.expiryDate && (() => {
                    const status = getExpiryStatus(data.expiryDate);
                    if (status === 'expired') {
                      return <Badge className="bg-red-500/15 text-red-400 border-red-500/25 text-[10px] h-5 gap-1 px-1.5 font-medium"><AlertTriangle className="h-3 w-3" />Expired</Badge>;
                    }
                    if (status === 'expiring-soon') {
                      return <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/25 text-[10px] h-5 gap-1 px-1.5 font-medium"><CalendarClock className="h-3 w-3" />Expiring Soon</Badge>;
                    }
                    return null;
                  })()}
                  {data.platformUrl && (
                    <a
                      href={data.platformUrl.startsWith('http') ? data.platformUrl : `https://${data.platformUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-muted-foreground hover:text-primary truncate"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {data.platformUrl.replace(/^https?:\/\//, '')}
                      <ExternalLink className="inline h-3 w-3 ml-0.5 opacity-60" />
                    </a>
                  )}
                </div>
              </div>
            </SheetTitle>
          </SheetHeader>
        </div>

        <div className="px-6 py-4 space-y-5 sheet-content-animate">
          {/* Quick actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 min-w-0 h-9 gap-1.5"
              onClick={() => {
                toggleFavorite(id);
                toast.success(isFav ? 'Removed from favorites' : 'Added to favorites');
              }}
            >
              <Star className={`h-4 w-4 ${isFav ? 'fill-amber-400 text-amber-400' : 'text-muted-foreground'}`} />
              {isFav ? 'Unfavorite' : 'Favorite'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => { onEdit(entry); onOpenChange(false); }}
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => { onDuplicate(entry); onOpenChange(false); }}
            >
              <CopyX className="h-4 w-4" />
              Duplicate
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5"
              onClick={() => {
                const text = [
                  `Platform: ${data.platform}`,
                  data.platformUrl ? `URL: ${data.platformUrl}` : '',
                  data.username ? `Username: ${data.username}` : '',
                  data.email ? `Email: ${data.email}` : '',
                  data.password ? `Password: ${data.password}` : '',
                  data.totpSecret ? `TOTP Secret: ${data.totpSecret}` : '',
                  data.other ? `Notes: ${data.other}` : '',
                ].filter(Boolean).join('\n');
                navigator.clipboard.writeText(text).then(
                  () => toast.success('All credentials copied'),
                  () => toast.error('Failed to copy')
                );
              }}
            >
              <ClipboardCopy className="h-4 w-4" />
              <span className="hidden sm:inline">Copy All</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 gap-1.5 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                onDelete(id);
                toast.success('Entry deleted');
                onOpenChange(false);
              }}
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          </div>

          <div className="divider-gradient" />

          {/* Credential fields */}
          <div className="space-y-4">
            <DetailField icon={<Globe className="h-4 w-4" />} label="Platform" value={data.platform || '—'} />
            <DetailField icon={<ExternalLink className="h-4 w-4" />} label="URL" value={data.platformUrl || '—'} isLink />
            <DetailField icon={<User className="h-4 w-4" />} label="Username" value={data.username} copyable />
            <DetailField icon={<Mail className="h-4 w-4" />} label="Email" value={data.email} copyable />
            <DetailField
              icon={<Lock className="h-4 w-4" />}
              label="Password"
              value={data.password || '—'}
              copyable
              isPassword
              showPassword={showPassword}
              onToggle={() => { setShowPassword(!showPassword); if (!showPassword) touchEntry(id); }}
            />
            <DetailField icon={<FileText className="h-4 w-4" />} label="Notes" value={data.other || '—'} multiline />
            {data.tags && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                  <Tags className="h-4 w-4" />
                  Tags
                </label>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {data.tags.split(',').map((t, i) => {
                    const trimmed = t.trim();
                    if (!trimmed) return null;
                    return (
                      <span
                        key={i}
                        className="inline-flex items-center rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/25 px-2.5 py-0.5 text-[11px] font-medium"
                      >
                        {trimmed}
                      </span>
                    );
                  })}
                </div>
              </div>
            )}
            {data.totpSecret && (
              <div className="space-y-1.5">
                <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
                  <KeyRound className="h-4 w-4" />
                  2FA / TOTP Secret
                </label>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded-lg bg-muted/40 px-3 py-2 font-mono text-sm break-all tracking-wide">
                    {data.totpSecret}
                  </code>
                  <CopyBtn text={data.totpSecret} label="TOTP" />
                </div>
              </div>
            )}
          </div>

          {/* Expiry info */}
          {data.expiryDate && (
            <>
              <div className="divider-gradient" />
              <div className="space-y-2">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <CalendarClock className="h-3.5 w-3.5" />
                  Expiry Status
                </h4>
                <ExpiryInfo expiryDate={data.expiryDate} />
              </div>
            </>
          )}

          <div className="divider-gradient" />

          {/* Password analysis */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Shield className="h-3.5 w-3.5" />
              Password Analysis
            </h4>
            <PasswordStrengthMeter password={data.password} />
            <BreachCheck password={data.password} />
          </div>

          <div className="divider-gradient" />

          {/* Password History */}
          {data.passwordHistory && data.passwordHistory.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <History className="h-3.5 w-3.5" />
                Password History
              </h4>
              {/* Strength Trend */}
              <StrengthTrend currentPassword={data.password} history={data.passwordHistory} />
              <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
                {data.passwordHistory.slice(-5).reverse().map((hEntry: PasswordHistoryEntry, idx: number) => (
                  <PasswordHistoryItem key={idx} entry={hEntry} />
                ))}
                {data.passwordHistory.length > 5 && (
                  <p className="text-[11px] text-muted-foreground text-center pt-1">
                    Showing last 5 of {data.passwordHistory.length}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="divider-gradient" />

          {/* Metadata */}
          <div className="space-y-2 text-[11px] text-muted-foreground">
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Created: {format(new Date(createdAt), 'MMM d, yyyy HH:mm')}
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-3 w-3" />
              Modified: {format(new Date(updatedAt), 'MMM d, yyyy HH:mm')}
            </div>
            {data.lastAccessed && (
              <div className="flex items-center gap-2">
                <Clock className="h-3 w-3" />
                Last accessed: {formatDistanceToNow(new Date(data.lastAccessed), { addSuffix: true })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-border/40 px-6 py-3 bg-muted/20 -mx-6 -mb-6 rounded-b-xl">
          <div className="flex items-center justify-between text-[10px] text-muted-foreground/50">
            <span>ID: {id.slice(0, 8)}…</span>
            <span>Encrypted with AES-256-GCM</span>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

function calculateStrengthScore(password: string): number {
  if (!password) return 0;
  let s = 50;
  if (password.length >= 8) s += 10;
  if (password.length >= 12) s += 15;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) s += 10;
  if (/[0-9]/.test(password)) s += 10;
  if (/[^a-zA-Z0-9]/.test(password)) s += 10;
  if (/password|123456|qwerty|abc123|letmein|admin|welcome|monkey/i.test(password)) s -= 15;
  if (/(.)\1{2,}/.test(password)) s -= 10;
  return Math.max(0, Math.min(100, s));
}

function getBarColor(score: number): string {
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-red-500';
}

function getBarGlow(score: number): string {
  if (score >= 70) return 'shadow-emerald-500/30';
  if (score >= 40) return 'shadow-amber-500/30';
  return 'shadow-red-500/30';
}

function StrengthTrend({ currentPassword, history }: { currentPassword: string; history: PasswordHistoryEntry[] }) {
  const items = useMemo(() => {
    const result = history.slice(-5).map((h) => ({
      password: h.password,
      timestamp: h.timestamp,
      score: calculateStrengthScore(h.password),
      isCurrent: false,
    }));
    result.push({
      password: currentPassword,
      timestamp: new Date().toISOString(),
      score: calculateStrengthScore(currentPassword),
      isCurrent: true,
    });
    return result;
  }, [currentPassword, history]);

  // Only show if 2+ entries
  if (items.length < 2) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
        <TrendingUp className="h-3 w-3" />
        <span>Strength Trend</span>
      </div>
      <div className="space-y-1.5">
        {items.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 group/trend">
            <span className="text-[10px] text-muted-foreground/60 w-14 shrink-0 tabular-nums">
              {format(new Date(item.timestamp), 'MMM d')}
            </span>
            <div className="flex-1 h-3.5 rounded-full bg-muted/40 overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full transition-all duration-700 ease-out shadow-sm',
                  getBarColor(item.score),
                  getBarGlow(item.score),
                  item.isCurrent && 'ring-1 ring-foreground/20 ring-offset-1 ring-offset-background'
                )}
                style={{ width: `${Math.max(item.score, 2)}%` }}
              />
            </div>
            <span className={cn(
              'text-[10px] tabular-nums w-8 text-right shrink-0 font-medium',
              item.score >= 70 ? 'text-emerald-400' : item.score >= 40 ? 'text-amber-400' : 'text-red-400'
            )}>
              {item.score}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function PasswordHistoryItem({ entry }: { entry: PasswordHistoryEntry }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="flex items-center gap-2 rounded-lg bg-muted/30 border border-border/30 px-3 py-2">
      <div className="flex-1 min-w-0">
        <code className="text-sm font-mono break-all">
          {revealed ? entry.password : '••••••••••••'}
        </code>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(entry.timestamp), { addSuffix: true })}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 shrink-0 hover:bg-primary/10"
        onClick={() => setRevealed(!revealed)}
      >
        {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
      </Button>
      <CopyBtn text={entry.password} label="Password" />
    </div>
  );
}

function DetailField({
  icon,
  label,
  value,
  copyable,
  isLink,
  isPassword,
  showPassword,
  onToggle,
  multiline,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  copyable?: boolean;
  isLink?: boolean;
  isPassword?: boolean;
  showPassword?: boolean;
  onToggle?: () => void;
  multiline?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-wider text-muted-foreground/60 flex items-center gap-1.5">
        {icon}
        {label}
      </label>
      {isPassword ? (
        <div className="flex items-center gap-2">
          <code className="flex-1 rounded-lg bg-muted/40 px-3 py-2 font-mono text-sm break-all">
            {showPassword ? value : '•••••••••••••••••••••••••••••••••••••••••••••••••'}
          </code>
          <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 hover:bg-primary/10" onClick={onToggle}>
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          {copyable && <CopyBtn text={value} label={label} />}
        </div>
      ) : isLink && value !== '—' ? (
        <a
          href={value.startsWith('http') ? value : `https://${value}`}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg bg-muted/40 px-3 py-2 text-sm text-primary hover:bg-muted/60 transition-colors truncate break-all"
        >
          {value}
        </a>
      ) : multiline ? (
        <p className="rounded-lg bg-muted/40 px-3 py-2 text-sm whitespace-pre-wrap break-all min-h-[40px]">
          {value}
        </p>
      ) : (
        <div className="flex items-center gap-2">
          <p className="flex-1 rounded-lg bg-muted/40 px-3 py-2 text-sm break-all">{value || '—'}</p>
          {copyable && value !== '—' && <CopyBtn text={value} label={label} />}
        </div>
      )}
    </div>
  );
}