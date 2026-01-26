import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import type { Membership } from '@zusamn/domain';
import { getFirestoreDb } from '../db';

export interface UseMembershipReturn {
  membership: Membership | null;
  isLoading: boolean;
  error: Error | null;
}

/**
 * Hook for accessing a user's membership for a list with realtime updates.
 *
 * Usage:
 * ```tsx
 * const { membership, isLoading, error } = useMembership(listId, userId);
 *
 * if (isLoading) return <LoadingSpinner />;
 * if (error) return <ErrorScreen error={error} />;
 * if (!membership) return <NotMemberScreen />;
 * return <MemberView membership={membership} />;
 * ```
 */
export function useMembership(
  listId: string | null | undefined,
  userId: string | null | undefined
): UseMembershipReturn {
  const [state, setState] = useState<UseMembershipReturn>({
    membership: null,
    isLoading: true,
    error: null,
  });

  useEffect(() => {
    if (!listId || !userId) {
      setState({ membership: null, isLoading: false, error: null });
      return;
    }

    setState({ membership: null, isLoading: true, error: null });

    const db = getFirestoreDb();
    const membershipRef = doc(db, 'lists', listId, 'memberships', userId);

    const unsubscribe = onSnapshot(
      membershipRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          const membership: Membership = {
            userId: snapshot.id,
            listId: data.listId ?? listId,
            alias: data.alias ?? '',
            joinedAt: data.joinedAt?.toMillis?.() ?? data.joinedAt ?? Date.now(),
          };
          setState({ membership, isLoading: false, error: null });
        } else {
          setState({ membership: null, isLoading: false, error: null });
        }
      },
      (error) => {
        setState({
          membership: null,
          isLoading: false,
          error: error instanceof Error ? error : new Error('Failed to load membership'),
        });
      }
    );

    return () => {
      unsubscribe();
    };
  }, [listId, userId]);

  return state;
}
