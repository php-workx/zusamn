import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from 'react';
import {
  type AuthUser,
  getCurrentUser,
  needsDisplayNameSetup,
  onAuthStateChanged,
  signInWithApple as firebaseSignInWithApple,
  signInWithGoogle as firebaseSignInWithGoogle,
  signOut as firebaseSignOut,
  updateDisplayName as firebaseUpdateDisplayName,
} from '@zusamn/firebase';

export interface AuthContextValue {
  /** Current authenticated user, or null if not authenticated */
  user: AuthUser | null;
  /** Whether auth state is still being determined */
  isLoading: boolean;
  /** Any error from the last auth operation */
  error: Error | null;
  /** Sign in with Google using an ID token from expo-auth-session */
  signInWithGoogle: (idToken: string) => Promise<void>;
  /** Sign in with Apple using an identity token */
  signInWithApple: (identityToken: string, nonce?: string) => Promise<void>;
  /** Sign out the current user */
  signOut: () => Promise<void>;
  /** Update the user's display name */
  updateDisplayName: (displayName: string) => Promise<void>;
  /** Whether the user needs to set up their display name */
  needsDisplayName: boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * AuthProvider wraps the app and provides authentication state via context.
 *
 * Uses Firebase onAuthStateChanged to persist auth across app launches.
 *
 * Usage:
 * ```tsx
 * // In App.tsx
 * <AuthProvider>
 *   <NavigationContainer>
 *     <AppNavigator />
 *   </NavigationContainer>
 * </AuthProvider>
 *
 * // In any component
 * const { user, isLoading, signInWithGoogle } = useAuthContext();
 * ```
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<AuthUser | null>(() => getCurrentUser());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // Subscribe to auth state changes
    // This handles persistence across app launches
    const unsubscribe = onAuthStateChanged((authUser: AuthUser | null) => {
      setUser(authUser);
      setIsLoading(false);
      setError(null);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async (idToken: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const authUser = await firebaseSignInWithGoogle(idToken);
      setUser(authUser);
    } catch (err) {
      const authError =
        err instanceof Error ? err : new Error('Google sign in failed');
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const signInWithApple = async (
    identityToken: string,
    nonce?: string
  ): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const authUser = await firebaseSignInWithApple(identityToken, nonce);
      setUser(authUser);
    } catch (err) {
      const authError =
        err instanceof Error ? err : new Error('Apple sign in failed');
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async (): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await firebaseSignOut();
      setUser(null);
    } catch (err) {
      const authError =
        err instanceof Error ? err : new Error('Sign out failed');
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const updateDisplayName = async (displayName: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedUser = await firebaseUpdateDisplayName(displayName);
      setUser(updatedUser);
    } catch (err) {
      const authError =
        err instanceof Error ? err : new Error('Failed to update display name');
      setError(authError);
      throw authError;
    } finally {
      setIsLoading(false);
    }
  };

  const value: AuthContextValue = {
    user,
    isLoading,
    error,
    signInWithGoogle,
    signInWithApple,
    signOut,
    updateDisplayName,
    needsDisplayName: needsDisplayNameSetup(user),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * Hook to access auth context within components wrapped by AuthProvider.
 *
 * @throws Error if used outside of AuthProvider
 */
export function useAuthContext(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
