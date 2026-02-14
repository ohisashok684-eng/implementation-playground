import { supabase } from '@/integrations/supabase/client';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/external-db`;
const TOKEN_MARGIN_SEC = 60;

async function getFreshToken(): Promise<string> {
  const { data: { session } } = await supabase.auth.getSession();

  if (!session) {
    console.warn('[externalDb] No session found');
    return '';
  }

  // Check if token is expired or about to expire
  const now = Math.floor(Date.now() / 1000);
  if (session.expires_at && session.expires_at - now < TOKEN_MARGIN_SEC) {
    console.warn('[externalDb] Token expired or expiring soon, refreshing...');
    const { data: refreshed, error } = await supabase.auth.refreshSession();
    if (error || !refreshed.session) {
      console.warn('[externalDb] Refresh failed, using old token', error?.message);
      return session.access_token;
    }
    return refreshed.session.access_token;
  }

  return session.access_token;
}

function buildHeaders(token: string) {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}

async function call(action: string, body: Record<string, any> = {}, _retried401 = false): Promise<any> {
  const token = await getFreshToken();
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const res = await fetch(`${FUNCTION_URL}?action=${action}`, {
      method: 'POST',
      headers: buildHeaders(token),
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);

    // Smart 401 retry: force refresh and try once more
    if (res.status === 401 && !_retried401) {
      console.warn(`[externalDb] 401 on ${action}, forcing token refresh and retrying...`);
      const { data: refreshed, error } = await supabase.auth.refreshSession();
      if (!error && refreshed.session) {
        return call(action, body, true);
      }
      throw new Error('Session expired — please sign in again');
    }

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'External DB request failed');
    }

    return res.json();
  } catch (err) {
    clearTimeout(timeout);
    // Network/timeout retry (once), but not if we already retried for 401
    if (!_retried401 && err instanceof DOMException && err.name === 'AbortError') {
      console.warn(`[externalDb] Timeout on ${action}, retrying...`);
      return call(action, body, true);
    }
    throw err;
  }
}

export const externalDb = {
  /** Initialize schema on external DB */
  setup: () => call('setup'),

  /** Execute multiple select queries in a single request */
  batch: (queries: Array<{ action: string; table: string; [key: string]: any }>) =>
    call('batch', { queries }),

  /** Select rows from a table */
  select: (
    table: string,
    options?: {
      filters?: Record<string, any>;
      order?: { column: string; ascending?: boolean };
      single?: boolean;
      withSteps?: boolean;
    }
  ) => call('select', { table, ...options }),

  /** Insert a row */
  insert: (table: string, data: Record<string, any>) =>
    call('insert', { table, data }),

  /** Update rows matching conditions */
  update: (table: string, data: Record<string, any>, match: Record<string, any>) =>
    call('update', { table, data, match }),

  /** Upsert (insert or update on conflict) */
  upsert: (table: string, data: Record<string, any>, onConflict: string) =>
    call('upsert', { table, data, onConflict }),

  /** Delete rows matching conditions */
  delete: (table: string, match: Record<string, any>) =>
    call('delete', { table, match }),

  // Admin variants (no user_id scoping)
  admin: {
    select: (
      table: string,
      options?: {
        filters?: Record<string, any>;
        order?: { column: string; ascending?: boolean };
        withSteps?: boolean;
      }
    ) => call('admin_select', { table, ...options }),

    insert: (table: string, data: Record<string, any>) =>
      call('admin_insert', { table, data }),

    update: (table: string, data: Record<string, any>, match: Record<string, any>) =>
      call('admin_update', { table, data, match }),

    upsert: (table: string, data: Record<string, any>, onConflict: string) =>
      call('admin_upsert', { table, data, onConflict }),

    delete: (table: string, match: Record<string, any>) =>
      call('admin_delete', { table, match }),
  },
};
