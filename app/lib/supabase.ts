import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);
export const supabaseSetupMessage =
  "Supabase is not configured. Add EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY to your environment.";

// Provide a no-op WebSocket shim during SSR/build to avoid Node.js < 22 errors.
// In the browser/native runtime, the real WebSocket will be used.
const noopWS: any =
  typeof WebSocket !== 'undefined'
    ? WebSocket
    : class {
        close() {}
        send() {}
        addEventListener() {}
        removeEventListener() {}
      };

const supabase = createClient(supabaseUrl || "https://example.supabase.co", supabaseKey || "missing-anon-key", {
  realtime: { transport: noopWS },
  auth: { persistSession: true, autoRefreshToken: true },
});

export { supabase };
