import { createClient, SupabaseClient } from '@supabase/supabase-js';

export function getSupabaseCredentials() {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

  const url = envUrl.trim();
  const key = envKey.trim();

  const isConfigured = Boolean(
    url && 
    key && 
    !url.includes('your-project-id') && 
    !key.includes('your-anon')
  );

  return { url, key, isConfigured };
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
      message: 'Supabase credentials not configured in .env. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' 
    };
  }

  try {
    const { data, error } = await client.from('venues').select('*');
    if (error) {
      if (error.code === '42P01') {
        return {
          success: true,
          message: 'Connected to Supabase! (Tables need initialization via supabase/schema.sql in SQL Editor).',
        };
      }
      return { success: false, message: `Database error: ${error.message}` };
    }
    return {
      success: true,
      message: `Connected to Supabase PostgreSQL! Found ${data?.length ?? 0} venue records.`,
      rowCount: data?.length ?? 0,
    };
  } catch (err: any) {
    return { success: false, message: err.message || 'Connection failed' };
  }
}
