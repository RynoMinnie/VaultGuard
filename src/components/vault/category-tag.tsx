'use client';

import { cn } from '@/lib/utils';

export const CATEGORIES = [
  { id: 'social', label: 'Social', color: 'bg-blue-500/20 text-blue-300 border-blue-500/30' },
  { id: 'email', label: 'Email', color: 'bg-red-500/20 text-red-300 border-red-500/30' },
  { id: 'finance', label: 'Finance', color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' },
  { id: 'shopping', label: 'Shopping', color: 'bg-purple-500/20 text-purple-300 border-purple-500/30' },
  { id: 'work', label: 'Work', color: 'bg-amber-500/20 text-amber-300 border-amber-500/30' },
  { id: 'entertainment', label: 'Entertainment', color: 'bg-pink-500/20 text-pink-300 border-pink-500/30' },
  { id: 'development', label: 'Development', color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' },
  { id: 'gaming', label: 'Gaming', color: 'bg-violet-500/20 text-violet-300 border-violet-500/30' },
  { id: 'other', label: 'Other', color: 'bg-muted/50 text-muted-foreground border-muted-foreground/30' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'] | '';

interface CategoryTagProps {
  categoryId: CategoryId;
  size?: 'sm' | 'md';
  removable?: boolean;
  onRemove?: () => void;
}

export function CategoryTag({ categoryId, size = 'sm', removable, onRemove }: CategoryTagProps) {
  const cat = CATEGORIES.find((c) => c.id === categoryId);
  if (!cat) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border font-medium transition-all',
        cat.color,
        size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs'
      )}
    >
      {cat.label}
      {removable && onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="hover:bg-foreground/10 rounded-full p-0.5 -mr-0.5 transition-colors"
        >
          <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}

interface CategoryPickerProps {
  value: CategoryId | '';
  onChange: (value: CategoryId) => void;
}

export function CategoryPicker({ value, onChange }: CategoryPickerProps) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {CATEGORIES.map((cat) => (
        <button
          key={cat.id}
          type="button"
          onClick={() => onChange(value === cat.id ? '' : cat.id)}
          className={cn(
            'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium transition-all duration-200',
            value === cat.id
              ? cn(cat.color, 'ring-1 ring-current/20 scale-105')
              : 'border-border/50 text-muted-foreground hover:border-border hover:text-foreground'
          )}
        >
          <div className={cn('h-1.5 w-1.5 rounded-full', value === cat.id ? cat.color.split(' ')[0] : 'bg-muted-foreground/30')} />
          {cat.label}
        </button>
      ))}
    </div>
  );
}