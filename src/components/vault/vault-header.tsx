'use client';

import { useState } from 'react';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
} from 'lucide-react';
import { useVaultStore, type SortField, type SortDirection } from '@/store';

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
  { value: 'updatedAt', label: 'Last Modified' },
  { value: 'createdAt', label: 'Created' },
];

export function VaultHeader({
  onAddEntry,
  onExport,
  onImport,
  onChangePassword,
}: VaultHeaderProps) {
  const { searchQuery, setSearchQuery, viewMode, setViewMode, sortField, sortDirection, setSort } =
    useVaultStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleSortDirection = () => {
    setSort(sortField, sortDirection === 'asc' ? 'desc' : 'asc');
  };

  return (
    <div className="space-y-3">
      {/* Top row: Search + actions */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search entries..."
            className="pl-9"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onAddEntry} className="shrink-0">
            <Plus className="h-4 w-4 mr-1.5" />
            Add Entry
          </Button>

          {/* Desktop actions */}
          <div className="hidden md:flex items-center gap-1">
            <Button variant="outline" size="icon" onClick={onExport} title="Export vault">
              <FileDown className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onImport} title="Import vault">
              <FileUp className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={onChangePassword} title="Change master password">
              <KeyRound className="h-4 w-4" />
            </Button>
          </div>

          {/* Mobile actions dropdown */}
          <div className="md:hidden">
            <DropdownMenu open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon">
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
                <DropdownMenuItem onClick={onChangePassword}>
                  <KeyRound className="h-4 w-4 mr-2" /> Change Password
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Bottom row: View toggle + Sort controls */}
      <div className="flex items-center justify-between">
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
            <SelectTrigger className="w-[140px] h-8 text-xs">
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
    </div>
  );
}