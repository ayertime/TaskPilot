import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const REMEMBER_ME_KEY = 'taskpilot-remember-me';

let rememberMe = localStorage.getItem(REMEMBER_ME_KEY) !== 'false';

export function setRememberMe(value: boolean) {
  rememberMe = value;
  localStorage.setItem(REMEMBER_ME_KEY, String(value));
}

// Routes session tokens to localStorage or sessionStorage based on preference.
const authStorage: Storage = {
  get length() {
    const store = rememberMe ? localStorage : sessionStorage;
    return store.length;
  },
  key(index: number) {
    const store = rememberMe ? localStorage : sessionStorage;
    return store.key(index);
  },
  getItem(key: string): string | null {
    return (rememberMe ? localStorage : sessionStorage).getItem(key);
  },
  setItem(key: string, value: string): void {
    if (rememberMe) {
      localStorage.setItem(key, value);
    } else {
      sessionStorage.setItem(key, value);
      if (key.startsWith('sb-')) localStorage.removeItem(key);
    }
  },
  removeItem(key: string): void {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
  clear(): void {
    localStorage.clear();
    sessionStorage.clear();
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: authStorage,
    autoRefreshToken: true,
    persistSession: true,
  },
});
