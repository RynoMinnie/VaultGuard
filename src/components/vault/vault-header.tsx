'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  LayoutGrid,
  List,
  ArrowUpDown,
  FileDown,
  FileUp,
  KeyRound,
  Plus,
  ChevronUp,
  ChevronDown,
  X,
  Keyboard,
  Tag,
  Star,
  ShieldCheck,
  AlertTriangle,
  Lock,
  FileText,
  ShieldAlert,
  Tags,
} from 'lucide-react';
import { useVaultStore, type SortField, type SortDirection } from '@/store';
import { CATEGORIES, type CategoryId, CategoryTag } from './category-tag';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface VaultHeaderProps {
  onAddEntry: () => void;
  onExport: () => void;
  onImport: () => void;
  onChangePassword: () => void;
}

const sortFields: { value: SortField; label: string }[] = [
  { value: 'platform', label: 'Platform' },
  { value: 'username', label: 'Username' },
  { value: 'email', label: 'Email' },
  { value: 'category', label: 'Category' },
  { value: 'lastAccessed', label: 'Last Accessed' },
  { value: 'updatedAt', label: 'Last Modified' },
  { value: 'createdAt', label: 'Created' },
];

export function VaultHeader({
  onAddEntry,
  onExport,
  onImport,
  onChangePassword,
}: VaultHeaderProps) {
  const {
    entries,
    searchQuery,
    setSearchQuery,
    viewMode,
    setViewMode,
    sortField,
    sortDirection,
    setSort,
    categoryFilter,
    setCategoryFilter,
    favoriteFilter,
    setFavoriteFilter,
    getCategories,
    getTags,
    getFilteredAndSorted,
    tagFilter,
    setTagFilter,
  } = useVaultStore();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [auditOpen, setAuditOpen] = useState(false);

  const auditData = useMemo(() => {
    const total = entries.length;
    let weakCount = 0;
    let expiredCount = 0;
    let noNotesCount = 0;

    for (const e of entries) {
      // Weak password check (score < 40%)
      const pw = e.data.password;
      if (pw) {
        let s = 50;
        if (pw.length >= 8) s += 10;
        if (pw.length >= 12) s += 15;
        if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) s += 10;
        if (/[0-9]/.test(pw)) s += 10;
        if (/[^a-zA-Z0-9]/.test(pw)) s += 10;
        if (/password|123456|qwerty|abc123|letmein|admin|welcome|monkey/i.test(pw)) s -= 15;
        if (/(.)\1{2,}/.test(pw)) s -= 10;
        s = Math.max(0, Math.min(100, s));
        if (s < 40) weakCount++;
      }

      // Expired check
      if (e.data.expiryDate && new Date(e.data.expiryDate) <= new Date()) {
        expiredCount++;
      }

      // No notes check
      if (!e.data.other) {
        noNotesCount++;
      }
    }

    const score = Math.max(0, 100 - (weakCount * 5) - (expiredCount * 3) - (noNotesCount * 1));

    return { total, weakCount, expiredCount, noNotesCount, score };
  }, [entries]);

  const filteredCount = getFilteredAndSorted().length;
  const categories = getCategories();
  const tags = getTags();

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      // Ctrl/Cmd + K = focus search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('vault-search')?.focus();
      }
      // Ctrl/Cmd + N = new entry
      if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
        e.preventDefault();
        onAddEntry();
      }
      // Escape = clear search
      if (e.key === 'Escape' && searchQuery) {
        setSearchQuery('');
        (document.activeElement as HTMLElement)?.blur();
      }
    },
    [searchQuery, setSearchQuery, onAddEntry]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const toggleSortDirection = () => {
    setSort(sortField, sortDirection === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-3">
      {/* Stats bar */}
      <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground flex-wrap">
        <Badge variant="secondary" className="font-mono text-[10px] h-5 px-2">
          {entries.length} {entries.length === 1 ? 'entry' : 'entries'}
        </Badge>
        {categoryFilter && (
          <div className="flex items-center gap-1.5">
            <CategoryTag categoryId={categoryFilter as CategoryId} size="sm" />
            <button
              onClick={() => setCategoryFilter('')}
              className="hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {favoriteFilter && (
          <div className="flex items-center gap-1.5">
            <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
            <span className="text-amber-400">Favorites</span>
            <button
              onClick={() => setFavoriteFilter(false)}
              className="hover:text-foreground transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {searchQuery && (
          <div className="flex items-center gap-1.5">
            <span className="text-primary">Filtering: &ldquo;{searchQuery}&rdquo;</span>
            <span className="text-muted-foreground/60">({filteredCount} results)</span>
          </div>
        )}
        <div className="flex-1" />
        <button
          onClick={() => setShowShortcuts(!showShortcuts)}
          className="hidden sm:flex items-center gap-1 hover:text-foreground transition-colors"
        >
          <Keyboard className="h-3 w-3" />
          <span>Shortcuts</span>
        </button>
      </div>

      {/* Search + actions row — full width on mobile, flex on sm+ */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1 group w-full sm:w-auto search-glow">
          <Search className={cn(
            "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors",
            searchFocused ? "text-primary" : "text-muted-foreground"
          )} />
          <Input
            id="vault-search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            placeholder="Search entries..."
            className="pl-9 pr-10 h-10 bg-muted/30 transition-all focus:bg-background w-full sm:pr-20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 sm:right-12 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 h-5 items-center gap-0.5 rounded border border-border/60 bg-muted/50 px-1.5 text-[10px] font-mono text-muted-foreground/60">
            ⌘K
          </kbd>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button onClick={onAddEntry} className="flex-1 sm:flex-none shadow-lg shadow-primary/15 h-10">
            <Plus className="h-4 w-4 mr-1.5" />
            <span className="sm:hidden">Add</span>
            <span className="hidden sm:inline">Add Entry</span>
          </Button>

          <div className="hidden md:flex items-center gap-1">
            <Dialog open={auditOpen} onOpenChange={setAuditOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="icon" title="Security Audit" className="h-10 w-10">
                  <ShieldCheck className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5 text-primary" />
                    Security Audit
                  </DialogTitle>
                  <DialogDescription>Overview of your vault security posture</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 mt-2">
                  {/* Overall score */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Overall Security Score</span>
                      <span className={cn(
                        'font-bold tabular-nums text-lg',
                        auditData.score >= 70 ? 'text-emerald-400' : auditData.score >= 40 ? 'text-amber-400' : 'text-red-400'
                      )}>
                        {auditData.score}%
                      </span>
                    </div>
                    <Progress
                      value={auditData.score}
                      className={cn(
                        'h-2 progress-animated',
                        auditData.score >= 70 && '[&>div]:bg-emerald-500',
                        auditData.score >= 40 && auditData.score < 70 && '[&>div]:bg-amber-500',
                        auditData.score < 40 && '[&>div]:bg-red-500'
                      )}
                    />
                  </div>

                  <div className="h-px bg-border" />

                  {/* Audit items */}
                  <div className="space-y-3">
                    <AuditItem
                      icon={<Lock className="h-4 w-4 text-primary" />}
                      label="Total Entries"
                      value={String(auditData.total)}
                      variant="neutral"
                    />
                    <AuditItem
                      icon={<ShieldAlert className="h-4 w-4 text-red-400" />}
                      label="Weak Passwords (score &lt;40%)"
                      value={String(auditData.weakCount)}
                      variant={auditData.weakCount > 0 ? 'danger' : 'success'}
                    />
                    <AuditItem
                      icon={<AlertTriangle className="h-4 w-4 text-amber-400" />}
                      label="Expired Passwords"
                      value={String(auditData.expiredCount)}
                      variant={auditData.expiredCount > 0 ? 'danger' : 'success'}
                    />
                    <AuditItem
                      icon={<FileText className="h-4 w-4 text-muted-foreground" />}
                      label="Entries Without Notes"
                      value={String(auditData.noNotesCount)}
                      variant={auditData.noNotesCount > 0 ? 'warning' : 'success'}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>
            <Button variant="outline" size="icon" onClick={onExport} title="Export vault" className="h-10 w-10">
              <FileDown className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onImport} title="Import vault" className="h-10 w-10">
              <FileUp className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onChangePassword} title="Change master password" className="h-10 w-10">
              <KeyRound className="h-4 w-4" />
            </Button>
          </div>

          <div className="md:hidden">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-10 w-10">
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setAuditOpen(true)}>
                  <ShieldCheck className="h-4 w-4 mr-2" /> Security Audit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onExport}>
                  <FileDown className="h-4 w-4 mr-2" /> Export
                </DropdownMenuItem>
                <DropdownMenuItem onClick={onImport}>
                  <FileUp className="h-4 w-4 mr-2" /> Import
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onChangePassword}>
                  <KeyRound className="h-4 w-4 mr-2" /> Change Password
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Category filter chips */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
          <Tag className="h-3 w-3" />
          <span className="hidden sm:inline">Filter:</span>
        </div>
        <button
          onClick={() => { setCategoryFilter(''); setFavoriteFilter(false); }}
          className={cn(
            'shrink-0 rounded-full px-2.5 sm:px-3 py-1 text-xs font-medium transition-all border chip-hover',
            !categoryFilter && !favoriteFilter
              ? 'bg-primary/15 text-primary border-primary/30'
              : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
          )}
        >
          All
        </button>
        <button
          onClick={() => setFavoriteFilter(!favoriteFilter)}
          className={cn(
            'shrink-0 rounded-full px-2.5 sm:px-3 py-1 text-xs font-medium transition-all border flex items-center gap-1.5 chip-hover',
            favoriteFilter
              ? 'bg-amber-500/15 text-amber-400 border-amber-500/30'
              : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
          )}
        >
          <Star className={cn('h-3 w-3', favoriteFilter && 'fill-amber-400')} />
          <span className="hidden sm:inline">Favorites</span>
        </button>
        {categories.map(({ id, count }) => (
          <button
            key={id}
            onClick={() => setCategoryFilter(categoryFilter === id ? '' : id)}
            className={cn(
              'shrink-0 rounded-full px-2.5 sm:px-3 py-1 text-xs font-medium transition-all border flex items-center gap-1.5 chip-hover',
              categoryFilter === id
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            {CATEGORIES.find((c) => c.id === id)?.label || id}
            <span className="text-[10px] opacity-60">{count}</span>
          </button>
        ))}
      </div>

      {/* Tag filter chips */}
      {tags.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground shrink-0">
            <Tags className="h-3 w-3" />
            <span className="hidden sm:inline">Filter:</span>
          </div>
          <button
            onClick={() => setTagFilter('')}
            className={cn(
              'shrink-0 rounded-full px-2.5 sm:px-3 py-1 text-xs font-medium transition-all border chip-hover',
              !tagFilter
                ? 'bg-primary/15 text-primary border-primary/30'
                : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
            )}
          >
            All
          </button>
          {tags.map(({ tag, count }) => (
            <button
              key={tag}
              onClick={() => setTagFilter(tagFilter === tag ? '' : tag)}
              className={cn(
                'shrink-0 rounded-full px-2.5 sm:px-3 py-1 text-xs font-medium transition-all border flex items-center gap-1.5 chip-hover',
                tagFilter === tag
                  ? 'bg-primary/15 text-primary border-primary/30'
                  : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
              )}
            >
              {tag}
              <span className="text-[10px] opacity-60">{count}</span>
            </button>
          ))}
        </div>
      )}

      {/* View toggle + Sort controls */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'grid' ? 'default' : 'outline'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('grid')}
            title="Grid view"
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'default' : 'outline'}
            size="icon"
            className="h-8 w-8"
            onClick={() => setViewMode('list')}
            title="List view"
          >
            <List className="h-4 w-4" />
          </Button>

          <div className="h-5 w-px bg-border mx-1" />

          <Select
            value={sortField}
            onValueChange={(v) => setSort(v as SortField, sortDirection)}
          >
            <SelectTrigger className="w-[120px] sm:w-[140px] h-8 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sortFields.map((f) => (
                <SelectItem key={f.value} value={f.value} className="text-xs">
                  {f.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={toggleSortDirection}
            title={sortDirection === 'asc' ? 'Ascending' : 'Descending'}
          >
            {sortDirection === 'asc' ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {/* Keyboard shortcuts tooltip */}
      {showShortcuts && (
        <div className="rounded-lg border border-border/60 bg-card/90 backdrop-blur-sm p-4 text-xs space-y-2 animate-scale-in">
          <p className="font-semibold text-sm mb-3">Keyboard Shortcuts</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-muted-foreground">
            <div className="flex items-center justify-between">
              <span>Focus search</span>
              <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded">⌘K</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>New entry</span>
              <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded">⌘N</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Clear search</span>
              <kbd className="font-mono bg-muted px-1.5 py-0.5 rounded">Esc</kbd>
            </div>
            <div className="flex items-center justify-between">
              <span>Toggle view</span>
              <span className="text-muted-foreground/50">Toolbar</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AuditItem({
  icon,
  label,
  value,
  variant,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  variant: 'neutral' | 'success' | 'warning' | 'danger';
}) {
  return (
    <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2.5">
      <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <span className={cn(
        'font-semibold tabular-nums text-sm',
        variant === 'success' && 'text-emerald-400',
        variant === 'warning' && 'text-amber-400',
        variant === 'danger' && 'text-red-400',
        variant === 'neutral' && 'text-foreground'
      )}>
        {value}
      </span>
    </div>
  );
}