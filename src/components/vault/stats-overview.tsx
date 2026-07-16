'use client';

import { useMemo } from 'react';
import { useVaultStore } from '@/store';
import { Shield, KeyRound, Lock, Star, Clock, FolderOpen, TrendingUp } from 'lucide-react';
import { CATEGORIES } from './category-tag';
import { formatDistanceToNow } from 'date-fns';

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

    // Most common category
    const catMap = new Map<string, number>();
    entries.forEach((e) => {
      const cat = e.data.category || 'uncategorized';
      catMap.set(cat, (catMap.get(cat) || 0) + 1);
    });
    const topCategory = Array.from(catMap.entries()).sort((a, b) => b[1] - a[1])[0];

    // Last activity
    const allAccessed = entries
      .filter((e) => e.data.lastAccessed)
      .sort((a, b) => b.data.lastAccessed.localeCompare(a.data.lastAccessed));
    const lastActivity = allAccessed[0]?.data.lastAccessed;

    return { total, favorites, withPassword, withUrl, withCategory, accessedRecently, topCategory, lastActivity };
  }, [entries]);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 animate-fade-in">
      <StatCard
        icon={<KeyRound className="h-4 w-4 text-primary" />}
        label="Total Entries"
        value={stats.total}
        accent
      />
      <StatCard
        icon={<Star className="h-4 w-4 text-amber-400" />}
        label="Favorites"
        value={stats.favorites}
      />
      <StatCard
        icon={<Lock className="h-4 w-4 text-emerald-400" />}
        label="With Password"
        value={stats.withPassword}
      />
      <StatCard
        icon={<FolderOpen className="h-4 w-4 text-blue-400" />}
        label="With URL"
        value={stats.withUrl}
      />
      <StatCard
        icon={<Clock className="h-4 w-4 text-purple-400" />}
        label="Accessed Today"
        value={stats.accessedRecently}
      />
      <StatCard
        icon={<TrendingUp className="h-4 w-4 text-teal-400" />}
        label="Top Category"
        value={stats.topCategory ? CATEGORIES.find((c) => c.id === stats.topCategory[0])?.label || '—' : '—'}
        small
      />
    </div>
  );
}

function StatCard({
  icon,
  label,
  value,
  accent,
  small,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  accent?: boolean;
  small?: boolean;
}) {
  return (
    <div className={`
      rounded-xl border border-border/40 bg-card/50 p-3 space-y-1.5
      ${accent ? 'border-primary/20 bg-primary/5' : ''}
      transition-colors hover:border-border/60
    `}>
      <div className="flex items-center gap-2 text-muted-foreground/60">
        {icon}
        <span className={`text-[10px] uppercase tracking-wider ${small ? 'text-[9px]' : ''}`}>{label}</span>
      </div>
      <p className={`font-semibold ${small ? 'text-sm' : 'text-lg'} leading-tight`}>{value}</p>
    </div>
  );
}