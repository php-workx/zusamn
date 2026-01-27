import { useCallback } from 'react';
import { MMKV } from 'react-native-mmkv';

const storage = new MMKV();
const PENDING_INVITE_KEY = 'pendingInviteToken';

export interface UsePendingInviteReturn {
  /** Get the pending invite token, or null if none stored */
  getPendingInvite: () => string | null;
  /** Store a pending invite token (for post-auth redemption) */
  setPendingInvite: (token: string) => void;
  /** Clear the stored pending invite token */
  clearPendingInvite: () => void;
}

/**
 * Hook for storing and retrieving a pending invite token from MMKV storage.
 *
 * This is used when a user opens an invite link while not authenticated.
 * The token is stored, and after authentication completes, the app
 * retrieves the token and continues with invite redemption.
 *
 * Usage:
 * ```tsx
 * const { getPendingInvite, setPendingInvite, clearPendingInvite } = usePendingInvite();
 *
 * // When user opens invite while not logged in
 * setPendingInvite(token);
 * router.replace('/(auth)/login');
 *
 * // After login, check for pending invite
 * const pendingToken = getPendingInvite();
 * if (pendingToken) {
 *   clearPendingInvite();
 *   router.replace(`/invite/${pendingToken}`);
 * }
 * ```
 */
export function usePendingInvite(): UsePendingInviteReturn {
  const getPendingInvite = useCallback((): string | null => {
    return storage.getString(PENDING_INVITE_KEY) ?? null;
  }, []);

  const setPendingInvite = useCallback((token: string): void => {
    storage.set(PENDING_INVITE_KEY, token);
  }, []);

  const clearPendingInvite = useCallback((): void => {
    storage.delete(PENDING_INVITE_KEY);
  }, []);

  return { getPendingInvite, setPendingInvite, clearPendingInvite };
}
