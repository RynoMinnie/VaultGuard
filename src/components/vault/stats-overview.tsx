'use client';

import { useMemo, useEffect, useRef, useState } from 'react';
import { useVaultStore } from '@/store';
import { Shield, KeyRound, Lock, Star, Clock, FolderOpen, TrendingUp, CalendarClock, AlertTriangle, HeartPulse, ShieldCheck } from 'lucide-react';
import { CATEGORIES } from './category-tag';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

function useAnimatedCount(target: number, duration: number = 600) {
  const [count, setCount] = useState(0);
  const prevTarget = useRef(0);
  const animRef = useRef<number>(0);
  const startTime = useRef<number>(0);

  useEffect(() => {
    if (target === prevTarget.current) return;
    const startVal = prevTarget.current;
    prevTarget.current = target;
    startTime.current = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) {
        animRef.current = requestAnimationFrame(animate);
      }
    };
    animRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animRef.current);
  }, [target, duration]);

  return count;
}

export function StatsOverview() {
  const { entries } = useVaultStore();

  const stats = useMemo(() => {
    const total = entries.length;
    const favorites = entries.filter((e) => e.data.isFavorite).length;
    const withPassword = entries.filter((e) => e.data.password).length;
    const withUrl = entries.filter((e) => e.data.platformUrl).length;
    const withCategory = entries.filter((e) => e.data.category).length;
    const accessedRecently = entries.filter((e) => {
      if (!e.data.lastAccessed) return false;
      return Date.now() - new Date(e.data.lastAccessed).getTime() < 24 * 60 * 60 * 1000;
    }).length;

    const expiringSoon = entries.filter((e) => {
      if (!e.data.expiryDate) return false;
      const now = new Date();
      const expiry = new Date(e.data.expiryDate);
      const sevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      return expiry <= sevenDays;
    }).length;

    const expired = entries.filter((e) => {
      if (!e.data.expiryDate) return false;
      return new Date(e.data.expiryDate) <= new Date();
    }).length;

    // Most common category
    const catMap = new Map<string, number>();
    entries.forEach((e) => {
      const cat = e.data.category || 'uncategorized';
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
    });
    const topCategory = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1])[0];

    // Password health
    let healthSum = 0;
    let healthCount = 0;
    for (const e of entries) {
      if (!e.data.password) continue;
      const pw = e.data.password;
      let s = 50;
      if (pw.length >= 8) s += 10;
      if (pw.length >= 12) s += 15;
      if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s += 10;
      if (/[0-9]/.test(pw)) s += 10;
      if (/[^a-zA-Z0-9]/.test(pw)) s += 10;
      if (/password|123456|qwerty|abc123|letmein|admin|welcome|monkey/i.test(pw)) s -= 15;
      if (/(.)\1{2,}/.test(pw)) s -= 10;
      healthSum += Math.max(0, Math.min(100, s));
      healthCount++;
    }
    const passwordHealth = healthCount > 0 ? Math.round(healthSum / healthCount) : 0;

    const with2FA = entries.filter((e) => e.data.totpSecret).length;

    return { total, favorites, withPassword, withUrl, withCategory, accessedRecently, expiringSoon, expired, topCategory, passwordHealth, with2FA };
  }, [entries]);

  return (
    <TooltipProvider delayDuration={200}>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-9 gap-3 animate-fade-in">
        <StatCard
          icon={<KeyRound className="h-4 w-4 text-primary" />}
          label="Total Entries"
          value={useAnimatedCount(stats.total)}
          accent
          tooltip="Total number of vault entries"
        />
        <StatCard
          icon={<Star className="h-4 w-4 text-amber-400" />}
          label="Favorites"
          value={useAnimatedCount(stats.favorites)}
          accentColor="border-l-amber-400/50 hover:bg-amber-500/5"
          tooltip="Entries marked as favorites"
        />
        <StatCard
          icon={<Lock className="h-4 w-4 text-emerald-400" />}
          label="With Password"
          value={useAnimatedCount(stats.withPassword)}
          accentColor="border-l-emerald-400/50 hover:bg-emerald-500/5"
          tooltip="Entries with a password stored"
        />
        <StatCard
          icon={<FolderOpen className="h-4 w-4 text-cyan-400" />}
          label="With URL"
          value={useAnimatedCount(stats.withUrl)}
          accentColor="border-l-cyan-400/50 hover:bg-cyan-500/5"
          tooltip="Entries with a URL link"
        />
        <StatCard
          icon={<Clock className="h-4 w-4 text-purple-400" />}
          label="Accessed Today"
          value={useAnimatedCount(stats.accessedRecently)}
          accentColor="border-l-purple-400/50 hover:bg-purple-500/5"
          tooltip="Entries accessed in the last 24 hours"
        />
        <StatCard
          icon={<AlertTriangle className="h-4 w-4 text-red-400" />}
          label="Expiring Soon"
          value={useAnimatedCount(stats.expiringSoon)}
          accentColor="border-l-red-400/50 hover:bg-red-500/5"
          tooltip="Entries expiring within 7 days or already expired"
          highlight={stats.expiringSoon > 0}
        />
        <StatCard
          icon={<HeartPulse className="h-4 w-4" style={{ color: stats.passwordHealth >= 70 ? 'oklch(0.7 0.15 162)' : stats.passwordHealth >= 40 ? 'oklch(0.8 0.15 85)' : 'oklch(0.7 0.2 25)' }} />}
          label="Password Health"
          value={`${useAnimatedCount(stats.passwordHealth)}%`}
          accentColor={cn(
            stats.passwordHealth >= 70 ? 'border-l-emerald-400/50 hover:bg-emerald-500/5' : '',
            stats.passwordHealth >= 40 && stats.passwordHealth < 70 ? 'border-l-amber-400/50 hover:bg-amber-500/5' : '',
            stats.passwordHealth < 40 && stats.passwordHealth > 0 ? 'border-l-red-400/50 hover:bg-red-500/5' : '',
            stats.passwordHealth === 0 && 'opacity-50'
          )}
          tooltip="Average password strength across all entries"
        />
        <StatCard
          icon={<TrendingUp className="h-4 w-4 text-teal-400" />}
          label="Top Category"
          value={stats.topCategory ? CATEGORIES.find((c) => c.id === stats.topCategory[0])?.label || '—' : '—'}
          small
          accentColor="border-l-teal-400/50 hover:bg-teal-500/5"
          tooltip="Your most used category"
        />
        <StatCard
          icon={<ShieldCheck className="h-4 w-4 text-emerald-400" />}
          label="2FA Enabled"
          value={useAnimatedCount(stats.with2FA)}
          accentColor={stats.with2FA > 0 ? 'border-l-emerald-400/50 hover:bg-emerald-500/5' : 'opacity-50'}
          tooltip="Entries with TOTP/2FA secret configured"
        />
      </div>
    </TooltipProvider>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
  small,
  accentColor,
  tooltip,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: boolean;
  small?: boolean;
  accentColor?: string;
  tooltip: string;
  highlight?: boolean;
}) {
  const card = (
    <div
      className={cn(
        'rounded-xl border border-border/40 bg-card/50 p-3 space-y-1.5 transition-all duration-300 border-l-[3px] stat-card-hover',
        accent ? 'border-l-primary/50 hover:bg-primary/5 border-primary/20 bg-primary/5' : '',
        accentColor || '',
        highlight && 'animate-pulse-glow'
      )}
    >
      <div className="flex items-center gap-2 text-muted-foreground/60">
        {icon}
        <span className={cn('text-[10px] uppercase tracking-wider', small ? 'text-[9px]' : '')}>{label}</span>
      </div>
      <p className={cn('font-semibold leading-tight tabular-nums', small ? 'text-sm' : 'text-xl')}>{value}</p>
    </div>
  );

  if (!tooltip) return card;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {card}
      </TooltipTrigger>
      <TooltipContent side="bottom" className="text-xs popover-glow">
        {tooltip}
      </TooltipContent>
    </Tooltip>
  );
}