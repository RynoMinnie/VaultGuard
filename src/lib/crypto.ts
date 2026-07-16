/**
 * Client-side encryption utilities using Web Crypto API.
 * Zero-knowledge architecture: encryption key is derived from master password
 * and never leaves the client.
 */

export interface PasswordHistoryEntry {
  password: string;
  timestamp: string;
}

export interface VaultEntryData {
  platform: string;
  platformUrl: string;
  username: string;
  email: string;
  password: string;
  other: string;
  category: string;
  lastAccessed: string;
  isFavorite: boolean;
  expiryDate: string;
  totpSecret: string;
  passwordHistory: PasswordHistoryEntry[];
}

const PBKDF2_ITERATIONS = 600000;
const KEY_LENGTH = 256;
const AES_ALGO = 'AES-GCM';

function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer;
}

function stringToArrayBuffer(str: string): ArrayBuffer {
  return new TextEncoder().encode(str).buffer;
}

function arrayBufferToString(buffer: ArrayBuffer): string {
  return new TextDecoder().decode(buffer);
}

/**
 * Hash a password with a salt using PBKDF2 (for authentication)
 */
export async function hashPassword(
  password: string,
  salt: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    KEY_LENGTH
  );

  return bufferToBase64(bits);
}

/**
 * Derive an AES-GCM encryption key from master password + salt
 */
export async function deriveEncryptionKey(
  password: string,
  salt: string
): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: PBKDF2_ITERATIONS,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: AES_ALGO, length: KEY_LENGTH },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Generate a random salt
 */
export function generateSalt(): string {
  const salt = new Uint8Array(32);
  crypto.getRandomValues(salt);
  return bufferToBase64(salt.buffer);
}

/**
 * Generate a random IV for AES-GCM
 */
export function generateIV(): string {
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);
  return bufferToBase64(iv.buffer);
}

/**
 * Encrypt vault entry data
 */
export async function encryptEntry(
  data: VaultEntryData,
  key: CryptoKey
): Promise<{ encryptedData: string; iv: string }> {
  const iv = generateIV();
  const ivBuffer = base64ToBuffer(iv);

  const encrypted = await crypto.subtle.encrypt(
    {
      name: AES_ALGO,
      iv: ivBuffer,
    },
    key,
    stringToArrayBuffer(JSON.stringify(data))
  );

  return {
    encryptedData: bufferToBase64(encrypted),
    iv,
  };
}

/**
 * Decrypt vault entry data
 */
export async function decryptEntry(
  encryptedData: string,
  iv: string,
  key: CryptoKey
): Promise<VaultEntryData> {
  const decrypted = await crypto.subtle.decrypt(
    {
      name: AES_ALGO,
      iv: base64ToBuffer(iv),
    },
    key,
    base64ToBuffer(encryptedData)
  );

  return JSON.parse(arrayBufferToString(decrypted));
}

/**
 * Generate a cryptographically secure random password
 */
export function generatePassword(options: {
  length: number;
  uppercase: boolean;
  lowercase: boolean;
  numbers: boolean;
  symbols: boolean;
}): string {
  const { length, uppercase, lowercase, numbers, symbols } = options;

  let charset = '';
  if (uppercase) charset += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  if (lowercase) charset += 'abcdefghijklmnopqrstuvwxyz';
  if (numbers) charset += '0123456789';
  if (symbols) charset += '!@#$%^&*()_+-=[]{}|;:,.<>?';

  if (!charset) {
    charset = 'abcdefghijklmnopqrstuvwxyz';
  }

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);

  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset[array[i] % charset.length];
  }

  return password;
}