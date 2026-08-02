import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase config:', { supabaseUrl: !!supabaseUrl, supabaseServiceKey: !!supabaseServiceKey });
  throw new Error('Missing Supabase URL or Service Role Key');
}

// Cliente admin con privilegios completos (service role) para la base de conocimiento RAG
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
