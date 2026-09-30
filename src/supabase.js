import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

function normalizeProjectUrl(value) {
  try {
    const parsed = new URL(value);
    if (parsed.protocol !== 'https:' || parsed.search || parsed.hash) return null;
    const path = parsed.pathname.replace(/\/+$/, '').toLowerCase();
    const apiPaths = ['/auth/v1', '/rest/v1', '/storage/v1', '/functions/v1'];
    if (path && !apiPaths.includes(path)) return null;
    return `${parsed.origin}/`;
  } catch {
    return null;
  }
}

const projectUrl = url ? normalizeProjectUrl(url) : null;

export const supabaseConfigIssue = !url
  ? 'VITE_SUPABASE_URL is missing from this frontend build.'
  : url.includes('your-project')
    ? 'VITE_SUPABASE_URL still contains the example value.'
    : !projectUrl
      ? 'VITE_SUPABASE_URL must be the HTTPS project root (a /auth/v1, /rest/v1, /storage/v1, or /functions/v1 suffix is also accepted).'
      : !anonKey
        ? 'VITE_SUPABASE_ANON_KEY is missing from this frontend build.'
        : anonKey.includes('your-supabase')
          ? 'VITE_SUPABASE_ANON_KEY still contains the example value.'
          : null;

export const supabaseConfigured = !supabaseConfigIssue;
export const supabase = supabaseConfigured ? createClient(projectUrl, anonKey) : null;
