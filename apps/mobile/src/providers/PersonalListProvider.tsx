import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { useUser, getPersonalList, createPersonalList } from '@zusamn/firebase';
import { useAuthContext } from './AuthProvider';
import { useLastUsedList } from '../hooks';

export interface PersonalListContextValue {
  /** Current list ID, or null if not yet loaded */
  listId: string | null;
  /** Whether the list is being initialized */
  isInitializing: boolean;
  /** Any error during initialization */
  error: Error | null;
}

const PersonalListContext = createContext<PersonalListContextValue | null>(null);

interface PersonalListProviderProps {
  children: ReactNode;
}

/**
 * PersonalListProvider ensures user has a personal list.
 * Creates one on first login with locale-based alias.
 * Stores last-used listId in MMKV.
 */
export function PersonalListProvider({ children }: PersonalListProviderProps) {
  const { user } = useAuthContext();
  const { getLastUsedListId, setLastUsedListId, clearLastUsedListId } = useLastUsedList();

  const [listId, setListId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Get or create user document (handles locale detection)
  const { user: firestoreUser, isLoading: isUserLoading } = useUser(user?.uid, {
    displayName: user?.displayName ?? undefined,
    email: user?.email ?? undefined,
  });

  useEffect(() => {
    // Abort flag to prevent state updates after cleanup (logout race condition)
    let cancelled = false;

    async function initializePersonalList() {
      if (!user?.uid || !firestoreUser || isUserLoading) {
        return;
      }

      try {
        // Check for last used list first (fast path)
        const lastListId = getLastUsedListId();
        if (lastListId) {
          if (!cancelled) {
            setListId(lastListId);
            setIsInitializing(false);
          }
          // Background validation - verify cached list still exists
          getPersonalList(user.uid)
            .then(async (result) => {
              if (cancelled) return;
              // If cached list no longer exists or differs, update to current list
              if (!result || result.list.id !== lastListId) {
                if (result) {
                  setLastUsedListId(result.list.id);
                  setListId(result.list.id);
                  return;
                }

                try {
                  const { list } = await createPersonalList(user.uid, firestoreUser.locale);
                  if (cancelled) return;
                  setLastUsedListId(list.id);
                  setListId(list.id);
                } catch (err) {
                  if (cancelled) return;
                  console.error('Failed to recover personal list', err);
                  setError(err instanceof Error ? err : new Error('Failed to initialize list'));
                  clearLastUsedListId();
                  setListId(null);
                }
              }
            })
            .catch((err) => {
              if (cancelled) return;
              console.warn('Failed to validate cached personal list', err);
              const cachedListId = getLastUsedListId();
              if (!cachedListId) {
                setError(err instanceof Error ? err : new Error('Failed to initialize list'));
              }
            });
          return;
        }

        // Check for existing personal list
        const existingList = await getPersonalList(user.uid);
        if (cancelled) return;

        if (existingList) {
          setListId(existingList.list.id);
          setLastUsedListId(existingList.list.id);
          setIsInitializing(false);
          return;
        }

        // Create personal list for first-time users
        const { list: newList } = await createPersonalList(user.uid, firestoreUser.locale);
        if (cancelled) return;

        setListId(newList.id);
        setLastUsedListId(newList.id);
        setIsInitializing(false);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error('Failed to initialize list'));
        setIsInitializing(false);
      }
    }

    initializePersonalList();

    return () => {
      cancelled = true;
    };
  }, [
    user?.uid,
    firestoreUser,
    isUserLoading,
    getLastUsedListId,
    setLastUsedListId,
    clearLastUsedListId,
  ]);

  // Reset state when user logs out
  useEffect(() => {
    if (!user) {
      setListId(null);
      setIsInitializing(true);
      setError(null);
    }
  }, [user]);

  const value: PersonalListContextValue = {
    listId,
    isInitializing: isInitializing || isUserLoading,
    error,
  };

  return <PersonalListContext.Provider value={value}>{children}</PersonalListContext.Provider>;
}

/**
 * Hook to access personal list context.
 *
 * @throws Error if used outside of PersonalListProvider
 */
export function usePersonalList(): PersonalListContextValue {
  const context = useContext(PersonalListContext);
  if (!context) {
    throw new Error('usePersonalList must be used within a PersonalListProvider');
  }
  return context;
}
