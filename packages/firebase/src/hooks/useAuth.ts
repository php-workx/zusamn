import { useCallback, useEffect, useState } from 'react';
import {
  type AuthState,
  type AuthUser,
  getCurrentUser,
  needsDisplayNameSetup,
  onAuthStateChanged,
  signInWithApple as firebaseSignInWithApple,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOut as firebaseSignOut,
} from '../auth';

export interface UseAuthReturn extends AuthState {
  /** Sign in with Google using an ID token from OAuth */
  signInWithGoogle: (idToken: string) => Promise<void>;
  /** Sign in with Apple using an identity token from OAuth */
  signInWithApple: (identityToken: string, nonce?: string) => Promise<void>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Whether the user needs to set up their display name */
  needsDisplayName: boolean;
}

/**
 * Hook for accessing authentication state and methods.
 *
 * Usage:
 * ```tsx
 * const { user, isLoading, error, signInWithGoogle, signOut } = useAuth();
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (!user) return <LoginScreen />;
 * return <HomeScreen user={user} />;
 * ```
 */
export function useAuth(): UseAuthReturn {
  const [state, setState] = useState<AuthState>(() => ({
    user: getCurrentUser(),
    isLoading: true,
    error: null,
  }));

  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user: AuthUser | null) => {
      setState({
        user,
        isLoading: false,
        error: null,
      });
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = useCallback(async (idToken: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await firebaseSignInWithGoogle(idToken);
      setState({ user, isLoading: false, error: null });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Sign in failed'),
      }));
      throw error;
    }
  }, []);

  const signInWithApple = useCallback(async (identityToken: string, nonce?: string) => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const user = await firebaseSignInWithApple(identityToken, nonce);
      setState({ user, isLoading: false, error: null });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Sign in failed'),
      }));
      throw error;
    }
  }, []);

  const signOut = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      await firebaseSignOut();
      setState({ user: null, isLoading: false, error: null });
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error : new Error('Sign out failed'),
      }));
      throw error;
    }
  }, []);

  return {
    ...state,
    signInWithGoogle,
    signInWithApple,
    signOut,
    needsDisplayName: needsDisplayNameSetup(state.user),
  };
}
