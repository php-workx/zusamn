import { useEffect, useState } from 'react';
import { doc, onSnapshot, type Firestore } from 'firebase/firestore';
import type { List } from '@zusamn/domain';
import { initFirebase } from '../client';

export interface UseListReturn {
  list: List | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Get the Firestore instance
 */
function getFirestoreDb(): Firestore {
  const { db } = initFirebase();
  return db;
}

/**
 * Hook for accessing a list document with realtime updates.
 *
 * Usage:
 * ```tsx
 * const { list, isLoading, error } = useList(listId);
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorScreen error={error} />;
 * if (!list) return <NotFoundScreen />;
 * return <ListScreen list={list} />;
 * ```
 */
export function useList(listId: string | null | undefined): UseListReturn {
  const [state, setState] = useState<UseListReturn>({
    list: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!listId) {
      setState({ list: null, isLoading: false, error: null });
      return;
    }

    const db = getFirestoreDb();
    const listRef = doc(db, 'lists', listId);

    const unsubscribe = onSnapshot(
      listRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const list: List = {
            id: snapshot.id,
            ownerUserId: data.ownerUserId ?? '',
            memberIds: data.memberIds ?? [],
            createdAt: data.createdAt?.toMillis?.() ?? data.createdAt ?? Date.now(),
          };
          setState({ list, isLoading: false, error: null });
        } else {
          setState({ list: null, isLoading: false, error: null });
        }
      },
      (error) => {
        setState({
          list: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Failed to load list'),
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [listId]);

  return state;
}
