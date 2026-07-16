'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore, useVaultStore, useTimeoutStore, setTimeoutLogoutCallback, type DecryptedEntry } from '@/store';
import {
  hashPassword,
  generateSalt,
  deriveEncryptionKey,
  decryptEntry,
  encryptEntry,
  generatePassword,
} from '@/lib/crypto';
import type { VaultEntryData } from '@/lib/crypto';
import { VaultHeader } from '@/components/vault/vault-header';
import { EntryCard } from '@/components/vault/entry-card';
import { EntryRow } from '@/components/vault/entry-row';
import { EntryFormDialog } from '@/components/vault/entry-form-dialog';
import { PasswordGenerator } from '@/components/vault/password-generator';
import { InactivityWarning } from '@/components/vault/inactivity-warning';
import { ImportExportDialog } from '@/components/vault/import-export-dialog';
import { ChangePasswordDialog } from '@/components/vault/change-password-dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
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
} from 'lucide-react';

const APP_VERSION = 'v0.1.0';

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
  const { login } = useAuthStore();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      // We need the salt first to hash the password client-side
      // For login, we need to fetch the user's salt first
      // But we don't have a "get salt" endpoint. Let's hash client-side
      // and compare. The issue is we need the salt.

      // Actually, let me adjust: We'll send the raw password to a modified endpoint,
      // OR we can get the salt first. Let me add a simple approach:
      // We'll use a fixed salt approach for auth, but that's not ideal.

      // Better approach: fetch user's salt first via a dedicated endpoint
      const saltRes = await fetch(`/api/auth/salt?username=${encodeURIComponent(username.trim())}`);
      if (!saltRes.ok) {
        throw new Error('Invalid username or password');
      }
      const { salt, encryptionSalt } = await saltRes.json();

      // Hash password with the user's salt
      const passwordHash = await hashPassword(password, salt);

      // Login
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

      // Derive encryption key
      const key = await deriveEncryptionKey(password, encryptionSalt);

      login(token, user.id, user.username, key, encryptionSalt);
      toast.success('Welcome back!');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Login failed');
    } finally {
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

      login(token, user.id, user.username, key, encryptionSalt);
      toast.success('Account created! Your vault is ready.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 vault-bg">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-3xl" />
      </div>

      <Card className="w-full max-w-md border-border/60 bg-card/80 backdrop-blur-xl emerald-glow relative z-10">
        <CardContent className="p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-4">
              <VaultIcon className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Password Vault</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Zero-knowledge encrypted password manager
            </p>
            <p className="text-xs text-muted-foreground/60 mt-0.5">{APP_VERSION}</p>
          </div>

          {/* Tab switcher */}
          <div className="flex mb-6 bg-muted/50 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                isLogin
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <KeyRound className="h-4 w-4" />
              Sign In
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${
                !isLogin
                  ? 'bg-background text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Register
            </button>
          </div>

          {isLogin ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-username">Username</Label>
                <Input
                  id="login-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  autoComplete="username"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">Master Password</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your master password"
                    autoComplete="current-password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <Button type="submit" className="w-full" disabled={loading || !username.trim() || !password}>
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Lock className="h-4 w-4 mr-2" />
                )}
                Unlock Vault
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reg-username">Username</Label>
                <Input
                  id="reg-username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Choose a username"
                  autoComplete="username"
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-password">Master Password</Label>
                <div className="relative">
                  <Input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowRegPassword(!showRegPassword)}
                  >
                    {showRegPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="reg-confirm">Confirm Master Password</Label>
                <Input
                  id="reg-confirm"
                  type="password"
                  value={regConfirm}
                  onChange={(e) => setRegConfirm(e.target.value)}
                  placeholder="Re-enter your master password"
                  autoComplete="new-password"
                />
              </div>
              <PasswordGenerator value={regPassword} onChange={setRegPassword} />
              <Button
                type="submit"
                className="w-full"
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
          <div className="mt-6 flex items-start gap-2 rounded-lg bg-muted/40 p-3">
            <Shield className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Your master password is never sent to the server. All encryption and decryption happens
              locally in your browser using AES-256-GCM.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =============== VAULT SCREEN ===============
function VaultScreen() {
  const { token, encryptionKey, username, logout } = useAuthStore();
  const { entries, isLoading, setLoading, setEntries, addEntry, updateEntry, removeEntry, getFilteredAndSorted } =
    useVaultStore();
  const { resetTimer } = useTimeoutStore();

  const [formOpen, setFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<DecryptedEntry | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [changePwOpen, setChangePwOpen] = useState(false);
  const [versionInfo, setVersionInfo] = useState<string>(APP_VERSION);
  const fetchedRef = useRef(false);

  // Fetch entries on mount
  const fetchEntries = useCallback(async () => {
    if (!token || !encryptionKey || fetchedRef.current) return;
    fetchedRef.current = true;
    setLoading(true);
    try {
      const res = await fetch('/api/vault/entries', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        throw new Error('Failed to fetch');
      }
      const { entries: rawEntries } = await res.json();

      const decrypted: DecryptedEntry[] = [];
      for (const e of rawEntries) {
        try {
          const data = await decryptEntry(e.encryptedData, e.iv, encryptionKey);
          decrypted.push({
            id: e.id,
            data,
            createdAt: e.createdAt,
            updatedAt: e.updatedAt,
          });
        } catch {
          // Entry might be corrupt or from different key
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
    } catch {
      // fallback to APP_VERSION
    }
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

  const handleSaved = (entry: DecryptedEntry) => {
    addEntry(entry);
  };

  const handleUpdated = (entry: DecryptedEntry) => {
    updateEntry(entry.id, entry);
  };

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
  const { viewMode, searchQuery } = useVaultStore();

  return (
    <div
      className="min-h-screen flex flex-col vault-bg"
      onMouseMove={resetTimer}
      onKeyDown={resetTimer}
      onWheel={resetTimer}
      onClick={resetTimer}
    >
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
              <VaultIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h1 className="text-sm font-semibold leading-none">Password Vault</h1>
              <p className="text-xs text-muted-foreground">{versionInfo}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
              <div className="h-6 w-px bg-border" />
              <span>{username}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="h-4 w-4 mr-1.5" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 py-6">
        <VaultHeader
          onAddEntry={handleAddEntry}
          onExport={() => setExportOpen(true)}
          onImport={() => setImportOpen(true)}
          onChangePassword={() => setChangePwOpen(true)}
        />

        <div className="mt-6">
          {isLoading ? (
            // Loading skeletons
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-2'}>
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-40 rounded-xl" />
              ))}
            </div>
          ) : filteredEntries.length === 0 ? (
            // Empty state
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <VaultIcon className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h3 className="text-lg font-medium text-muted-foreground">
                {searchQuery ? 'No results found' : 'Your vault is empty'}
              </h3>
              <p className="text-sm text-muted-foreground/60 mt-1 max-w-sm">
                {searchQuery
                  ? `No entries match "${searchQuery}"`
                  : 'Add your first password entry to get started with your secure vault.'}
              </p>
              {!searchQuery && (
                <Button onClick={handleAddEntry} className="mt-4">
                  Add Your First Entry
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              )}
            </div>
          ) : viewMode === 'grid' ? (
            // Grid view
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredEntries.map((entry) => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={handleEditEntry}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          ) : (
            // List view
            <div className="space-y-2">
              {/* List header */}
              <div className="flex items-center gap-3 px-4 py-2 text-xs font-medium text-muted-foreground border-b border-border/40 mb-1">
                <div className="flex-1">Platform</div>
                <div className="hidden md:block w-36">Username</div>
                <div className="hidden lg:block w-44">Email</div>
                <div className="w-48">Password</div>
                <div className="hidden sm:block w-24 text-right">Modified</div>
                <div className="w-16" />
              </div>
              {filteredEntries.map((entry) => (
                <EntryRow
                  key={entry.id}
                  entry={entry}
                  onEdit={handleEditEntry}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/80 backdrop-blur-xl mt-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between text-xs text-muted-foreground">
          <span>Password Vault {versionInfo} — Zero-Knowledge Encryption</span>
          <span className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            AES-256-GCM
          </span>
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

    const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes
    const WARNING_MS = 4 * 60 * 1000; // 4 minutes
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

    // Track activity
    const onActivity = () => {
      if (useTimeoutStore.getState().isWarning) {
        // While warning is showing, activity dismisses it
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

    // Check inactivity every second
    const checkInterval = setInterval(() => {
      const elapsed = Date.now() - lastActivity;

      if (elapsed >= TIMEOUT_MS) {
        // Auto-logout
        clearInterval(checkInterval);
        if (countdownId) clearInterval(countdownId);
        if (timeoutId) clearTimeout(timeoutId);
        handleAutoLogout();
        return;
      }

      if (elapsed >= WARNING_MS && !warningTriggered) {
        warningTriggered = true;
        useTimeoutStore.getState().startWarning();
        // Start countdown
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

  // No need for separate checking state - mounted covers it

  // Set timeout logout callback
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

  return isAuthenticated ? <VaultScreen /> : <AuthScreen />;
}