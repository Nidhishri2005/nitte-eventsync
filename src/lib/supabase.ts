import { createClient, SupabaseClient, User, Session } from '@supabase/supabase-js';

export function getSupabaseCredentials() {
  const envUrl = 
    (import.meta as any).env?.VITE_SUPABASE_URL || 
    (import.meta as any).env?.SUPABASE_URL || 
    (typeof window !== 'undefined' ? (window as any).__SUPABASE_URL__ || localStorage.getItem('VITE_SUPABASE_URL') : '') || '';

  const envKey = 
    (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
    (import.meta as any).env?.VITE_SUPABASE_KEY || 
    (import.meta as any).env?.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (import.meta as any).env?.SUPABASE_ANON_KEY || 
    (typeof window !== 'undefined' ? (window as any).__SUPABASE_ANON_KEY__ || localStorage.getItem('VITE_SUPABASE_ANON_KEY') : '') || '';

  // Clean leading/trailing quotes and whitespace
  const url = String(envUrl).trim().replace(/^['"]|['"]$/g, '');
  const key = String(envKey).trim().replace(/^['"]|['"]$/g, '');

  const isConfigured = Boolean(
    url && 
    key && 
    !url.includes('your-project-id') && 
    !key.includes('your-anon')
  );

  return { url, key, isConfigured };
}

let clientInstance: SupabaseClient | null = null;

export function setRuntimeSupabaseCredentials(url: string, key: string) {
  if (typeof window !== 'undefined') {
    if (url) localStorage.setItem('VITE_SUPABASE_URL', url.trim().replace(/^['"]|['"]$/g, ''));
    else localStorage.removeItem('VITE_SUPABASE_URL');
    
    if (key) localStorage.setItem('VITE_SUPABASE_ANON_KEY', key.trim().replace(/^['"]|['"]$/g, ''));
    else localStorage.removeItem('VITE_SUPABASE_ANON_KEY');
    
    clientInstance = null; // Invalidate cached instance
  }
}

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
  schemaApplied?: boolean;
}> {
  const { isConfigured, url } = getSupabaseCredentials();
  if (!isConfigured) {
    return { 
      success: false, 
      configured: false,
      schemaApplied: false,
      message: 'Supabase credentials not configured in .env. Please save VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in c:\\c programming\\nitte-eventsync\\.env' 
    };
  }

  const client = getSupabase();
  if (!client) {
    return {
      success: false,
      configured: false,
      schemaApplied: false,
      message: 'Unable to initialize Supabase client with current credentials.',
    };
  }

  try {
    const { data: venues, error: venueError } = await client.from('venues').select('*');
    if (venueError) {
      if (venueError.code === '42P01' || venueError.message?.includes('relation "public.venues" does not exist')) {
        return {
          success: true,
          configured: true,
          schemaApplied: false,
          message: `Connected to Supabase (${url})! Tables need initialization: please run supabase/schema.sql in the Supabase SQL Editor.`,
        };
      }
      return { 
        success: false, 
        configured: true, 
        schemaApplied: false,
        message: `Connected to Supabase, but query failed: ${venueError.message}` 
      };
    }

    const { data: bookings } = await client.from('bookings').select('id');

    return {
      success: true,
      configured: true,
      schemaApplied: true,
      message: `Successfully connected to hosted Supabase PostgreSQL (${url})! Verified ${venues?.length ?? 0} venues and ${bookings?.length ?? 0} bookings.`,
      venuesCount: venues?.length ?? 0,
      bookingsCount: bookings?.length ?? 0,
    };
  } catch (err: any) {
    return { 
      success: false, 
      configured: true, 
      schemaApplied: false,
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
