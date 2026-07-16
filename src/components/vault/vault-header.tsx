'use client';

import { useState, useEffect, useCallback } from 'react';
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
} from 'lucide-react';
import { useVaultStore, type SortField, type SortDirection } from '@/store';
import { CATEGORIES, type CategoryId, CategoryTag } from './category-tag';
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
    getCategories,
    getFilteredAndSorted,
  } = useVaultStore();
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const filteredCount = getFilteredAndSorted().length;
  const categories = getCategories();

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
        <div className="relative flex-1 group w-full sm:w-auto">
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
          onClick={() => setCategoryFilter('')}
          className={cn(
            'shrink-0 rounded-full px-2.5 sm:px-3 py-1 text-xs font-medium transition-all border',
            !categoryFilter
              ? 'bg-primary/15 text-primary border-primary/30'
              : 'border-border/50 text-muted-foreground hover:text-foreground hover:border-border'
          )}
        >
          All
        </button>
        {categories.map(({ id, count }) => (
          <button
            key={id}
            onClick={() => setCategoryFilter(categoryFilter === id ? '' : id)}
            className={cn(
              'shrink-0 rounded-full px-2.5 sm:px-3 py-1 text-xs font-medium transition-all border flex items-center gap-1.5',
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