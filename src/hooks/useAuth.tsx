import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: 'super_admin' | 'user' | null;
  profileName: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  role: null,
  profileName: null,
  loading: true,
  signIn: async () => ({ error: null }),
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<'super_admin' | 'user' | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const initializedRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  const sessionTokenRef = useRef<string | null>(null);

  // Single function that loads profile + role for a given session
  const loadUserData = async (sess: Session | null) => {
    if (!sess?.user) {
      setUser(null);
      setSession(null);
      setRole(null);
      setProfileName(null);
      userIdRef.current = null;
      sessionTokenRef.current = null;
      return;
    }

    // Only update session state if the access token actually changed — prevents cascading re-renders on token refresh
    if (sess.access_token !== sessionTokenRef.current) {
      sessionTokenRef.current = sess.access_token;
      setSession(sess);
    }
    // Only update user ref if the ID actually changed
    if (userIdRef.current !== sess.user.id) {
      userIdRef.current = sess.user.id;
      setUser(sess.user);
    }

    try {
      // Load profile and role in parallel
      const [profileRes, roleRes] = await Promise.all([
        supabase
          .from('profiles')
          .select('is_blocked, full_name')
          .eq('user_id', sess.user.id)
          .maybeSingle(),
        supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', sess.user.id)
          .maybeSingle(),
      ]);

      // Check if blocked
      if (profileRes.data?.is_blocked) {
        await supabase.auth.signOut();
        setUser(null);
        setSession(null);
        setRole(null);
        setProfileName(null);
        return;
      }

      setProfileName(profileRes.data?.full_name ?? null);
      setRole((roleRes.data?.role as 'super_admin' | 'user') ?? 'user');
    } catch (error) {
      console.error('Error loading user data:', error);
      setRole('user');
    }
  };

  useEffect(() => {
    // 1. Set up listener FIRST (before getSession)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, sess) => {
      // Skip if this is the initial event and getSession already handled it
      if (!initializedRef.current) return;

      await loadUserData(sess);
    });

    // 2. Get initial session
    supabase.auth.getSession().then(async ({ data: { session: sess } }) => {
      await loadUserData(sess);
      initializedRef.current = true;
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  };

  const signOut = async () => {
    // Instant UI response
    setUser(null);
    setSession(null);
    setRole(null);
    setProfileName(null);
    // Background server call
    supabase.auth.signOut().catch(() => {});
  };

  return (
    <AuthContext.Provider value={{ user, session, role, profileName, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
