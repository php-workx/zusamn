import { useCallback, useEffect, useRef, useState } from 'react';
import { onSnapshotsInSync } from 'firebase/firestore';
import { getFirestoreDb } from '../db';

export interface SyncStatus {
  /** Whether there are local writes pending upload to Firestore */
  hasPendingWrites: boolean;
  /** Manually mark that a write operation has started */
  markWritePending: () => void;
  /** Manually clear pending write state (e.g., on error) */
  clearWritePending: () => void;
}

/**
 * Hook for tracking pending Firestore writes.
 *
 * Uses Firestore's onSnapshotsInSync callback to detect when all pending
 * writes have been confirmed by the server. Call markWritePending() when
 * initiating a write operation to trigger the "syncing" state.
 *
 * Note: This provides a simplified sync status indicator. For more granular
 * control, individual document snapshots include metadata.hasPendingWrites.
 *
 * Usage:
 * ```tsx
 * const { hasPendingWrites, markWritePending } = useSyncStatus();
 *
 * const handleAddItem = async () => {
 *   markWritePending();
 *   await addDoc(collection(db, 'items'), { text: 'New item' });
 * };
 *
 * if (hasPendingWrites) {
 *   return <SyncingIndicator />;
 * }
 * ```
 */
export function useSyncStatus(): SyncStatus {
  const [hasPendingWrites, setHasPendingWrites] = useState(false);
  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const db = getFirestoreDb();

    // onSnapshotsInSync fires when all listeners are in sync with the server
    // This means all pending writes have been acknowledged
    const unsubscribe = onSnapshotsInSync(db, () => {
      // Clear any pending timeout
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
        syncTimeoutRef.current = null;
      }
      setHasPendingWrites(false);
    });

    return () => {
      unsubscribe();
      if (syncTimeoutRef.current) {
        clearTimeout(syncTimeoutRef.current);
      }
    };
  }, []);

  const markWritePending = useCallback(() => {
    setHasPendingWrites(true);

    // Set a timeout to clear the pending state in case onSnapshotsInSync
    // doesn't fire (e.g., if we're offline). The sync will eventually complete
    // or the offline indicator will take precedence.
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }
    syncTimeoutRef.current = setTimeout(() => {
      // After 30 seconds, assume sync is complete or offline
      // The offline indicator should take precedence in that case
      syncTimeoutRef.current = null;
      setHasPendingWrites(false);
    }, 30000);
  }, []);

  const clearWritePending = useCallback(() => {
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
      syncTimeoutRef.current = null;
    }
    setHasPendingWrites(false);
  }, []);

  return { hasPendingWrites, markWritePending, clearWritePending };
}
