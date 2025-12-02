// src/lib/supabase-server.ts
import 'server-only';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Centralized, server-only Supabase client using the service role key.
 * This gives the backend full Storage access (uploads, path management),
 * while keeping the key out of any client bundles.
 */
let cachedClient: SupabaseClient | null = null;

function getSupabaseConfig() {
  // URL can be shared between client and server; key must stay server-only.
  const url =
    process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    throw new Error(
      'Supabase URL is not configured. Set SUPABASE_URL or NEXT_PUBLIC_SUPABASE_URL in the environment.'
    );
  }

  if (!serviceRoleKey) {
    throw new Error(
      'Supabase service role key is not configured. Set SUPABASE_SERVICE_ROLE_KEY in the environment.'
    );
  }

  return { url, serviceRoleKey };
}

/**
 * Returns a singleton Supabase client for server-side code.
 * Using a shared instance avoids reinitializing the client on every call.
 */
export function getSupabaseServerClient(): SupabaseClient {
  if (cachedClient) return cachedClient;

  const { url, serviceRoleKey } = getSupabaseConfig();

  cachedClient = createClient(url, serviceRoleKey, {
    auth: {
      // We don't need long-lived sessions on the server – NextAuth handles auth.
      persistSession: false,
    },
    global: {
      // Reuse the platform fetch so we don't surprise Next.js.
      fetch,
    },
  });

  return cachedClient;
}

/**
 * Small helper for generating public URLs in one place.
 * Keeping this centralized makes it easier to swap bucket strategy later.
 */
export function getSupabasePublicUrl(params: {
  bucket: string;
  path: string;
}): string | null {
  const client = getSupabaseServerClient();
  const { data } = client.storage.from(params.bucket).getPublicUrl(params.path);

  return data?.publicUrl ?? null;
}