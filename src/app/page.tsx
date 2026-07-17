'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore, useVaultStore, useTimeoutStore, setTimeoutLogoutCallback, type DecryptedEntry } from '@/store';
import {
  hashPassword,
  generateSalt,
  deriveEncryptionKey,
  decryptEntry,
  encryptEntry,
} from '@/lib/crypto';
import type { VaultEntryData } from '@/lib/crypto';
import { VaultHeader } from '@/components/vault/vault-header';
import { EntryCard } from '@/components/vault/entry-card';
import { EntryRow } from '@/components/vault/entry-row';
import { EntryFormDialog } from '@/components/vault/entry-form-dialog';
import { PasswordGenerator } from '@/components/vault/password-generator';
import { PasswordStrengthMeter } from '@/components/vault/password-strength-meter';
import { InactivityWarning } from '@/components/vault/inactivity-warning';
import { ImportExportDialog } from '@/components/vault/import-export-dialog';
import { ChangePasswordDialog } from '@/components/vault/change-password-dialog';
import { CategoryTag, type CategoryId, CATEGORIES } from '@/components/vault/category-tag';
import { EntryDetailSheet } from '@/components/vault/entry-detail-sheet';
import { StatsOverview } from '@/components/vault/stats-overview';
import { ThemeToggle } from '@/components/vault/theme-toggle';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  Shield,
  LogOut,
  Lock,
  UserPlus,
  Eye,
  EyeOff,
  Loader2,
  Vault as VaultIcon,
  KeyRound,
  ChevronRight,
  Clock,
  Sparkles,
  Fingerprint,
  Trash2,
  Check,
  CheckSquare,
  Circle,
  Square,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const APP_VERSION = 'v0.7.0';

