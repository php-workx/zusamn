import { useEffect, useState, useRef } from 'react';
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  type Firestore,
} from 'firebase/firestore';
import type { Item } from '@zusamn/domain';
import { initFirebase } from '../client';

export interface UseItemsReturn {
  items: Item[];
  isLoading: boolean;
  error: Error | null;
  /** IDs of items that were added or modified by remote users (not local writes) */
  remotelyChangedIds: string[];
}

/**
 * Get the Firestore instance
 */
function getFirestoreDb(): Firestore {
  const { db } = initFirebase();
  return db;
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
    remotelyChangedIds: [],
  });

  // Track previous item IDs and their serverUpdatedAt timestamps to detect remote changes
  const previousItemsRef = useRef<Map<string, number>>(new Map());
  // Track if this is the first snapshot (to avoid marking all items as remotely changed on initial load)
  const isInitialSnapshotRef = useRef(true);

  useEffect(() => {
    if (!listId) {
      setState({ items: [], isLoading: false, error: null, remotelyChangedIds: [] });
      previousItemsRef.current = new Map();
      isInitialSnapshotRef.current = true;
      return;
    }

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

        // Detect remote changes using snapshot metadata
        // hasPendingWrites === true means this is a local write that hasn't been confirmed
        // hasPendingWrites === false means the data came from the server (could be our own write confirmed, or remote)
        const remotelyChangedIds: string[] = [];

        // Skip remote change detection on initial snapshot to avoid marking all items as new
        if (!snapshot.metadata.hasPendingWrites && !isInitialSnapshotRef.current) {
          const previousItems = previousItemsRef.current;

          for (const item of items) {
            const previousUpdatedAt = previousItems.get(item.id);

            // Item is remotely changed if:
            // 1. It's a new item (not in previous snapshot)
            // 2. It has a different serverUpdatedAt timestamp (was modified)
            if (previousUpdatedAt === undefined || previousUpdatedAt !== item.serverUpdatedAt) {
              remotelyChangedIds.push(item.id);
            }
          }
        }
        isInitialSnapshotRef.current = false;

        // Update the previous items ref for next comparison
        const newPreviousItems = new Map<string, number>();
        for (const item of items) {
          newPreviousItems.set(item.id, item.serverUpdatedAt);
        }
        previousItemsRef.current = newPreviousItems;

        setState({ items, isLoading: false, error: null, remotelyChangedIds });
      },
      (error) => {
        setState({
          items: [],
          isLoading: false,
          error: error instanceof Error ? error : new Error('Failed to load items'),
          remotelyChangedIds: [],
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [listId]);

  return state;
}
