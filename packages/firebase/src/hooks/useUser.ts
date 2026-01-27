import { useEffect, useState } from 'react';
import {
  doc,
  onSnapshot,
  serverTimestamp,
  runTransaction,
  type FieldValue,
} from 'firebase/firestore';
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
 * Note: If passing options, memoize the object to avoid unnecessary effect re-runs:
 * ```tsx
 * const options = useMemo(() => ({ displayName, email }), [displayName, email]);
 * const { user, isLoading, error } = useUser(authUser?.uid, options);
 * ```
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

    // Reset to loading state when userId changes to avoid stale UI
    setState({ user: null, isLoading: true, error: null });

    const db = getFirestoreDb();
    const userRef = doc(db, 'users', userId);
    let unsubscribe: (() => void) | undefined;
    let mounted = true;

    const initializeUser = async () => {
      try {
        // Use transaction for atomic check-and-create to prevent race conditions
        // when multiple clients try to create the same user simultaneously
        await runTransaction(db, async (transaction) => {
          const userSnap = await transaction.get(userRef);

          if (!userSnap.exists()) {
            // Create user document if it doesn't exist
            const newUser = {
              id: userId,
              displayName: options?.displayName ?? '',
              email: options?.email ?? '',
              avatarUrl: null,
              locale: detectLocale(),
              createdAt: serverTimestamp(),
            } satisfies Omit<User, 'createdAt'> & { createdAt: FieldValue };

            transaction.set(userRef, newUser);
          }
        });

        if (!mounted) return;

        // Set up realtime listener
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
                createdAt:
                  data.createdAt?.toMillis?.() ??
                  (typeof data.createdAt === 'number' ? data.createdAt : Date.now()),
                deletedAt:
                  data.deletedAt?.toMillis?.() ??
                  (typeof data.deletedAt === 'number' ? data.deletedAt : null),
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
