/**
 * CEO Dashboard API — Estadísticas de negocio
 * 
 * PROTECCIÓN: Solo accesible si el userId corresponde al email del CEO
 * configurado en la variable de entorno CEO_EMAIL / VITE_CEO_EMAIL.
 */

import { supabaseAdmin } from '../../lib/supabase-admin.js';
import { applyRateLimit } from '../_utils/rateLimit.js';
import { getAuthenticatedUser } from '../_utils/auth.js';
import { handlePreflight, setSecurityHeaders } from '../_utils/security.js';

export default async function handler(req: any, res: any) {
  if (handlePreflight(req, res)) return;
  setSecurityHeaders(res);

  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  // Rate limit — max 30 requests per minute
  if (applyRateLimit(req, res, 30, 60_000)) return;

  const CEO_EMAIL = process.env.CEO_EMAIL || process.env.VITE_CEO_EMAIL || '';

  try {
    const { user, error: authError } = await getAuthenticatedUser(req);
    const userId = user?.id || null;

    if (authError || !userId || !CEO_EMAIL) {
      console.error('CEO Stats: Missing auth context or CEO_EMAIL env var', { userId: !!userId, CEO_EMAIL: !!CEO_EMAIL });
      return res.status(401).json({ error: 'No autorizado. Configuración incompleta.' });
    }

    // === AUTH: Get the user's email from Supabase Auth (most reliable source) ===
    const { data: authUser, error: authErr } = await supabaseAdmin.auth.admin.getUserById(userId);
    
    if (authErr || !authUser?.user?.email) {
      console.error('CEO Stats: Failed to get auth user', authErr);
      return res.status(401).json({ error: 'No se pudo verificar tu identidad.' });
    }

    const userEmail = authUser.user.email;
    
    if (userEmail.toLowerCase() !== CEO_EMAIL.toLowerCase()) {
      console.error('CEO Stats: Email mismatch', { userEmail, expected: CEO_EMAIL });
      return res.status(403).json({ error: 'Acceso restringido. Solo el administrador puede ver estas métricas.' });
    }

    // === Fetch all metrics in parallel ===
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const [
      totalUsersResult,
      premiumUsersResult,
      recentUsersResult,
      monthlyUsageResult,
      entitlementsResult,
    ] = await Promise.all([
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }),
      supabaseAdmin.from('users').select('id', { count: 'exact', head: true }).eq('is_premium', true).gt('access_until', now.toISOString()),
      supabaseAdmin.from('users').select('id, email, is_premium, license_type, access_until, created_at').order('created_at', { ascending: false }).limit(20),
      supabaseAdmin.from('user_usage_monthly').select('*').eq('month', currentMonth),
      supabaseAdmin.from('user_entitlements').select('single_document_uses_remaining'),
    ]);

    let monthlyUsage: any[] = [];
    if (!monthlyUsageResult.error && monthlyUsageResult.data) {
      monthlyUsage = monthlyUsageResult.data;
    } else {
      const legacyMonthlyUsage = await supabaseAdmin.from('user_usage').select('*').eq('month', currentMonth);
      monthlyUsage = legacyMonthlyUsage.data || [];
    }

    const totalDocumentsThisMonth = monthlyUsage.reduce((sum: number, u: any) =>
      sum + (u.documents_generated_count || u.draft_basic_month_count || 0), 0
    );
    const totalCalculatorsThisMonth = monthlyUsage.reduce((sum: number, u: any) =>
      sum + (u.imss_calculations_count || u.calculators_count || 0), 0
    );

    let oneTimeDocumentsAvailable = 0;
    if (!entitlementsResult.error && entitlementsResult.data) {
      oneTimeDocumentsAvailable = entitlementsResult.data.reduce((sum: number, row: any) => sum + (row.single_document_uses_remaining || 0), 0);
    } else {
      const legacyResult = await supabaseAdmin.from('user_credits').select('draft_basic_balance');
      const legacyRows = legacyResult.data || [];
      oneTimeDocumentsAvailable = legacyRows.reduce((sum: number, row: any) => sum + (row.draft_basic_balance || 0), 0);
    }

    // Users with active premium
    const recentUsers = (recentUsersResult.data || []).map((u: any) => ({
      ...u,
      isPremiumActive: u.is_premium && u.access_until && new Date(u.access_until) > now,
    }));

    const stats = {
      overview: {
        totalUsers: totalUsersResult.count || 0,
        premiumUsers: premiumUsersResult.count || 0,
        documentsThisMonth: totalDocumentsThisMonth,
        calculatorsThisMonth: totalCalculatorsThisMonth,
        oneTimeDocumentsAvailable,
      },
      recentUsers,
      monthlyUsage: monthlyUsage.slice(0, 30),
      generatedAt: now.toISOString(),
    };

    res.json(stats);
  } catch (error: any) {
    console.error('CEO Stats API Error:', error);
    res.status(500).json({ error: 'Error al obtener estadísticas.' });
  }
}
