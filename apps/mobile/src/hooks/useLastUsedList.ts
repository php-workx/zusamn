import { useCallback } from 'react';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
const LAST_LIST_KEY = 'lastUsedListId';

export interface UseLastUsedListReturn {
  /** Get the last used list ID, or null if none stored */
  getLastUsedListId: () => string | null;
  /** Store the last used list ID */
  setLastUsedListId: (listId: string) => void;
  /** Clear the stored last used list ID */
  clearLastUsedListId: () => void;
}

/**
 * Hook for storing and retrieving the last-used list ID from MMKV storage.
 *
 * This persists across app launches and enables the app to automatically
 * navigate to the user's most recently accessed list.
 *
 * Usage:
 * ```tsx
 * const { getLastUsedListId, setLastUsedListId } = useLastUsedList();
 *
 * // On app launch, check for last used list
 * const lastListId = getLastUsedListId();
 * if (lastListId) {
 *   navigateToList(lastListId);
 * }
 *
 * // When user opens a list, save it
 * setLastUsedListId(listId);
 * ```
 */
export function useLastUsedList(): UseLastUsedListReturn {
  const getLastUsedListId = useCallback((): string | null => {
    return storage.getString(LAST_LIST_KEY) ?? null;
  }, []);

  const setLastUsedListId = useCallback((listId: string): void => {
    storage.set(LAST_LIST_KEY, listId);
  }, []);

  const clearLastUsedListId = useCallback((): void => {
    storage.delete(LAST_LIST_KEY);
  }, []);

  return { getLastUsedListId, setLastUsedListId, clearLastUsedListId };
}
