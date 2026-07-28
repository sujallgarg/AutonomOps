'use client';

export interface UserSession {
  name: string;
  email: string;
  role: 'owner' | 'client';
}

const AUTH_STORAGE_KEY = 'autonomops_user';

export function getStoredSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setStoredSession(session: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
  window.dispatchEvent(new Event('autonomops_auth_change'));
}

export function clearStoredSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
  window.dispatchEvent(new Event('autonomops_auth_change'));
}

export interface RegisteredAccount {
  name: string;
  email: string;
  passwordHash: string;
  role: 'owner' | 'client';
}

const REGISTRATION_STORAGE_KEY = 'autonomops_registered_accounts';

export function getRegisteredAccounts(): RegisteredAccount[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(REGISTRATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function verifyAccountCredentials(email: string, password: string): { valid: boolean; error?: string; account?: RegisteredAccount } {
  const accounts = getRegisteredAccounts();
  const cleanEmail = (email || '').trim().toLowerCase();
  const found = accounts.find((a) => a.email.toLowerCase() === cleanEmail);

  if (!found) {
    return { valid: true }; // New registration
  }

  if (found.passwordHash !== password) {
    return { valid: false, error: `Incorrect password for ${email}. Access denied.` };
  }

  return { valid: true, account: found };
}

export function saveRegisteredAccount(name: string, email: string, password: string, role: 'owner' | 'client'): void {
  if (typeof window === 'undefined') return;
  const accounts = getRegisteredAccounts();
  const cleanEmail = (email || '').trim().toLowerCase();
  const index = accounts.findIndex((a) => a.email.toLowerCase() === cleanEmail);
  const entry: RegisteredAccount = { name, email: cleanEmail, passwordHash: password, role };

  if (index >= 0) {
    accounts[index] = entry;
  } else {
    accounts.push(entry);
  }

  localStorage.setItem(REGISTRATION_STORAGE_KEY, JSON.stringify(accounts));
}
