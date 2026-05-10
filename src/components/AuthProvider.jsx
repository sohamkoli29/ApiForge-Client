import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../supabase";
import Login from "./Login";
import LoadingSpinner from "./LoadingSpinner";

const AuthContext = createContext();

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email);
      setUser(session?.user ?? null);
      setIsLoading(false);
      setAuthError(null);

      // On Google sign-in, ensure profile exists
      if (event === 'SIGNED_IN' && session?.user) {
        await ensureUserProfile(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) {
        if (error.message.includes('Invalid login credentials')) throw new Error('Invalid email or password');
        else if (error.message.includes('Email not confirmed')) throw new Error('Please confirm your email address before signing in');
        else if (error.status === 429) throw new Error('Too many attempts. Please wait a moment and try again.');
        else throw new Error(error.message);
      }
      if (data.user) await ensureUserProfile(data.user);
      return data.user;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email, password, name) => {
    setAuthError(null);
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: { data: { name: name || email.split('@')[0] } }
      });
      if (error) {
        if (error.message.includes('User already registered')) throw new Error('An account with this email already exists');
        else if (error.message.includes('Password should be at least')) throw new Error('Password should be at least 6 characters long');
        else if (error.status === 429) throw new Error('Too many signup attempts. Please wait a moment and try again.');
        else throw new Error(error.message);
      }
      if (data.user) await ensureUserProfile(data.user, name || email.split('@')[0]);
      return data.user;
    } catch (error) {
      setAuthError(error.message);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // ── NEW: Google OAuth ──────────────────────────────────────────────────────
  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin, // redirects back to your app after Google login
        },
      });
      if (error) throw new Error(error.message);
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };
  // ──────────────────────────────────────────────────────────────────────────

  const signOut = async () => {
    setAuthError(null);
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      localStorage.removeItem('apiTesterHistory');
      localStorage.removeItem('apiTesterCollections');
      localStorage.removeItem('apiTesterAuthConfig');
    } catch (error) {
      setAuthError(error.message);
      throw error;
    }
  };

  const ensureUserProfile = async (user, name = null) => {
    try {
      const { data: existingProfile, error: fetchError } = await supabase
        .from('users').select('*').eq('id', user.id).single();
      if (fetchError && fetchError.code !== 'PGRST116') return;
      if (!existingProfile) {
        await supabase.from('users').insert({
          id: user.id,
          email: user.email,
          name: name || user.user_metadata?.name || user.user_metadata?.full_name || user.email.split('@')[0],
          created_at: new Date().toISOString()
        });
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error);
    }
  };

  const clearError = () => setAuthError(null);

  const value = {
    user, isLoading, isAuthenticated: !!user,
    authError, signIn, signUp, signInWithGoogle, signOut, clearError
  };

  if (isLoading) return <LoadingSpinner />;

  if (!user) {
    return (
      <AuthContext.Provider value={value}>
        <Login />
      </AuthContext.Provider>
    );
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}