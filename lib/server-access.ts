import { DOCUMENT_MONTHLY_FAIR_USE_LIMIT, IMSS_MONTHLY_FAIR_USE_LIMIT, getCurrentMonthKey, hasActiveSubscription } from './access-policy.js';
import { supabaseAdmin } from './supabase-admin.js';
import { adminRpc } from './supabase-rpc.js';

export type DocumentAccessResult = {
  allowed: boolean;
  reason: 'subscription' | 'single_document' | 'fair_use_limit' | 'no_access';
  currentCount?: number;
  remaining?: number;
};

const getUserAccessRow = async (userId: string) => {
  const { data, error } = await supabaseAdmin
    .from('users')
    .select('is_premium, access_until, license_type')
    .eq('id', userId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const getSingleDocumentUsesRemaining = async (userId: string): Promise<number> => {
  const entitlementsResult = await supabaseAdmin
    .from('user_entitlements')
    .select('single_document_uses_remaining')
    .eq('user_id', userId)
    .maybeSingle();

  if (!entitlementsResult.error && entitlementsResult.data) {
    return entitlementsResult.data.single_document_uses_remaining || 0;
  }

  const legacyResult = await supabaseAdmin
    .from('user_credits')
    .select('draft_basic_balance')
    .eq('user_id', userId)
    .maybeSingle();

  if (!legacyResult.error && legacyResult.data) {
    return legacyResult.data.draft_basic_balance || 0;
  }

  return 0;
};

const getCurrentDocumentUsageCount = async (userId: string): Promise<number> => {
  const currentMonth = getCurrentMonthKey();
  const monthlyUsageResult = await supabaseAdmin
    .from('user_usage_monthly')
    .select('documents_generated_count')
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .maybeSingle();

  if (!monthlyUsageResult.error && monthlyUsageResult.data) {
    return monthlyUsageResult.data.documents_generated_count || 0;
  }

  const legacyUsageResult = await supabaseAdmin
    .from('user_usage')
    .select('draft_basic_month_count')
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .maybeSingle();

  if (!legacyUsageResult.error && legacyUsageResult.data) {
    return legacyUsageResult.data.draft_basic_month_count || 0;
  }

  return 0;
};

const consumeSingleDocumentUse = async (userId: string): Promise<boolean> => {
  const entitlementRead = await supabaseAdmin
    .from('user_entitlements')
    .select('single_document_uses_remaining')
    .eq('user_id', userId)
    .single();

  if (!entitlementRead.error && entitlementRead.data && entitlementRead.data.single_document_uses_remaining > 0) {
    await supabaseAdmin
      .from('user_entitlements')
      .update({
        single_document_uses_remaining: entitlementRead.data.single_document_uses_remaining - 1
      })
      .eq('user_id', userId)
      .gt('single_document_uses_remaining', 0);
    return true;
  }

  const legacyRead = await supabaseAdmin
    .from('user_credits')
    .select('draft_basic_balance')
    .eq('user_id', userId)
    .single();

  if (legacyRead.error || !legacyRead.data || legacyRead.data.draft_basic_balance < 1) {
    return false;
  }

  const legacyWrite = await supabaseAdmin
    .from('user_credits')
    .update({ draft_basic_balance: legacyRead.data.draft_basic_balance - 1 })
    .eq('user_id', userId)
    .gt('draft_basic_balance', 0);

  return !legacyWrite.error;
};

const checkDocumentAccessFallback = async (userId: string): Promise<DocumentAccessResult> => {
  const [userRecord, currentCount, singleDocumentUsesRemaining] = await Promise.all([
    getUserAccessRow(userId),
    getCurrentDocumentUsageCount(userId),
    getSingleDocumentUsesRemaining(userId)
  ]);

  const subscriptionActive = hasActiveSubscription(userRecord?.is_premium, userRecord?.access_until);

  if (subscriptionActive) {
    if (currentCount >= DOCUMENT_MONTHLY_FAIR_USE_LIMIT) {
      return { allowed: false, reason: 'fair_use_limit', currentCount };
    }

    return { allowed: true, reason: 'subscription', currentCount };
  }

  if (singleDocumentUsesRemaining > 0) {
    return { allowed: true, reason: 'single_document', remaining: singleDocumentUsesRemaining };
  }

  return { allowed: false, reason: 'no_access' };
};

const consumeDocumentAccessFallback = async (userId: string) => {
  const currentMonth = getCurrentMonthKey();
  const [userRecord, monthlyUsageFetch] = await Promise.all([
    getUserAccessRow(userId),
    supabaseAdmin
      .from('user_usage_monthly')
      .select('documents_generated_count')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .maybeSingle()
  ]);

  const subscriptionActive = hasActiveSubscription(userRecord?.is_premium, userRecord?.access_until);

  if (subscriptionActive) {
    if (!monthlyUsageFetch.error) {
      const currentCount = monthlyUsageFetch.data?.documents_generated_count || 0;
      if (currentCount >= DOCUMENT_MONTHLY_FAIR_USE_LIMIT) {
        return { allowed: false, reason: 'fair_use_limit' as const, currentCount };
      }

      await supabaseAdmin.from('user_usage_monthly').upsert({
        user_id: userId,
        month: currentMonth,
        documents_generated_count: currentCount + 1
      }, { onConflict: 'user_id,month' });

      return { allowed: true, reason: 'subscription' as const, currentCount: currentCount + 1 };
    }

    const usageFetch = await supabaseAdmin
      .from('user_usage')
      .select('draft_basic_month_count')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .maybeSingle();
    const currentCount = usageFetch.data?.draft_basic_month_count || 0;
    if (currentCount >= DOCUMENT_MONTHLY_FAIR_USE_LIMIT) {
      return { allowed: false, reason: 'fair_use_limit' as const, currentCount };
    }

    await supabaseAdmin.from('user_usage').upsert({
      user_id: userId,
      month: currentMonth,
      draft_basic_month_count: currentCount + 1
    }, { onConflict: 'user_id,month' });

    return { allowed: true, reason: 'subscription' as const, currentCount: currentCount + 1 };
  }

  const singleDocUseConsumed = await consumeSingleDocumentUse(userId);
  return {
    allowed: singleDocUseConsumed,
    reason: singleDocUseConsumed ? ('single_document' as const) : ('no_access' as const),
    currentCount: 0
  };
};

const recordImssUsageFallback = async (userId: string) => {
  const currentMonth = getCurrentMonthKey();
  const [userRecord, monthlyUsageFetch] = await Promise.all([
    getUserAccessRow(userId),
    supabaseAdmin
      .from('user_usage_monthly')
      .select('imss_calculations_count')
      .eq('user_id', userId)
      .eq('month', currentMonth)
      .maybeSingle()
  ]);

  const subscriptionActive = hasActiveSubscription(userRecord?.is_premium, userRecord?.access_until);

  if (!subscriptionActive) {
    return { allowed: false, reason: 'no_subscription' as const, currentCount: 0 };
  }

  if (!monthlyUsageFetch.error) {
    const currentCount = monthlyUsageFetch.data?.imss_calculations_count || 0;
    if (currentCount >= IMSS_MONTHLY_FAIR_USE_LIMIT) {
      return { allowed: false, reason: 'fair_use_limit' as const, currentCount };
    }

    await supabaseAdmin.from('user_usage_monthly').upsert({
      user_id: userId,
      month: currentMonth,
      imss_calculations_count: currentCount + 1
    }, { onConflict: 'user_id,month' });

    return { allowed: true, reason: 'subscription' as const, currentCount: currentCount + 1 };
  }

  const usageFetch = await supabaseAdmin
    .from('user_usage')
    .select('calculators_count')
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .maybeSingle();
  const currentCount = usageFetch.data?.calculators_count || 0;
  if (currentCount >= IMSS_MONTHLY_FAIR_USE_LIMIT) {
    return { allowed: false, reason: 'fair_use_limit' as const, currentCount };
  }

  await supabaseAdmin.from('user_usage').upsert({
    user_id: userId,
    month: currentMonth,
    calculators_count: currentCount + 1
  }, { onConflict: 'user_id,month' });

  return { allowed: true, reason: 'subscription' as const, currentCount: currentCount + 1 };
};

export const getUserAccessSnapshot = async (userId: string) => {
  const rpcResult = await adminRpc('get_access_snapshot', {
    p_user_id: userId
  });

  if (!rpcResult.error && rpcResult.data) {
    return rpcResult.data;
  }

  const [userRecord, singleDocumentUsesRemaining] = await Promise.all([
    getUserAccessRow(userId),
    getSingleDocumentUsesRemaining(userId)
  ]);

  return {
    isPremium: Boolean(userRecord?.is_premium),
    licenseType: userRecord?.license_type || null,
    accessUntil: userRecord?.access_until || null,
    hasActiveSubscription: hasActiveSubscription(userRecord?.is_premium, userRecord?.access_until),
    singleDocumentUsesRemaining
  };
};

export const checkDocumentAccess = async (userId: string): Promise<DocumentAccessResult> => {
  const rpcResult = await adminRpc('check_document_access', {
    p_user_id: userId,
    p_monthly_limit: DOCUMENT_MONTHLY_FAIR_USE_LIMIT
  });

  if (!rpcResult.error && rpcResult.data) {
    return rpcResult.data as DocumentAccessResult;
  }

  return checkDocumentAccessFallback(userId);
};

export const consumeDocumentAccess = async (userId: string) => {
  const rpcResult = await adminRpc('consume_document_access', {
    p_user_id: userId,
    p_monthly_limit: DOCUMENT_MONTHLY_FAIR_USE_LIMIT
  });

  if (!rpcResult.error && rpcResult.data) {
    return rpcResult.data;
  }

  return consumeDocumentAccessFallback(userId);
};

const refundDocumentAccessFallback = async (
  userId: string,
  consumedReason: 'subscription' | 'single_document'
) => {
  const currentMonth = getCurrentMonthKey();

  if (consumedReason === 'single_document') {
    const current = await supabaseAdmin
      .from('user_entitlements')
      .select('single_document_uses_remaining')
      .eq('user_id', userId)
      .maybeSingle();

    if (!current.error && current.data) {
      await supabaseAdmin
        .from('user_entitlements')
        .update({ single_document_uses_remaining: (current.data.single_document_uses_remaining || 0) + 1 })
        .eq('user_id', userId);

      return { refunded: true, reason: consumedReason };
    }

    await supabaseAdmin
      .from('user_entitlements')
      .insert({ user_id: userId, single_document_uses_remaining: 1 });

    return { refunded: true, reason: consumedReason };
  }

  const usage = await supabaseAdmin
    .from('user_usage_monthly')
    .select('documents_generated_count')
    .eq('user_id', userId)
    .eq('month', currentMonth)
    .maybeSingle();

  if (!usage.error && usage.data) {
    await supabaseAdmin
      .from('user_usage_monthly')
      .update({ documents_generated_count: Math.max((usage.data.documents_generated_count || 0) - 1, 0) })
      .eq('user_id', userId)
      .eq('month', currentMonth);
  }

  return { refunded: true, reason: consumedReason };
};

export const refundDocumentAccess = async (
  userId: string,
  consumedReason: 'subscription' | 'single_document'
) => {
  const rpcResult = await adminRpc('refund_document_access', {
    p_user_id: userId,
    p_consumed_reason: consumedReason
  });

  if (!rpcResult.error && rpcResult.data) {
    return rpcResult.data;
  }

  return refundDocumentAccessFallback(userId, consumedReason);
};

export const recordImssUsage = async (userId: string) => {
  const rpcResult = await adminRpc('record_imss_usage', {
    p_user_id: userId,
    p_monthly_limit: IMSS_MONTHLY_FAIR_USE_LIMIT
  });

  if (!rpcResult.error && rpcResult.data) {
    return rpcResult.data;
  }

  return recordImssUsageFallback(userId);
};
