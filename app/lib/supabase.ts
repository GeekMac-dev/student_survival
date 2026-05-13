import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://ycrqobutgyvxtpsxexne.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InljcnFvYnV0Z3l2eHRwc3hleG5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2NjA4MjIsImV4cCI6MjA5NDIzNjgyMn0._t0wXbA-Q0RaixWVc9WrpImP1NzTZVAjVeqd0mce60g';

// Provide a no-op WebSocket shim during SSR/build to avoid Node.js < 22 errors.
// In the browser/native runtime, the real WebSocket will be used.
const noopWS: any =
  typeof WebSocket !== 'undefined'
    ? WebSocket
    : class {
        constructor() {}
        close() {}
        send() {}
        addEventListener() {}
        removeEventListener() {}
      };

const supabase = createClient(supabaseUrl, supabaseKey, {
  realtime: { transport: noopWS },
  auth: { persistSession: true, autoRefreshToken: true },
});

export { supabase };