// =============== AUTH SCREEN ===============
function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [regPassword, setRegPassword] = useState('');
  const [regConfirm, setRegConfirm] = useState('');
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [showRegConfirm, setShowRegConfirm] = useState(false);
  const { login } = useAuthStore();
  const [authenticating, setAuthenticating] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      const saltRes = await fetch(`/api/auth/salt?username=${encodeURIComponent(username.trim())}`);
      if (!saltRes.ok) {
        throw new Error('Invalid username or password');
      }
      const { salt, encryptionSalt } = await saltRes.json();

      const passwordHash = await hashPassword(password, salt);

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), passwordHash }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Login failed');
      }

      const { user, token } = await res.json();
      const key = await deriveEncryptionKey(password, encryptionSalt);

      setAuthenticating(true);
      await new Promise((r) => setTimeout(r, 300));
      login(token, user.id, user.username, key, encryptionSalt);
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
      setAuthenticating(false);
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !regPassword || !regConfirm) {
      toast.error('Please fill in all fields');
      return;
    }
    if (regPassword.length < 8) {
      toast.error('Master password must be at least 8 characters');
      return;
    }
    if (regPassword !== regConfirm) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      const salt = generateSalt();
      const encryptionSalt = generateSalt();
      const passwordHash = await hashPassword(regPassword, salt);

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          passwordHash,
          salt,
          encryptionSalt,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Registration failed');
      }

      const { user, token } = await res.json();
      const key = await deriveEncryptionKey(regPassword, encryptionSalt);

      setAuthenticating(true);
      await new Promise((r) => setTimeout(r, 300));
      login(token, user.id, user.username, key, encryptionSalt);
      toast.success('Account created! Your vault is ready.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
      setAuthenticating(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 vault-bg vault-bg-mesh">
      {/* Animated background orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl float-animate" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-teal/5 rounded-full blur-3xl float-animate" style={{ animationDelay: '-3s' }} />
      Trash2,
  </div>

      <Card className="w-full max-w-md border-border/40 bg-card/70 backdrop-blur-2xl gradient-border noise-bg relative z-10 animate-fade-in">
        <div className="absolute top-4 right-4 z-20">
          <ThemeToggle />
        </div>
        <CardContent className="p-6 sm:p-8">
          {/* Logo with animated lock */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-primary/20 to-teal/10 mb-5 breathe-glow relative overflow-hidden">
              <div className="absolute inset-0 shimmer opacity-30" />
              <VaultIcon className="h-9 w-9 text-primary relative z-10 lock-icon-animate" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground via-foreground to-foreground/70 bg-clip-text text-transparent">
              Password Vault
            </h1>
            <p className="text-sm text-muted-foreground mt-1.5 flex items-center justify-center gap-1.5">
              <Fingerprint className="h-3.5 w-3.5 text-primary/60" />
              Zero-knowledge encrypted password manager
            </p>
            <p className="text-[10px] text-muted-foreground/40 mt-1 font-mono">{APP_VERSION}</p>
          </div>

          {/* Tab switcher */}
          <div className="flex mb-6 bg-muted/40 rounded-xl p-1 border border-border/30">
            <button
              onClick={() => setIsLogin(true)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                isLogin
                  ? 'bg-background text-foreground shadow-sm shadow-black/5 tab-indicator'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <KeyRound className="h-4 w-4" />
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={cn(
                'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                !isLogin
                  ? 'bg-background text-foreground shadow-sm shadow-black/5 tab-indicator'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              <UserPlus className="h-4 w-4" />
              Register
            </button>
          </div>

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="login-username" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Username
                </Label>
                <Input
                  id="login-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoFocus
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Master Password
                </Label>
                <div className="input-group relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your master password"
                    autoComplete="current-password"
                    className="h-11"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="toggle-btn h-10 w-10 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full h-11 shadow-lg shadow-primary/20" disabled={loading || !username.trim() || !password}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Unlock Vault
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4 animate-fade-in">
              <div className="space-y-2">
                <Label htmlFor="reg-username" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Username
                </Label>
                <Input
                  id="reg-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  autoComplete="username"
                  autoFocus
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Master Password
                </Label>
                <div className="input-group relative">
                  <Input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    className="h-11"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="toggle-btn h-10 w-10 hover:bg-transparent"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                  >
                    {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {!isLogin && regPassword.length > 0 && (
                  <div className="space-y-1.5 mt-2">
                    {[
                      { label: 'Minimum 8 characters', met: regPassword.length >= 8 },
                      { label: 'Contains uppercase', met: /[A-Z]/.test(regPassword) },
                      { label: 'Contains number', met: /[0-9]/.test(regPassword) },
                      { label: 'Contains symbol', met: /[^A-Za-z0-9]/.test(regPassword) },
                    ].map((req) => (
                      <div key={req.label} className="req-check-item flex items-center gap-2 text-[11px]">
                        {req.met ? (
                          <Check className="h-3 w-3 text-emerald-400" />
                        ) : (
                          <Circle className="h-3 w-3 text-muted-foreground/30" />
                        )}
                        <span className={req.met ? 'text-emerald-400/80' : 'text-muted-foreground/50'}>{req.label}</span>
                      </div>
                    ))}
                  </div>
                )}
                <PasswordStrengthMeter password={regPassword} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-confirm" className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Confirm Master Password
                </Label>
                <div className="input-group relative">
                  <Input
                    id="reg-confirm"
                    type={showRegConfirm ? 'text' : 'password'}
                    value={regConfirm}
                    onChange={(e) => setRegConfirm(e.target.value)}
                    placeholder="Re-enter your master password"
                    autoComplete="new-password"
                    className={cn(
                      'h-11 transition-colors',
                      regConfirm && regPassword !== regConfirm && 'border-destructive focus-visible:ring-destructive/30'
                    )}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="toggle-btn h-10 w-10 hover:bg-transparent"
                    onClick={() => setShowRegConfirm(!showRegConfirm)}
                  >
                    {showRegConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                {regConfirm && regPassword !== regConfirm && (
                  <p className="text-xs text-destructive flex items-center gap-1">
                    <span>Passwords do not match</span>
                  </p>
                )}
              </div>
              <PasswordGenerator value={regPassword} onChange={setRegPassword} />
              <Button
                type="submit"
                className="w-full h-11 shadow-lg shadow-primary/20"
                disabled={loading || !username.trim() || !regPassword || !regConfirm}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Create Vault
              </Button>
            </form>
          )}

          {/* Security note */}
          <div className="mt-6 flex items-start gap-2.5 rounded-xl bg-muted/30 border border-border/30 p-3.5">
            <Shield className="h-4 w-4 text-primary/70 shrink-0 mt-0.5" />
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Your master password is never sent to the server. All encryption and decryption happens
              locally in your browser using <span className="text-primary/80 font-medium">AES-256-GCM</span>.
            </p>
          </div>

          {/* Authenticating overlay */}
          {authenticating && (
            <div className="absolute inset-0 rounded-[inherit] bg-card/90 backdrop-blur-sm flex flex-col items-center justify-center z-20 animate-fade-in">
              <VaultIcon className="h-10 w-10 text-primary auth-loading-icon" />
              <p className="text-sm text-muted-foreground mt-3">Unlocking vault...</p>
            </div>
          )}
        </CardContent>
      </Card>
      <p className="mt-4 flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground/40">
        <Lock className="h-3 w-3 shrink-0" />
        <span>AES-256-GCM encrypted</span>
      </p>
    </div>
  );
}

// =============== RECENTLY USED SECTION ===============
function RecentlyUsedSection() {
  const { getRecentEntries } = useVaultStore();
  const recent = getRecentEntries();

  if (recent.length === 0) return null;

  return (
    <div className="mb-6 -mx-3 sm:-mx-4 md:-mx-6">
      <div className="flex items-center gap-2 mb-3 px-3 sm:px-4 md:px-6">
        <Clock className="h-4 w-4 text-primary/60" />
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Recently Accessed</h2>
      </div>
      <div className="flex gap-2 overflow-x-auto scrollbar-none px-3 sm:px-4 md:px-6">
        {recent.map((entry, i) => {
          const cat = entry.data.category;
          const catColor = cat ? CATEGORIES.find(c => c.id === cat)?.color.split(' ')[0] : '';
          return (
            <button
              key={entry.id}
              className="group flex items-center gap-2.5 rounded-lg bg-muted/30 hover:bg-muted/60 border border-border/30 hover:border-primary/20 px-3 py-2.5 text-left transition-all duration-200 hover:emerald-glow-sm hover:scale-[1.02] animate-slide-up shrink-0 w-36 sm:w-auto"
              style={{ animationDelay: `${i * 0.05}s`, borderLeftWidth: '3px', borderLeftColor: catColor ? undefined : 'transparent' }}
            >
              <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                <Sparkles className="h-3.5 w-3.5 text-primary/70" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium truncate">{entry.data.platform}</p>
                <p className="text-[10px] text-muted-foreground/60 truncate">
                  {formatDistanceToNow(new Date(entry.data.lastAccessed), { addSuffix: true })}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      <Separator className="mt-4 opacity-40" />
    </div>
  );
}

// =============== VAULT SCREEN ===============
function VaultScreen() {
  const { token, encryptionKey, username, logout } = useAuthStore();
  const { entries, isLoading, setLoading, setEntries, addEntry, updateEntry, removeEntry, removeEntries, getFilteredAndSorted, viewMode, searchQuery, selectedIds, toggleSelect, toggleSelectAll, clearSelection } =
    useVaultStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DecryptedEntry | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [detailEntry, setDetailEntry] = useState<DecryptedEntry | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [versionInfo, setVersionInfo] = useState<string>(APP_VERSION);
  const fetchedRef = useRef(false);

  const fetchEntries = useCallback(async () => {
    if (!token || !encryptionKey || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    try {
      const res = await fetch('/api/vault/entries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch');
      const { entries: rawEntries } = await res.json();

      const decrypted: DecryptedEntry[] = [];
      for (const e of rawEntries) {
        try {
          const data = await decryptEntry(e.encryptedData, e.iv, encryptionKey);
          decrypted.push({ id: e.id, data, createdAt: e.createdAt, updatedAt: e.updatedAt });
        } catch {
          console.warn('Failed to decrypt entry:', e.id);
        }
      }
      setEntries(decrypted);
    } catch {
      toast.error('Failed to load vault entries');
    } finally {
      setLoading(false);
    }
  }, [token, encryptionKey, setLoading, setEntries]);

  useEffect(() => {
    fetchVersion();
    fetchEntries();
  }, [fetchEntries]);

  const fetchVersion = async () => {
    try {
      const res = await fetch('/api/version');
      if (res.ok) {
        const data = await res.json();
        setVersionInfo(data.currentVersion);
      }
    } catch { /* fallback */ }
  };

  const handleLogout = async () => {
    const { token: t } = useAuthStore.getState();
    if (t) {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: t }),
      });
    }
    logout();
    useTimeoutStore.getState().reset();
    toast.success('Logged out successfully');
  };

  const handleAddEntry = () => {
    setEditingEntry(null);
    setFormOpen(true);
  };

  const handleEditEntry = (entry: DecryptedEntry) => {
    setEditingEntry(entry);
    setFormOpen(true);
  };

  const handleDuplicateEntry = (entry: DecryptedEntry) => {
    const dupData: VaultEntryData = {
      ...entry.data,
      platform: entry.data.platform + ' (Copy)',
      lastAccessed: '',
      isFavorite: false,
      expiryDate: entry.data.expiryDate,
    };
    const dup: DecryptedEntry = {
      id: '',
      data: dupData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setEditingEntry(dup);
    setFormOpen(true);
  };

  const handleViewEntry = (entry: DecryptedEntry) => {
    setDetailEntry(entry);
    setDetailOpen(true);
  };

  const handleSaved = (entry: DecryptedEntry) => addEntry(entry);
  const handleUpdated = (entry: DecryptedEntry) => updateEntry(entry.id, entry);

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      const res = await fetch(`/api/vault/entries/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to delete');
      removeEntry(id);
    } catch {
      toast.error('Failed to delete entry');
    }
  };

  const filteredEntries = getFilteredAndSorted();
  const hasSelection = selectedIds.size > 0;
  const selectedCount = selectedIds.size;
  const allSelected = filteredEntries.length > 0 && filteredEntries.every((e) => selectedIds.has(e.id));

  const handleBulkDelete = async () => {
    if (!token) return;
    try {
      const ids = Array.from(selectedIds);
      await Promise.all(
        ids.map((id) =>
          fetch(`/api/vault/entries/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      removeEntries(ids);
      toast.success(`Deleted ${ids.length} entries`);
    } catch {
      toast.error('Failed to delete some entries');
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col vault-bg vault-bg-mesh screen-transition"
      onMouseMove={useTimeoutStore.getState().resetTimer}
      onKeyDown={useTimeoutStore.getState().resetTimer}
      onWheel={useTimeoutStore.getState().resetTimer}
      onClick={useTimeoutStore.getState().resetTimer}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/40 glass-strong header-glow-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <VaultIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-none tracking-tight">Password Vault</h1>
              <p className="text-[10px] text-muted-foreground font-mono">{versionInfo}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-5 w-px bg-border/50" />
              <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center">
                <span className="text-xs font-semibold text-primary">{username?.charAt(0).toUpperCase()}</span>
              </div>
              <span className="text-xs">{username}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive h-8">
              <LogOut className="h-3.5 w-3.5 mr-1.5" />
              <span className="hidden sm:inline text-xs">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-3 sm:px-4 md:px-6 py-4 sm:py-6">
        <StatsOverview />
        <VaultHeader
          onAddEntry={handleAddEntry}
          onExport={() => setExportOpen(true)}
          onImport={() => setImportOpen(true)}
          onChangePassword={() => setChangePwOpen(true)}
        />


        {/* Bulk actions bar */}
        {hasSelection && (
          <div className="fixed bottom-0 left-0 right-0 z-50 flex items-center gap-2 p-2.5 sm:p-3 border-t border-primary/20 bg-primary/5 glass-strong bulk-bar sm:rounded-xl sm:static sm:border sm:border-primary/20 pb-[calc(0.625rem+env(safe-area-inset-bottom))] sm:pb-2.5">
            <div className="flex items-center gap-1.5 text-sm">
              <button
                onClick={() => toggleSelectAll(filteredEntries.map((e) => e.id))}
                className="h-5 w-5 flex items-center justify-center"
                title={allSelected ? 'Deselect all' : 'Select all'}
              >
                {allSelected ? (
                  <CheckSquare className="h-5 w-5 text-primary" />
                ) : (
                  <Square className="h-5 w-5 text-muted-foreground/50" />
                )}
              </button>
              <span className="text-primary font-medium">
                {selectedCount} selected
              </span>
            </div>
            <div className="flex-1" />
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              className="h-8 gap-1.5 text-destructive border-destructive/30 hover:bg-destructive/10"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="text-xs">Delete Selected</span>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearSelection}
              className="h-8 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancel
            </Button>
          </div>
        )}
        {hasSelection && <div className="h-14 sm:h-0" />}
        <div className="mt-6">
          {isLoading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="space-y-3 rounded-xl border border-border/30 p-4">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-8 w-8 rounded-lg skeleton-shimmer" />
                    <Skeleton className="h-4 w-2/5 skeleton-shimmer" />
                  </div>
                  <Skeleton className="h-8 w-full rounded-md skeleton-shimmer" />
                  <Skeleton className="h-8 w-full rounded-md skeleton-shimmer" />
                  <Skeleton className="h-8 w-3/4 rounded-md skeleton-shimmer" />
                  <Skeleton className="h-3 w-1/2 skeleton-shimmer" />
                </div>
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center animate-fade-in">
              <div className="relative mb-6">
                <div className="w-24 h-24 rounded-3xl bg-muted/30 flex items-center justify-center float-animate empty-pulse-ring">
                  <VaultIcon className="h-12 w-12 text-muted-foreground/20" />
                </div>
                <div className="absolute -inset-4 rounded-[2rem] bg-primary/5 blur-xl -z-10" />
              </div>
              <h3 className="text-lg font-medium text-muted-foreground">
                {searchQuery ? 'No results found' : 'Your vault is empty'}
              </h3>
              <p className="text-sm text-muted-foreground/50 mt-2 max-w-sm">
                {searchQuery
                  ? <>No entries match &ldquo;<span className="text-primary/70">{searchQuery}</span>&rdquo;. Try a different search term.</>
                  : 'Add your first password entry to start building your secure vault.'}
              </p>
              {!searchQuery && (
                <p className="text-[10px] text-muted-foreground/30 mt-1 flex items-center gap-1">
                  <Shield className="h-3 w-3" />
                  All passwords encrypted with AES-256-GCM
                </p>
              )}
              {!searchQuery && (
                <Button onClick={handleAddEntry} className="mt-5 btn-gradient-primary">
                  <Sparkles className="h-4 w-4 mr-2" />
                  Add Your First Entry
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          ) : (
            <>
              {viewMode === 'grid' && <RecentlyUsedSection />}

              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 stagger-children">
                  {filteredEntries.map((entry) => (
                    <EntryCard key={entry.id} entry={entry} onEdit={handleEditEntry} onDuplicate={handleDuplicateEntry} onDelete={handleDelete} onView={handleViewEntry} />
                  ))}
                </div>
              ) : (
                <div className="space-y-1.5 overflow-x-auto">
                  <div className="flex items-center gap-3 px-4 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/50 border-b border-border/30 mb-1 min-w-[500px]">
                    <div className="flex-1">Platform</div>
                    <div className="hidden md:block w-36">Username</div>
                    <div className="hidden lg:block w-44">Email</div>
                    <div className="w-48">Password</div>
                    <div className="hidden sm:block w-24 text-right">Modified</div>
                    <div className="w-16" />
                  </div>
                  {filteredEntries.map((entry) => (
                    <EntryRow key={entry.id} entry={entry} onEdit={handleEditEntry} onDelete={handleDelete} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="footer-gradient-border mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-muted-foreground">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5">
              <span className="session-dot" />
              <span>Session active</span>
            </span>
            <span className="hidden sm:inline text-muted-foreground/30">·</span>
            <span>Password Vault {versionInfo} — Zero-Knowledge Encryption</span>
          </div>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="hidden md:flex items-center gap-1 text-muted-foreground/60">
              ⌘K Search · ⌘N New · Esc Clear
            </span>
            <span className="flex items-center gap-1">
              <Shield className="h-3 w-3" />
              AES-256-GCM · PBKDF2
            </span>
          </div>
        </div>
      </footer>

      {/* Dialogs */}
      <EntryFormDialog
        open={formOpen}
        onOpenChange={(open) => {
          setFormOpen(open);
          if (!open) setEditingEntry(null);
        }}
        entry={editingEntry}
        onSaved={handleSaved}
        onUpdated={handleUpdated}
      />
      <ImportExportDialog mode="export" open={exportOpen} onOpenChange={setExportOpen} />
      <ImportExportDialog mode="import" open={importOpen} onOpenChange={setImportOpen} />
      <ChangePasswordDialog open={changePwOpen} onOpenChange={setChangePwOpen} />
      <EntryDetailSheet
        entry={detailEntry}
        open={detailOpen}
        onOpenChange={setDetailOpen}
        onEdit={handleEditEntry}
        onDuplicate={handleDuplicateEntry}
        onDelete={handleDelete}
      />
      <InactivityWarning />
    </div>
  );
}

// =============== MAIN APP ===============
export default function HomePage() {
  const { isAuthenticated } = useAuthStore();

  // Activity tracking + timeout
  useEffect(() => {
    if (!isAuthenticated) return;

    const TIMEOUT_MS = 5 * 60 * 1000;
    const WARNING_MS = 4 * 60 * 1000;
    const COUNTDOWN_INTERVAL = 1000;

    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let countdownId: ReturnType<typeof setInterval> | undefined;
    let lastActivity = Date.now();
    let warningTriggered = false;

    const reset = () => {
      lastActivity = Date.now();
      warningTriggered = false;
      useTimeoutStore.getState().resetTimer();
    };

    const onActivity = () => {
      if (useTimeoutStore.getState().isWarning) {
        reset();
        return;
      }
      lastActivity = Date.now();
    };

    window.addEventListener('mousemove', onActivity);
    window.addEventListener('keydown', onActivity);
    window.addEventListener('scroll', onActivity);
    window.addEventListener('click', onActivity);
    window.addEventListener('touchstart', onActivity);

    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - lastActivity;

      if (elapsed >= TIMEOUT_MS) {
        clearInterval(checkInterval);
        if (countdownId) clearInterval(countdownId);
        if (timeoutId) clearTimeout(timeoutId);
        handleAutoLogout();
        return;
      }

      if (elapsed >= WARNING_MS && !warningTriggered) {
        warningTriggered = true;
        useTimeoutStore.getState().startWarning();
        const remaining = Math.ceil((TIMEOUT_MS - elapsed) / 1000);
        useTimeoutStore.setState({ countdown: remaining });

        countdownId = setInterval(() => {
          const { isWarning: stillWarning, countdown: current } = useTimeoutStore.getState();
          if (!stillWarning) {
            clearInterval(countdownId);
            return;
          }
          if (current <= 1) {
            clearInterval(countdownId);
            handleAutoLogout();
          } else {
            useTimeoutStore.setState({ countdown: current - 1 });
          }
        }, COUNTDOWN_INTERVAL);
      }
    }, 1000);

    const handleAutoLogout = async () => {
      const { token: t } = useAuthStore.getState();
      if (t) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: t }),
        });
      }
      useAuthStore.getState().logout();
      useTimeoutStore.getState().reset();
      toast.info('Logged out due to inactivity');
    };

    return () => {
      clearInterval(checkInterval);
      if (countdownId) clearInterval(countdownId);
      if (timeoutId) clearTimeout(timeoutId);
      window.removeEventListener('mousemove', onActivity);
      window.removeEventListener('keydown', onActivity);
      window.removeEventListener('scroll', onActivity);
      window.removeEventListener('click', onActivity);
      window.removeEventListener('touchstart', onActivity);
    };
  }, [isAuthenticated]);

  useEffect(() => {
    setTimeoutLogoutCallback(async () => {
      const { token: t } = useAuthStore.getState();
      if (t) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: t }),
        });
      }
      useAuthStore.getState().logout();
      useTimeoutStore.getState().reset();
      toast.info('Logged out due to inactivity');
    });
  }, []);

  return (
    <div key={isAuthenticated ? 'vault' : 'auth'} className="screen-transition">
      {isAuthenticated ? <VaultScreen /> : <AuthScreen />}
    </div>
  );
}