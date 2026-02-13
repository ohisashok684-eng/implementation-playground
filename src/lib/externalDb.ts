import { supabase } from '@/integrations/supabase/client';

const FUNCTION_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/external-db`;

async function getHeaders() {
  const { data: { session } } = await supabase.auth.getSession();
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session?.access_token || ''}`,
    'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  };
}

async function call(action: string, body: Record<string, any> = {}) {
  const headers = await getHeaders();
  const res = await fetch(`${FUNCTION_URL}?action=${action}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'External DB request failed');
  }

  return res.json();
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
