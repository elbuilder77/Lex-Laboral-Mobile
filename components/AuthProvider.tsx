import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { hasActiveSubscription } from '../lib/access-policy';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  access: {
    hasActiveSubscription: boolean;
    isPremium: boolean;
    licenseType: string | null;
    accessUntil: string | null;
    singleDocumentUsesRemaining: number;
  };
  refreshAccess: () => Promise<void>;
  signOut: () => Promise<void>;
  session: any | null;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  access: {
    hasActiveSubscription: false,
    isPremium: false,
    licenseType: null,
    accessUntil: null,
    singleDocumentUsesRemaining: 0,
  },
  refreshAccess: async () => {},
  signOut: async () => {},
  session: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [access, setAccess] = useState({
    hasActiveSubscription: false,
    isPremium: false,
    licenseType: null as string | null,
    accessUntil: null as string | null,
    singleDocumentUsesRemaining: 0,
  });

  const fetchAccess = async (userId: string) => {
    try {
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

      if (userData && !userError) {
        setAccess({
          isPremium: !!userData.is_premium,
          licenseType: userData.license_type || null,
          accessUntil: userData.access_until || null,
          hasActiveSubscription: hasActiveSubscription(userData.is_premium, userData.access_until),
          singleDocumentUsesRemaining
        });
      } else {
        setAccess({
          hasActiveSubscription: false,
          isPremium: false,
          licenseType: null,
          accessUntil: null,
          singleDocumentUsesRemaining
        });
      }
    } catch (err) {
      console.error('Error fetching access profile:', err);
    }
  };

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchAccess(session.user.id).finally(() => setLoading(false));
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
          fetchAccess(session.user.id).finally(() => setLoading(false));
        } else {
          setAccess({
            hasActiveSubscription: false,
            isPremium: false,
            licenseType: null,
            accessUntil: null,
            singleDocumentUsesRemaining: 0,
          });
          setLoading(false);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const refreshAccess = async () => {
    if (user) await fetchAccess(user.id);
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
