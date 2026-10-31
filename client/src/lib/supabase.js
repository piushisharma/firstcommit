import { createClient } from '@supabase/supabase-js';

const DEFAULT_SUPABASE_URL = 'https://lfeukxybbbdwwspegulh.supabase.co';
const DEFAULT_SUPABASE_KEY = 'sb_publishable_m0exJLMI3tD0VlvhrAz-7w_tx-_3rZU';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || DEFAULT_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_KEY;

export const supabase = createClient(supabaseUrl, supabaseKey);

export async function signInWithGitHub() {
  if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
    throw new Error('Supabase URL is not configured. Please check VITE_SUPABASE_URL in your environment variables.');
  }

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });

  if (error) {
    throw error;
  }

  if (data?.url) {
    window.location.href = data.url;
  }

  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
}
