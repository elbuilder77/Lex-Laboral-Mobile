import { supabaseAdmin } from './supabase-admin.js';

type RpcArgs = Record<string, unknown>;

const isMissingPrivateRpc = (error: { code?: string; message?: string } | null | undefined) =>
  error?.code === 'PGRST202' ||
  /function .* does not exist|could not find the function|schema cache/i.test(error?.message || '');

export const adminRpc = async (fn: string, args: RpcArgs = {}) => {
  const privateClient = typeof supabaseAdmin.schema === 'function'
    ? supabaseAdmin.schema('private')
    : supabaseAdmin;

  const privateResult = await privateClient.rpc(fn, args);
  if (!privateResult.error || !isMissingPrivateRpc(privateResult.error)) {
    return privateResult;
  }

  return supabaseAdmin.rpc(fn, args);
};
