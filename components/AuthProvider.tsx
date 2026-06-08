import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { hasActiveSubscription } from '../lib/access-policy';
import type { AccessSnapshot } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  access: AccessSnapshot;
  refreshAccess: () => Promise<AccessSnapshot>;
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
  refreshAccess: async () => defaultAccess,
  signOut: async () => {},
  session: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState<AccessSnapshot>(defaultAccess);
  const accessRef = React.useRef<AccessSnapshot>(defaultAccess);
  const lastAccessFetchKey = React.useRef<string | null>(null);

  const commitAccess = (snapshot: AccessSnapshot) => {
    accessRef.current = snapshot;
    setAccess(snapshot);
  };

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

  const fetchAccess = async (userId: string, accessToken?: string, force = false): Promise<AccessSnapshot> => {
    const fetchKey = `${userId}:${accessToken || 'no-token'}`;
    if (!force && lastAccessFetchKey.current === fetchKey) return accessRef.current;
    lastAccessFetchKey.current = fetchKey;

    try {
      if (accessToken) {
        try {
          const response = await fetch('/api/access/snapshot', {
            headers: { Authorization: `Bearer ${accessToken}` },
          });

          if (response.ok) {
            const snapshot = await response.json() as AccessSnapshot;
            commitAccess(snapshot);
            return snapshot;
          }

          if (response.status === 401) {
            commitAccess(defaultAccess);
            return defaultAccess;
          }
        } catch {
          // Vite dev does not serve Vercel API routes; fall back to Supabase.
        }
      }

      const snapshot = await fetchAccessFromSupabase(userId);
      commitAccess(snapshot);
      return snapshot;
    } catch (err) {
      console.error('Error fetching access profile:', err);
      commitAccess(defaultAccess);
      return defaultAccess;
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
          commitAccess(defaultAccess);
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const refreshAccess = async () => {
    if (!user) {
      commitAccess(defaultAccess);
      return defaultAccess;
    }

    return fetchAccess(user.id, session?.access_token, true);
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
