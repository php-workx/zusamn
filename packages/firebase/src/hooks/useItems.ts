import { useEffect, useState } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import type { Item } from '@zusamn/domain';
import { getFirestoreDb } from '../db';

export interface UseItemsReturn {
  items: Item[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for accessing list items with realtime updates.
 * Filters out deleted items and orders by serverCreatedAt descending.
 *
 * Usage:
 * ```tsx
 * const { items, isLoading, error } = useItems(listId);
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorScreen error={error} />;
 * return <ItemsList items={items} />;
 * ```
 */
export function useItems(listId: string | null | undefined): UseItemsReturn {
  const [state, setState] = useState<UseItemsReturn>({
    items: [],
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!listId) {
      setState({ items: [], isLoading: false, error: null });
      return;
    }

    // Reset state when listId changes to avoid showing stale items
    setState({ items: [], isLoading: true, error: null });

    const db = getFirestoreDb();
    const itemsRef = collection(db, 'lists', listId, 'items');

    // Query for non-deleted items, ordered by serverCreatedAt descending
    const itemsQuery = query(
      itemsRef,
      where('deleted', '==', false),
      orderBy('serverCreatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      itemsQuery,
      (snapshot) => {
        const items: Item[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            listId: data.listId ?? listId,
            text: data.text ?? '',
            checked: data.checked ?? false,
            deleted: data.deleted ?? false,
            createdByUserId: data.createdByUserId ?? '',
            serverCreatedAt: data.serverCreatedAt?.toMillis?.() ?? data.serverCreatedAt ?? Date.now(),
            serverUpdatedAt: data.serverUpdatedAt?.toMillis?.() ?? data.serverUpdatedAt ?? Date.now(),
          };
        });
        setState({ items, isLoading: false, error: null });
      },
      (error) => {
        setState({
          items: [],
          isLoading: false,
          error: error instanceof Error ? error : new Error('Failed to load items'),
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [listId]);

  return state;
}
