import { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Screen, Text, TopBar, YStack, PrimaryButton } from '@zusamn/ui';
import {
  getInvite,
  redeemInvite,
  type RedeemInviteResult,
} from '@zusamn/firebase';
import type { Invite } from '@zusamn/domain';
import { useAuthContext } from '../../src/providers';
import { usePendingInvite, useLastUsedList } from '../../src/hooks';

/** Error messages for invite validation failures */
const ERROR_MESSAGES = {
  invite_not_found: 'This invite link is invalid or has been removed',
  invite_expired: 'This invite has expired',
  invite_already_used: 'This invite has already been used',
  list_not_found: 'The list associated with this invite no longer exists',
  list_full: 'This list is full (maximum 3 people)',
  already_member: "You're already a member of this list",
} as const;

type ErrorReason = keyof typeof ERROR_MESSAGES;

/** Get error message for a reason, with fallback */
function getErrorMessage(reason: string): string {
  if (reason in ERROR_MESSAGES) {
    return ERROR_MESSAGES[reason as ErrorReason];
  }
  return 'Failed to join the list';
}

type InviteState =
  | { status: 'loading' }
  | { status: 'needs_auth' }
  | { status: 'redeeming' }
  | { status: 'success'; listId: string }
  | { status: 'error'; message: string; navigateToList?: string }
  | { status: 'invalid' };

/**
 * Invite redemption screen.
 *
 * Handles deep links for invite tokens:
 * - zusamn://invite/[token]
 * - https://zusamn.com/invite/[token]
 *
 * Flow:
 * 1. Validate invite exists and is not expired/used
 * 2. If not authenticated: store token and redirect to login
 * 3. If authenticated: redeem invite immediately
 * 4. On success: navigate to the joined list
 * 5. On error: show appropriate message
 */
