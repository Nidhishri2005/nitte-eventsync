import { createClient, SupabaseClient } from '@supabase/supabase-js';

const STORAGE_KEY_SUPABASE_URL = 'nitte_eventsync_supabase_url';
const STORAGE_KEY_SUPABASE_KEY = 'nitte_eventsync_supabase_anon_key';

export function getSupabaseCredentials() {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  const storedUrl = localStorage.getItem(STORAGE_KEY_SUPABASE_URL) || '';
  const storedKey = localStorage.getItem(STORAGE_KEY_SUPABASE_KEY) || '';

  const url = (storedUrl || envUrl).trim();
  const key = (storedKey || envKey).trim();

  const isConfigured = Boolean(
    url && 
    key && 
    !url.includes('your-project-id') && 
    !key.includes('your-anon')
  );

  return { url, key, isConfigured };
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (url && key) {
    localStorage.setItem(STORAGE_KEY_SUPABASE_URL, url.trim());
    localStorage.setItem(STORAGE_KEY_SUPABASE_KEY, key.trim());
    clientInstance = null; // reset client to reload with new creds
  } else {
    localStorage.removeItem(STORAGE_KEY_SUPABASE_URL);
    localStorage.removeItem(STORAGE_KEY_SUPABASE_KEY);
    clientInstance = null;
  }
}

export function getStoredSupabaseConfig() {
  const { url, key, isConfigured } = getSupabaseCredentials();
  return { 
    url, 
    key, 
    anonKey: key, 
    isConfigured, 
    isConnected: isConfigured 
  };
}

export function saveStoredSupabaseConfig(url: string, anonKey: string) {
  saveSupabaseCredentials(url, anonKey);
}

let clientInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const { url, key, isConfigured } = getSupabaseCredentials();
  if (!isConfigured) return null;

  if (!clientInstance) {
    try {
      clientInstance = createClient(url, key, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
    } catch (e) {
      console.error('Error creating Supabase client:', e);
      return null;
    }
  }
  return clientInstance;
}

export async function testConnection(): Promise<{ success: boolean; message: string; rowCount?: number }> {
  const client = getSupabase();
  if (!client) {
    return { 
      success: false, 
      message: 'Supabase credentials not configured yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env or in the Database Settings dialog.' 
    };
  }

  try {
    const { data, error } = await client.from('venues').select('*');
    if (error) {
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Connected to Supabase! (Tables not created yet — please run supabase/schema.sql in the SQL Editor)',
        };
      }
      return { success: false, message: `Database error: ${error.message}` };
    }
    return {
      success: true,
      message: `Connected to Supabase! Found ${data?.length ?? 0} venue records in public.venues.`,
      rowCount: data?.length ?? 0,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection failed' };
  }
}

export async function testSupabaseConnection(url?: string, anonKey?: string): Promise<{ success: boolean; message: string; venueCount?: number }> {
  if (url && anonKey) {
    saveSupabaseCredentials(url, anonKey);
  }
  const result = await testConnection();
  return {
    success: result.success,
    message: result.message,
    venueCount: result.rowCount,
  };
}
