import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import type { List } from '@zusamn/domain';
import { getFirestoreDb } from '../db';

export interface UseListReturn {
  list: List | null;
  isLoading: boolean;
  error: Error | null;
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

    // Reset state when listId changes to avoid showing stale data
    setState({ list: null, isLoading: true, error: null });

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
