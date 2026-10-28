import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

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
          detectSessionInUrl: true,
        },
      });
    } catch (e) {
      console.error('Error creating Supabase client:', e);
      return null;
    }
  }
  return clientInstance;
}

/**
 * Diagnostic test to verify live connection to Supabase PostgreSQL database
 */
export async function testConnection(): Promise<{ 
  success: boolean; 
  message: string; 
  configured: boolean;
  venuesCount?: number;
  bookingsCount?: number;
}> {
  const { isConfigured, url } = getSupabaseCredentials();
  if (!isConfigured) {
    return { 
      success: false, 
      configured: false,
      message: 'Supabase credentials not configured in .env. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.' 
    };
  }

  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      configured: false,
      message: 'Unable to initialize Supabase client with current credentials.',
    };
  }

  try {
    const { data: venues, error: venueError } = await client.from('venues').select('*');
    if (venueError) {
      if (venueError.code === '42P01') {
        return {
          success: true,
          configured: true,
          message: `Connected to Supabase (${url})! Tables need initialization: run supabase/schema.sql in the Supabase SQL Editor.`,
        };
      }
      return { 
        success: false, 
        configured: true, 
        message: `Connected to Supabase, but query failed: ${venueError.message}` 
      };
    }

    const { data: bookings } = await client.from('bookings').select('id');

    return {
      success: true,
      configured: true,
      message: `Successfully connected to Supabase PostgreSQL (${url})! Verified ${venues?.length ?? 0} venues and ${bookings?.length ?? 0} bookings.`,
      venuesCount: venues?.length ?? 0,
      bookingsCount: bookings?.length ?? 0,
    };
  } catch (err: any) {
    return { 
      success: false, 
      configured: true, 
      message: err.message || 'Network connection failed while reaching Supabase.' 
    };
  }
}

/**
 * Supabase Auth: Sign In with Institutional Email & Password
 */
export async function supabaseSignIn(email: string, password: string): Promise<{ user: User | null; session: Session | null; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { user: null, session: null, error: new Error('Supabase client is not configured.') };
  }

  const { data, error } = await client.auth.signInWithPassword({ email, password });
  return { user: data.user, session: data.session, error };
}

/**
 * Supabase Auth: Sign Up new Institutional User
 */
export async function supabaseSignUp(email: string, password: string, metadata?: { full_name?: string; department?: string; role?: string }): Promise<{ user: User | null; session: Session | null; error: Error | null }> {
  const client = getSupabase();
  if (!client) {
    return { user: null, session: null, error: new Error('Supabase client is not configured.') };
  }

  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: metadata || {},
    },
  });
  return { user: data.user, session: data.session, error };
}

/**
 * Supabase Auth: Sign Out
 */
export async function supabaseSignOut(): Promise<{ error: Error | null }> {
  const client = getSupabase();
  if (!client) return { error: null };
  const { error } = await client.auth.signOut();
  return { error };
}
