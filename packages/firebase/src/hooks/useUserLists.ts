import { useState, useEffect, useCallback } from 'react';
import { getUserLists } from '../services';
import type { List, Membership } from '@zusamn/domain';

export interface UserListItem {
  list: List;
  membership: Membership;
}

export interface UseUserListsReturn {
  /** All lists the user has access to */
  lists: UserListItem[];
  /** Whether lists are currently loading */
  isLoading: boolean;
  /** Error if loading failed */
  error: Error | null;
  /** Refresh the lists */
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching all lists a user has access to.
 * Returns lists sorted: personal first, then shared lists alphabetically by alias.
 *
 * @param userId - The user ID to fetch lists for
 */
export function useUserLists(userId: string | undefined): UseUserListsReturn {
  const [lists, setLists] = useState<UserListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchLists = useCallback(async () => {
    if (!userId) {
      setLists([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await getUserLists(userId);
      setLists(result);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch lists'));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  return {
    lists,
    isLoading,
    error,
    refresh: fetchLists,
  };
}
