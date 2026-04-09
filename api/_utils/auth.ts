import { supabaseAdmin } from '../../lib/supabase-admin.js';

const getBearerToken = (req: any): string | null => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (typeof authHeader !== 'string') return null;

  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1] || null;
};

export const getAuthenticatedUser = async (req: any) => {
  const token = getBearerToken(req);

  if (!token) {
    return { user: null, error: 'Missing bearer token' };
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !data.user) {
    return { user: null, error: error?.message || 'Invalid token' };
  }

  return { user: data.user, error: null };
};
