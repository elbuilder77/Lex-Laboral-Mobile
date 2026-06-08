import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { hasActiveSubscription } from '../lib/access-policy';

type AccessSnapshot = {
  hasActiveSubscription: boolean;
  isPremium: boolean;
  licenseType: string | null;
  accessUntil: string | null;
  singleDocumentUsesRemaining: number;
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  access: AccessSnapshot;
  refreshAccess: () => Promise<void>;
  signOut: () => Promise<void>;
  session: any | null;
}

const defaultAccess: AccessSnapshot = {
  hasActiveSubscription: false,
  isPremium: false,
  licenseType: null,
  accessUntil: null,
  singleDocumentUsesRemaining: 0,
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  access: defaultAccess,
  refreshAccess: async () => {},
  signOut: async () => {},
  session: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<AccessSnapshot>(defaultAccess);
  const lastAccessFetchKey = React.useRef<string | null>(null);

  const fetchAccessFromSupabase = async (userId: string): Promise<AccessSnapshot> => {
    let singleDocumentUsesRemaining = 0;

    const entitlementsResult = await supabase
      .from('user_entitlements')
      .select('single_document_uses_remaining')
      .eq('user_id', userId)
      .maybeSingle();

    if (!entitlementsResult.error && entitlementsResult.data) {
      singleDocumentUsesRemaining = entitlementsResult.data.single_document_uses_remaining || 0;
    } else {
      const legacyResult = await supabase
        .from('user_credits')
        .select('draft_basic_balance')
        .eq('user_id', userId)
        .maybeSingle();

      if (!legacyResult.error && legacyResult.data) {
        singleDocumentUsesRemaining = legacyResult.data.draft_basic_balance || 0;
      }
    }

    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_premium, license_type, access_until')
      .eq('id', userId)
      .single();

    if (!userData || userError) {
      return {
        ...defaultAccess,
        singleDocumentUsesRemaining,
      };
    }

    return {
      isPremium: !!userData.is_premium,
      licenseType: userData.license_type || null,
      accessUntil: userData.access_until || null,
      hasActiveSubscription: hasActiveSubscription(userData.is_premium, userData.access_until),
      singleDocumentUsesRemaining,
    };
  };

  const fetchAccess = async (userId: string, accessToken?: string, force = false) => {
    const fetchKey = `${userId}:${accessToken || 'no-token'}`;
    if (!force && lastAccessFetchKey.current === fetchKey) return;
    lastAccessFetchKey.current = fetchKey;

    try {
      if (accessToken) {
        try {
          const response = await fetch('/api/access/snapshot', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (response.ok) {
            setAccess(await response.json());
            return;
          }

          if (response.status === 401) {
            setAccess(defaultAccess);
            return;
          }
        } catch {
          // Vite dev does not serve Vercel API routes; fall back to Supabase.
        }
      }

      setAccess(await fetchAccessFromSupabase(userId));
    } catch (err) {
      console.error('Error fetching access profile:', err);
      setAccess(defaultAccess);
    }
  };

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAccess(session.user.id, session.access_token).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session?.user) {
          fetchAccess(session.user.id, session.access_token).finally(() => setLoading(false));
        } else {
          lastAccessFetchKey.current = null;
          setAccess(defaultAccess);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const refreshAccess = async () => {
    if (user) await fetchAccess(user.id, session?.access_token, true);
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, access, refreshAccess, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};
