import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function isProjectRoot(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' && parsed.pathname === '/' && !parsed.search && !parsed.hash;
  } catch {
    return false;
  }
}

export const supabaseConfigured = Boolean(url && isProjectRoot(url) && anonKey && !url.includes('your-project') && !anonKey.includes('your-supabase'));
export const supabase = supabaseConfigured ? createClient(url, anonKey) : null;