export default function InviteScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const router = useRouter();
  const { user, isLoading: isAuthLoading } = useAuthContext();
  const { setPendingInvite, clearPendingInvite } = usePendingInvite();
  const { setLastUsedListId } = useLastUsedList();

  const [state, setState] = useState<InviteState>({ status: 'loading' });
  const [invite, setInvite] = useState<Invite | null>(null);

  // Validate token parameter
  useEffect(() => {
    if (!token || typeof token !== 'string' || token.trim() === '') {
      clearPendingInvite(); // Clear invalid token to prevent retry loops
      setState({ status: 'invalid' });
    }
  }, [token, clearPendingInvite]);

  // Fetch and validate invite
  useEffect(() => {
    if (state.status === 'invalid') return;
    if (!token) return;

    let active = true;

    async function fetchInvite() {
      try {
        const fetchedInvite = await getInvite(token);

        if (!active) return;

        if (!fetchedInvite) {
          clearPendingInvite(); // Clear to prevent retry loops
          setState({
            status: 'error',
            message: getErrorMessage('invite_not_found'),
          });
          return;
        }

        // Check if expired
        const now = Date.now();
        if (fetchedInvite.expiresAt <= now) {
          clearPendingInvite(); // Clear to prevent retry loops
          setState({
            status: 'error',
            message: getErrorMessage('invite_expired'),
          });
          return;
        }

        // Check if already used
        if (fetchedInvite.usedBy !== null) {
          clearPendingInvite(); // Clear to prevent retry loops
          setState({
            status: 'error',
            message: getErrorMessage('invite_already_used'),
          });
          return;
        }

        setInvite(fetchedInvite);

        // If auth is still loading, wait
        if (isAuthLoading) {
          return;
        }

        // Check if user needs to authenticate
        if (!user) {
          setState({ status: 'needs_auth' });
          return;
        }

        // User is authenticated, proceed to redeem
        setState({ status: 'redeeming' });
      } catch (error) {
        if (!active) return;
        console.error('Failed to fetch invite:', error);
        clearPendingInvite(); // Clear to prevent retry loops
        setState({
          status: 'error',
          message: 'Failed to load invite. Please try again.',
        });
      }
    }

    fetchInvite();

    return () => {
      active = false;
    };
  }, [token, user, isAuthLoading, state.status, clearPendingInvite]);

  // Redeem invite when authenticated and ready
  useEffect(() => {
    if (state.status !== 'redeeming') return;
    if (!user || !token) return;

    // Capture user.uid to avoid closure issues
    const userId = user.uid;
    let active = true;

    async function redeem() {
      try {
        const result: RedeemInviteResult = await redeemInvite(token, userId);

        if (!active) return;

        if (result.success) {
          // Clear any pending invite since we've redeemed it
          clearPendingInvite();
          // Update last used list to the newly joined list
          setLastUsedListId(result.listId);
          setState({ status: 'success', listId: result.listId });
        } else {
          // Handle specific error cases
          clearPendingInvite(); // Clear to prevent retry loops
          const message = getErrorMessage(result.reason);

          // If already a member, navigate to the list
          if (result.reason === 'already_member' && invite?.listId) {
            setState({
              status: 'error',
              message,
              navigateToList: invite.listId,
            });
          } else {
            setState({ status: 'error', message });
          }
        }
      } catch (error) {
        if (!active) return;
        console.error('Failed to redeem invite:', error);
        clearPendingInvite(); // Clear to prevent retry loops
        setState({
          status: 'error',
          message: 'Failed to join the list. Please try again.',
        });
      }
    }

    redeem();

    return () => {
      active = false;
    };
  }, [
    state.status,
    user,
    token,
    invite,
    clearPendingInvite,
    setLastUsedListId,
  ]);

  // Navigate to list on success (after brief delay for UX)
  useEffect(() => {
    if (state.status !== 'success') return;

    const timer = setTimeout(() => {
      router.replace('/(tabs)');
    }, 1500);

    return () => clearTimeout(timer);
  }, [state.status, router]);

  // Handle "needs auth" - store token and redirect to login
  const handleSignIn = () => {
    if (token) {
      setPendingInvite(token);
    }
    router.replace('/(auth)/login');
  };

  // Handle navigation to list (for "already member" case)
  const handleGoToList = (listId: string) => {
    setLastUsedListId(listId);
    router.replace('/(tabs)');
  };

  // Handle going back home
  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  // Render based on state
  if (state.status === 'loading' || isAuthLoading) {
    return (
      <Screen>
        <TopBar title="Invite" />
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
          <Text color="$textMuted">Loading invite...</Text>
        </YStack>
      </Screen>
    );
  }

  if (state.status === 'invalid') {
    return (
      <Screen>
        <TopBar title="Invalid Invite" />
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          gap="$4"
          padding="$4"
        >
          <Text fontSize="$2" color="$text" textAlign="center">
            Invalid invite link
          </Text>
          <Text fontSize="$1" color="$textMuted" textAlign="center">
            The invite link appears to be malformed or incomplete.
          </Text>
          <PrimaryButton onPress={handleGoHome}>Go to my lists</PrimaryButton>
        </YStack>
      </Screen>
    );
  }

  if (state.status === 'needs_auth') {
    return (
      <Screen>
        <TopBar title="Join List" />
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          gap="$4"
          padding="$4"
        >
          {invite && (
            <>
              <Text fontSize="$3" fontWeight="$2" color="$text" textAlign="center">
                {invite.inviteAlias}
              </Text>
              <Text fontSize="$1" color="$textMuted" textAlign="center">
                Sign in to join this list
              </Text>
            </>
          )}
          <YStack width="100%" maxWidth={300} marginTop="$4">
            <PrimaryButton onPress={handleSignIn}>Sign in to join</PrimaryButton>
          </YStack>
        </YStack>
      </Screen>
    );
  }

  if (state.status === 'redeeming') {
    return (
      <Screen>
        <TopBar title="Joining..." />
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
          <Text color="$textMuted">Joining the list...</Text>
        </YStack>
      </Screen>
    );
  }

  if (state.status === 'success') {
    return (
      <Screen>
        <TopBar title="Joined!" />
        <YStack
          flex={1}
          justifyContent="center"
          alignItems="center"
          gap="$4"
          padding="$4"
        >
          <Text fontSize="$3" fontWeight="$2" color="$text" textAlign="center">
            You joined the list!
          </Text>
          {invite && (
            <Text fontSize="$1" color="$textMuted" textAlign="center">
              {invite.inviteAlias}
            </Text>
          )}
          <Text fontSize="$1" color="$textMuted" textAlign="center">
            Redirecting...
          </Text>
        </YStack>
      </Screen>
    );
  }

  // Error state - extract navigateToList for type safety in callback
  const navigateToListId = state.navigateToList;

  return (
    <Screen>
      <TopBar title="Invite" />
      <YStack
        flex={1}
        justifyContent="center"
        alignItems="center"
        gap="$4"
        padding="$4"
      >
        <Text fontSize="$2" color="$danger" textAlign="center">
          {state.message}
        </Text>
        {navigateToListId ? (
          <PrimaryButton onPress={() => handleGoToList(navigateToListId)}>
            Go to list
          </PrimaryButton>
        ) : (
          <PrimaryButton onPress={handleGoHome}>Go to my lists</PrimaryButton>
        )}
      </YStack>
    </Screen>
  );
}
