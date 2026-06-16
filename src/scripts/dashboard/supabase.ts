// Supabase client + auth bridge for the dashboard (Week 3 — migrate reads).
//
// Reads move to Supabase (Postgres RPC `get_dashboard_data`, computed under RLS).
// Writes still go through the Apps Script backend (api.ts) during the transition.
// The login bridges a Google ID token into a Supabase session via
// signInWithIdToken — same Google account, no extra redirect.

import { createClient, type Session } from '@supabase/supabase-js';
import { getDashboardData as getDashboardDataGas, type DashboardData } from './api';

export const SUPABASE_URL = 'https://yykocvhorgcgzaluuldn.supabase.co';

// Anon key — PUBLIC by design (ships in the browser bundle). Security does NOT
// depend on hiding it: Row Level Security only lets the owner's authenticated
// session read rows (anon sees 0). Same trust model as the GOOGLE_CLIENT_ID.
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5a29jdmhvcmdjZ3phbHV1bGRuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMjYwNTYsImV4cCI6MjA5NTgwMjA1Nn0.04ya1crnMRK6SgLfwhhxIp14DQ1n_ZkY5Fj-urTsv1E';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false },
});

export async function getSupabaseSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession();
  return data.session;
}

// Bridge: exchange a Google ID token (from GIS) for a Supabase session so RLS
// reads work. Never throws — a failure here must not block the GAS login.
export async function signInToSupabase(idToken: string, nonce?: string): Promise<boolean> {
  try {
    // nonce: raw value whose SHA-256 hash is embedded in the FedCM ID token.
    // Supabase rejects the token if the nonces don't match (or one is missing).
    const { error } = await supabase.auth.signInWithIdToken({ provider: 'google', token: idToken, nonce });
    if (error) {
      console.error('[supabase] signInWithIdToken failed:', error.message);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[supabase] signInWithIdToken threw:', err);
    return false;
  }
}

export async function signOutSupabase(): Promise<void> {
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('[supabase] signOut failed:', err);
  }
}

// Read path: prefer the Supabase RPC (computed in Postgres, RLS-scoped). Falls
// back to the legacy Apps Script endpoint if there's no Supabase session yet or
// the RPC errors — so the dashboard never goes blank mid-migration.
export async function getDashboardDataSmart(): Promise<DashboardData> {
  const session = await getSupabaseSession();
  if (session) {
    const { data, error } = await supabase.rpc('get_dashboard_data');
    if (!error && data) return data as DashboardData;
    console.warn('[supabase] get_dashboard_data RPC failed, falling back to GAS:', error?.message);
  }
  return getDashboardDataGas();
}
