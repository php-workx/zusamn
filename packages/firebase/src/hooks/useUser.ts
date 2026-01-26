import { useEffect, useState } from 'react';
import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import type { User, Locale } from '@zusamn/domain';
import { getFirestoreDb } from '../db';

export interface UseUserReturn {
  user: User | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Detect the user's locale from the device.
 * Returns 'de' for German locales, 'en' for all others.
 */
function detectLocale(): Locale {
  try {
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    return locale?.startsWith('de') ? 'de' : 'en';
  } catch {
    return 'en';
  }
}

/**
 * Hook for accessing a user document with get/create logic.
 * Creates the user document if it doesn't exist (on first login).
 *
 * Usage:
 * ```tsx
 * const { user, isLoading, error } = useUser(authUser?.uid);
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorScreen error={error} />;
 * if (!user) return <LoginScreen />;
 * return <ProfileScreen user={user} />;
 * ```
 */
export function useUser(
  userId: string | null | undefined,
  options?: {
    displayName?: string;
    email?: string;
  }
): UseUserReturn {
  const [state, setState] = useState<UseUserReturn>({
    user: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!userId) {
      setState({ user: null, isLoading: false, error: null });
      return;
    }

    // Reset state when userId changes to avoid cross-user data bleed
    setState({ user: null, isLoading: true, error: null });

    const db = getFirestoreDb();
    const userRef = doc(db, 'users', userId);
    let unsubscribe: (() => void) | undefined;
    let mounted = true;

    const initializeUser = async () => {
      try {
        // Check if user document exists
        const userSnap = await getDoc(userRef);
        if (!mounted) return;

        if (!userSnap.exists()) {
          // Create user document if it doesn't exist
          // Use merge to avoid race conditions when multiple tabs/devices create simultaneously
          const newUser: Omit<User, 'createdAt'> & { createdAt: ReturnType<typeof serverTimestamp> } = {
            id: userId,
            displayName: options?.displayName ?? '',
            email: options?.email ?? '',
            avatarUrl: null,
            locale: detectLocale(),
            createdAt: serverTimestamp() as unknown as ReturnType<typeof serverTimestamp>,
          };

          await setDoc(userRef, newUser, { merge: true });
          if (!mounted) return;
        }

        if (!mounted) return;

        // Set up realtime listener
        if (!mounted) return;
        unsubscribe = onSnapshot(
          userRef,
          (snapshot) => {
            if (!mounted) return;

            if (snapshot.exists()) {
              const data = snapshot.data();
              const user: User = {
                id: snapshot.id,
                displayName: data.displayName ?? '',
                email: data.email ?? '',
                avatarUrl: data.avatarUrl ?? null,
                locale: data.locale ?? 'en',
                createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? Date.now(),
                deletedAt: data.deletedAt?.toMillis?.() ?? data.deletedAt ?? null,
              };
              setState({ user, isLoading: false, error: null });
            } else {
              setState({ user: null, isLoading: false, error: null });
            }
          },
          (error) => {
            if (!mounted) return;
            setState((prev) => ({
              ...prev,
              isLoading: false,
              error: error instanceof Error ? error : new Error('Failed to load user'),
            }));
          }
        );
      } catch (error) {
        if (!mounted) return;
        setState({
          user: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Failed to initialize user'),
        });
      }
    };

    initializeUser();

    return () => {
      mounted = false;
      unsubscribe?.();
    };
  }, [userId, options?.displayName, options?.email]);

  return state;
}
