import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Routes session tokens to localStorage (persist across browser restarts)
// or sessionStorage (cleared when browser closes) based on user preference.
const authStorage: Storage = {
  get length() {
    return localStorage.length;
  },
  key(index: number) {
    return localStorage.key(index);
  },
  getItem(key: string): string | null {
    const remember = localStorage.getItem('taskpilot-remember-me') !== 'false';
    return (remember ? localStorage : sessionStorage).getItem(key);
  },
  setItem(key: string, value: string): void {
    const remember = localStorage.getItem('taskpilot-remember-me') !== 'false';
    if (remember) {
      localStorage.setItem(key, value);
    } else {
      sessionStorage.setItem(key, value);
      // Clear any stale session from localStorage when not remembering
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
