import { supabaseAdmin } from '../../lib/supabase-admin.js';
import { getAuthenticatedUser } from '../_utils/auth.js';
import { applyRateLimit } from '../_utils/rateLimit.js';
import { handlePreflight, setSecurityHeaders } from '../_utils/security.js';

export default async function handler(req: any, res: any) {
  if (handlePreflight(req, res)) return;
  setSecurityHeaders(res);

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });
  if (applyRateLimit(req, res, 30, 60_000)) return;

  const CEO_EMAIL = process.env.CEO_EMAIL || '';

  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    const userId = user?.id || null;

    if (authError || !userId || !CEO_EMAIL) {
      return res.status(401).json({ isCEO: false });
    }

    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (authErr || !authUser?.user?.email) {
      return res.status(401).json({ isCEO: false });
    }

    const userEmail = authUser.user.email;
    
    if (userEmail.toLowerCase() !== CEO_EMAIL.toLowerCase()) {
      return res.status(403).json({ isCEO: false });
    }

    res.json({ isCEO: true });
  } catch (error: any) {
    res.status(500).json({ isCEO: false });
  }
}
