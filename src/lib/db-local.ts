/**
 * Local-only IndexedDB storage for VaultGuard.
 * All data stays on the user's device. No server needed.
 */

const DB_NAME = 'vaultguard';
const DB_VERSION = 1;

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;

      // Settings store: vault name, password hash, salts
      if (!db.objectStoreNames.contains('settings')) {
        db.createObjectStore('settings', { keyPath: 'key' });
      }

      // Entries store: encrypted vault entries
      if (!db.objectStoreNames.contains('entries')) {
        const entryStore = db.createObjectStore('entries', { keyPath: 'id' });
        entryStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ============ VAULT CREDENTIALS ============

export interface VaultCredentials {
  name: string;
  passwordHash: string;
  salt: string;
  encryptionSalt: string;
}

export async function vaultExists(): Promise<boolean> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const request = store.get('credentials');
    request.onsuccess = () => resolve(request.result !== undefined);
    request.onerror = () => reject(request.error);
  });
}

export async function getVaultCredentials(): Promise<VaultCredentials | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readonly');
    const store = tx.objectStore('settings');
    const request = store.get('credentials');
    request.onsuccess = () => resolve(request.result?.value ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function createVault(credentials: VaultCredentials): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    store.put({ key: 'credentials', value: credentials });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateVaultCredentials(credentials: Partial<VaultCredentials>): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('settings', 'readwrite');
    const store = tx.objectStore('settings');
    const getReq = store.get('credentials');
    getReq.onsuccess = () => {
      const existing = getReq.result?.value;
      if (!existing) { reject(new Error('No vault found')); return; }
      store.put({ key: 'credentials', value: { ...existing, ...credentials } });
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

// ============ VAULT ENTRIES ============

export interface StoredEntry {
  id: string;
  encryptedData: string;
  iv: string;
  createdAt: string;
  updatedAt: string;
}

export async function getAllEntries(): Promise<StoredEntry[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readonly');
    const store = tx.objectStore('entries');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as StoredEntry[]);
    request.onerror = () => reject(request.error);
  });
}

export async function saveEntry(entry: StoredEntry): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readwrite');
    const store = tx.objectStore('entries');
    store.put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function updateEntry(id: string, encryptedData: string, iv: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readwrite');
    const store = tx.objectStore('entries');
    const getReq = store.get(id);
    getReq.onsuccess = () => {
      const existing = getReq.result;
      if (!existing) { reject(new Error('Entry not found')); return; }
      const updated = { ...existing, encryptedData, iv, updatedAt: new Date().toISOString() };
      store.put(updated);
    };
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteEntry(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readwrite');
    const store = tx.objectStore('entries');
    store.delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function deleteEntries(ids: string[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readwrite');
    const store = tx.objectStore('entries');
    for (const id of ids) {
      store.delete(id);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function saveEntries(entries: StoredEntry[]): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('entries', 'readwrite');
    const store = tx.objectStore('entries');
    for (const entry of entries) {
      store.put(entry);
    }
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}

export async function clearAllData(): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(['settings', 'entries'], 'readwrite');
    tx.objectStore('settings').clear();
    tx.objectStore('entries').clear();
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
}