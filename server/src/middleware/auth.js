import { createClient } from '@supabase/supabase-js';

let supabase = null;

function getSupabase() {
  if (!supabase) {
    supabase = createClient(
      process.env.SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
  }
  return supabase;
}

export async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Missing Bearer token' },
      });
    }

    const token = authHeader.slice(7);
    const { data: { user }, error } = await getSupabase().auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Invalid or expired token' },
      });
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
