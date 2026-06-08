import { getUserAccessSnapshot } from '../../lib/server-access.js';
import { getAuthenticatedUser } from '../_utils/auth.js';
import { applyRateLimit } from '../_utils/rateLimit.js';
import { handlePreflight, setSecurityHeaders } from '../_utils/security.js';

export default async function handler(req: any, res: any) {
  if (handlePreflight(req, res)) return;
  setSecurityHeaders(res);

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  if (applyRateLimit(req, res, 60, 60_000)) return;

  try {
    const { user, error } = await getAuthenticatedUser(req);
    if (error || !user) {
      return res.status(401).json({ error: 'No autorizado.' });
    }

    const snapshot = await getUserAccessSnapshot(user.id);
    res.json(snapshot);
  } catch (error: any) {
    console.error('Access snapshot API Error:', error);
    res.status(500).json({ error: 'No se pudo obtener el estado de acceso.' });
  }
}
