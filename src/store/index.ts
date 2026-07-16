import { create } from 'zustand';
import type { VaultEntryData } from '@/lib/crypto';

export type ViewMode = 'grid' | 'list';
export type SortField = 'platform' | 'username' | 'email' | 'category' | 'lastAccessed' | 'updatedAt' | 'createdAt';
export type SortDirection = 'asc' | 'desc';

export interface DecryptedEntry {
  id: string;
  data: VaultEntryData;
  createdAt: string;
  updatedAt: string;
}

interface AuthState {
  isAuthenticated: boolean;
  token: string | null;
  userId: string | null;
  username: string | null;
  encryptionKey: CryptoKey | null;
  encryptionSalt: string | null;
  login: (token: string, userId: string, username: string, key: CryptoKey, encryptionSalt: string) => void;
  logout: () => void;
}

interface VaultState {
  entries: DecryptedEntry[];
  isLoading: boolean;
  searchQuery: string;
  viewMode: ViewMode;
  sortField: SortField;
  sortDirection: SortDirection;
  categoryFilter: string;
  setEntries: (entries: DecryptedEntry[]) => void;
  addEntry: (entry: DecryptedEntry) => void;
  updateEntry: (id: string, entry: DecryptedEntry) => void;
  touchEntry: (id: string) => void;
  toggleFavorite: (id: string) => void;
  removeEntry: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setSearchQuery: (query: string) => void;
  setViewMode: (mode: ViewMode) => void;
  setSort: (field: SortField, direction: SortDirection) => void;
  setCategoryFilter: (category: string) => void;
  getFilteredAndSorted: () => DecryptedEntry[];
  getCategories: () => { id: string; count: number }[];
  getRecentEntries: () => DecryptedEntry[];
}

interface TimeoutState {
  isActive: boolean;
  isWarning: boolean;
  countdown: number;
  resetTimer: () => void;
  startWarning: () => void;
  triggerLogout: () => void;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  token: null,
  userId: null,
  username: null,
  encryptionKey: null,
  encryptionSalt: null,
  login: (token, userId, username, key, encryptionSalt) =>
    set({
      isAuthenticated: true,
      token,
      userId,
      username,
      encryptionKey: key,
      encryptionSalt,
    }),
  logout: () =>
    set({
      isAuthenticated: false,
      token: null,
      userId: null,
      username: null,
      encryptionKey: null,
      encryptionSalt: null,
    }),
}));

export const useVaultStore = create<VaultState>((set, get) => ({
  entries: [],
  isLoading: false,
  searchQuery: '',
  viewMode: 'grid',
  sortField: 'updatedAt',
  sortDirection: 'desc',
  categoryFilter: '',
  setEntries: (entries) => set({ entries }),
  addEntry: (entry) => set((state) => ({ entries: [entry, ...state.entries] })),
  updateEntry: (id, updated) =>
    set((state) => ({
      entries: state.entries.map((e) => (e.id === id ? updated : e)),
    })),
  touchEntry: (id) =>
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id
          ? { ...e, data: { ...e.data, lastAccessed: new Date().toISOString() } }
          : e
      ),
    })),
  toggleFavorite: (id) =>
    set((state) => ({
      entries: state.entries.map((e) =>
        e.id === id
          ? { ...e, data: { ...e.data, isFavorite: !e.data.isFavorite } }
          : e
      ),
    })),
  removeEntry: (id) =>
    set((state) => ({
      entries: state.entries.filter((e) => e.id !== id),
    })),
  setLoading: (loading) => set({ isLoading: loading }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setSort: (field, direction) => set({ sortField: field, sortDirection: direction }),
  setCategoryFilter: (category) => set({ categoryFilter: category }),
  getFilteredAndSorted: () => {
    const { entries, searchQuery, sortField, sortDirection, categoryFilter } = get();
    let filtered = entries;

    // Category filter
    if (categoryFilter) {
      filtered = filtered.filter((e) => e.data.category === categoryFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((e) => {
        const d = e.data;
        return (
          d.platform.toLowerCase().includes(q) ||
          d.platformUrl.toLowerCase().includes(q) ||
          d.username.toLowerCase().includes(q) ||
          d.email.toLowerCase().includes(q) ||
          d.password.toLowerCase().includes(q) ||
          d.other.toLowerCase().includes(q) ||
          d.category.toLowerCase().includes(q)
        );
      });
    }

    return filtered.sort((a, b) => {
      let valA: string = '';
      let valB: string = '';

      if (sortField === 'updatedAt' || sortField === 'createdAt') {
        valA = a[sortField];
        valB = b[sortField];
      } else if (sortField === 'lastAccessed') {
        valA = a.data.lastAccessed || '';
        valB = b.data.lastAccessed || '';
      } else {
        valA = a.data[sortField]?.toLowerCase() ?? '';
        valB = b.data[sortField]?.toLowerCase() ?? '';
      }

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  },
  getCategories: () => {
    const { entries } = get();
    const map = new Map<string, number>();
    for (const e of entries) {
      const cat = e.data.category || 'other';
      map.set(cat, (map.get(cat) || 0) + 1);
    }
    return Array.from(map.entries())
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count);
  },
  getRecentEntries: () => {
    const { entries } = get();
    return entries
      .filter((e) => e.data.lastAccessed)
      .sort((a, b) => b.data.lastAccessed.localeCompare(a.data.lastAccessed))
      .slice(0, 5);
  },
}));

let logoutCallback: (() => void) | null = null;

export const useTimeoutStore = create<TimeoutState>((set) => ({
  isActive: false,
  isWarning: false,
  countdown: 60,
  resetTimer: () =>
    set({ isActive: true, isWarning: false, countdown: 60 }),
  startWarning: () =>
    set({ isWarning: true, countdown: 60 }),
  triggerLogout: () => {
    set({ isActive: false, isWarning: false, countdown: 60 });
    if (logoutCallback) logoutCallback();
  },
  reset: () =>
    set({ isActive: false, isWarning: false, countdown: 60 }),
}));

export const setTimeoutLogoutCallback = (cb: () => void) => {
  logoutCallback = cb;
};