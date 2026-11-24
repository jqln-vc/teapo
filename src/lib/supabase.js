import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * False until .env.local carries a real anon key. Checked before anything renders,
 * so a missing key shows setup instructions rather than a blank page and a console
 * error. Both values are public by design — RLS is what protects the data.
 */
export const isConfigured = Boolean(url && anonKey && !anonKey.startsWith("paste-your"));

export const supabase = createClient(
  url || "https://placeholder.supabase.co",
  anonKey || "placeholder",
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
);
