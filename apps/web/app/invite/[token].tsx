import { useEffect, useState, useCallback } from 'react';
import { useLocalSearchParams } from 'expo-router';
import { PrimaryButton, Screen, Text, YStack, XStack } from '@zusamn/ui';
import {
  getInvite,
  getUserById,
  onAuthStateChanged,
  signInWithGooglePopup,
  signInWithApplePopup,
  signOut,
  redeemInvite,
  type AuthUser,
  type RedeemInviteResult,
} from '@zusamn/firebase';
import type { Invite, User } from '@zusamn/domain';

type InviteState =
  | { status: 'loading' }
  | { status: 'not_found' }
  | { status: 'expired'; sharerName: string }
  | { status: 'already_used'; sharerName: string }
  | { status: 'ready'; invite: Invite; sharer: User }
  | { status: 'error'; message: string };

type RedemptionState =
  | { status: 'idle' }
  | { status: 'redeeming' }
  | { status: 'success'; provider: string; alias: string }
  | { status: 'list_full' }
  | { status: 'already_member' }
  | { status: 'error'; message: string };

/**
 * Get the display name for an auth provider.
 */
function getProviderDisplayName(providerId: string | null): string {
  if (!providerId) return 'your account';
  if (providerId === 'google.com') return 'Google';
  if (providerId === 'apple.com') return 'Apple';
  return 'your account';
}

/**
 * Avatar component displaying user initials or image.
 * Shows initials in a colored circle when no avatar URL is provided.
 */
function Avatar({ displayName, avatarUrl }: { displayName: string; avatarUrl?: string | null }) {
  const initials = getInitials(displayName);

  if (avatarUrl) {
    return (
      <XStack width={64} height={64} borderRadius={32} overflow="hidden" backgroundColor="$surface">
        <img
          src={avatarUrl}
          alt={displayName}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
          }}
        />
      </XStack>
    );
  }

  return (
    <XStack
      width={64}
      height={64}
      borderRadius={32}
      backgroundColor="$accent"
      alignItems="center"
      justifyContent="center"
    >
      <Text fontSize="$3" fontWeight="$2" color="$accentColor">
        {initials}
      </Text>
    </XStack>
  );
}

/**
 * Get initials from a display name.
 * Returns first letter of first and last words, or first two letters if single word.
 */
function getInitials(displayName: string): string {
  const trimmed = displayName.trim();
  if (!trimmed) return '?';

  const words = trimmed.split(/\s+/);
  const firstWord = words[0];
  const lastWord = words[words.length - 1];

  if (!firstWord) return '?';

  if (words.length === 1) {
    return firstWord.substring(0, 2).toUpperCase();
  }

  const first = firstWord[0] ?? '';
  const last = lastWord?.[0] ?? '';
  return (first + last).toUpperCase();
}

/**
 * Auth button for Google Sign-In.
 * Styled with white background and Google branding.
 */
function GoogleSignInButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return (
    <XStack
      backgroundColor="#ffffff"
      borderColor="$separator"
      borderWidth={1}
      borderRadius="$1"
      minHeight={44}
      paddingHorizontal="$4"
      alignItems="center"
      justifyContent="center"
      onPress={disabled ? undefined : onPress}
      pressStyle={disabled ? undefined : { opacity: 0.8 }}
      opacity={disabled ? 0.5 : 1}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      accessibilityState={{ disabled }}
      gap="$2"
    >
      <Text fontSize={20}>G</Text>
      <Text fontSize="$2" fontWeight="$1" color="$text">
        Continue with Google
      </Text>
    </XStack>
  );
}

/**
 * Auth button for Apple Sign-In.
 * Styled with black background following Apple branding guidelines.
 */
function AppleSignInButton({ onPress, disabled }: { onPress: () => void; disabled?: boolean }) {
  return (
    <XStack
      backgroundColor="#000000"
      borderRadius="$1"
      minHeight={44}
      paddingHorizontal="$4"
      alignItems="center"
      justifyContent="center"
      onPress={disabled ? undefined : onPress}
      pressStyle={disabled ? undefined : { opacity: 0.8 }}
      opacity={disabled ? 0.5 : 1}
      accessible
      accessibilityRole="button"
      accessibilityLabel="Continue with Apple"
      accessibilityState={{ disabled }}
      gap="$2"
    >
      <Text fontSize="$2" fontWeight="$1" color="#ffffff">
        Continue with Apple
      </Text>
    </XStack>
  );
}

/**
 * Error card for displaying invite validation errors.
 */
function ErrorCard({
  title,
  message,
  sharerName,
}: {
  title: string;
  message: string;
  sharerName?: string;
}) {
  return (
    <YStack
      width="100%"
      maxWidth={400}
      padding="$4"
      backgroundColor="$surface"
      borderRadius="$1"
      alignItems="center"
      gap="$3"
    >
      <Text fontSize="$2" fontWeight="$2" color="$danger" textAlign="center">
        {title}
      </Text>
      <Text fontSize="$1" color="$textMuted" textAlign="center">
        {message}
        {sharerName && ` Ask ${sharerName} for a new invite.`}
      </Text>
    </YStack>
  );
}

/**
 * Success card shown after successfully joining a list.
 * Displays the provider used and CTA buttons.
 */
function SuccessCard({
  provider,
  alias,
  token,
  onSwitchAccount,
}: {
  provider: string;
  alias: string;
  token: string;
  onSwitchAccount: () => void;
}) {
  const deepLinkUrl = `zusamn://invite/${token}`;

  const handleOpenInApp = () => {
    window.location.href = deepLinkUrl;
  };

  const handleGetApp = () => {
    // For now, just show an alert. In production, this would link to app stores.
    // eslint-disable-next-line no-alert
    window.alert('App store links coming soon!');
  };

  return (
    <YStack
      width="100%"
      maxWidth={400}
      padding="$4"
      backgroundColor="$surface"
      borderRadius="$1"
      alignItems="center"
      gap="$4"
    >
      {/* Success indicator */}
      <XStack
        width={64}
        height={64}
        borderRadius={32}
        backgroundColor="#E8F5E9"
        alignItems="center"
        justifyContent="center"
      >
        <Text fontSize={32} color="#4CAF50">
          ✓
        </Text>
      </XStack>

      <YStack alignItems="center" gap="$2">
        <Text fontSize="$3" fontWeight="$2" color="$text" textAlign="center">
          You're in!
        </Text>
        <Text fontSize="$2" color="$textMuted" textAlign="center">
          Joined with {provider}
        </Text>
        <Text fontSize="$1" color="$textMuted" textAlign="center">
          You've been added to "{alias}"
        </Text>
      </YStack>

      {/* CTA buttons */}
      <YStack width="100%" gap="$2">
        <PrimaryButton onPress={handleOpenInApp}>Open in App</PrimaryButton>
        <XStack
          backgroundColor="transparent"
          borderColor="$separator"
          borderWidth={1}
          borderRadius="$1"
          minHeight={44}
          paddingHorizontal="$4"
          alignItems="center"
          justifyContent="center"
          onPress={handleGetApp}
          pressStyle={{ opacity: 0.8 }}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Get the App"
        >
          <Text fontSize="$2" fontWeight="$1" color="$text">
            Get the App
          </Text>
        </XStack>
      </YStack>

      {/* Switch account option */}
      <XStack
        backgroundColor="transparent"
        borderRadius="$1"
        paddingHorizontal="$4"
        alignItems="center"
        justifyContent="center"
        onPress={onSwitchAccount}
        pressStyle={{ opacity: 0.6 }}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Use a different account"
      >
        <Text fontSize="$1" color="$accent">
          Use a different account
        </Text>
      </XStack>
    </YStack>
  );
}

/**
 * Redemption error card for post-auth errors.
 */
function RedemptionErrorCard({
  title,
  message,
  onTryAgain,
}: {
  title: string;
  message: string;
  onTryAgain?: () => void;
}) {
  return (
    <YStack
      width="100%"
      maxWidth={400}
      padding="$4"
      backgroundColor="$surface"
      borderRadius="$1"
      alignItems="center"
      gap="$3"
    >
      <Text fontSize="$2" fontWeight="$2" color="$danger" textAlign="center">
        {title}
      </Text>
      <Text fontSize="$1" color="$textMuted" textAlign="center">
        {message}
      </Text>
      {onTryAgain && (
        <XStack
          backgroundColor="transparent"
          borderRadius="$1"
          paddingVertical="$2"
          paddingHorizontal="$4"
          alignItems="center"
          justifyContent="center"
          onPress={onTryAgain}
          pressStyle={{ opacity: 0.6 }}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Try again"
        >
          <Text fontSize="$2" color="$accent">
            Try again
          </Text>
        </XStack>
      )}
    </YStack>
  );
}

/**
 * Identity confirmation card shown when user has existing session.
 * FR-WEB-018: Page MUST show identity confirmation before accepting invite.
 */
function IdentityConfirmation({
  user,
  onContinue,
  onSwitchAccount,
}: {
  user: AuthUser;
  onContinue: () => void;
  onSwitchAccount: () => void;
}) {
  return (
    <YStack
      width="100%"
      maxWidth={400}
      padding="$4"
      backgroundColor="$surface"
      borderRadius="$1"
      alignItems="center"
      gap="$4"
    >
      <Text fontSize="$2" fontWeight="$2" color="$text" textAlign="center">
        Continue as {user.displayName || user.email}?
      </Text>
      <YStack width="100%" gap="$2">
        <PrimaryButton onPress={onContinue}>Continue</PrimaryButton>
        <XStack
          backgroundColor="transparent"
          borderRadius="$1"
          minHeight={44}
          paddingHorizontal="$4"
          alignItems="center"
          justifyContent="center"
          onPress={onSwitchAccount}
          pressStyle={{ opacity: 0.6 }}
          accessible
          accessibilityRole="button"
          accessibilityLabel="Use a different account"
        >
          <Text fontSize="$2" fontWeight="$1" color="$accent">
            Use a different account
          </Text>
        </XStack>
      </YStack>
    </YStack>
  );
}

/**
 * Invite landing page for web-based invite acceptance.
 *
 * Requirements from spec.md (FR-WEB-*):
 * - FR-WEB-001: Lightweight landing page (NOT a full web app)
 * - FR-WEB-002: Display invite context (share name prominently)
 * - FR-WEB-003: Display sharer info (display name + avatar/initials)
 * - FR-WEB-004: NEVER display sharer email (privacy)
 * - FR-WEB-005/006: Google and Apple Sign-In buttons
 * - FR-WEB-007: Accept invite on auth success (redeem invite)
 * - FR-WEB-008/009/010: Show appropriate error for expired/used/full invites
 * - FR-WEB-012-015: Post-auth success/error states
 * - FR-WEB-016: Warning about using same login method in app
 * - FR-WEB-017: Deep link to app after redemption
 * - FR-WEB-018: Identity confirmation for existing sessions
 */
export default function InvitePage() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [inviteState, setInviteState] = useState<InviteState>({ status: 'loading' });
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [showIdentityConfirmation, setShowIdentityConfirmation] = useState(false);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [redemptionState, setRedemptionState] = useState<RedemptionState>({ status: 'idle' });

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged((user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);
      // Show identity confirmation if user is already logged in
      if (user) {
        setShowIdentityConfirmation(true);
      }
    });
    return unsubscribe;
  }, []);

  // Fetch invite data
  useEffect(() => {
    async function fetchInvite() {
      if (!token) {
        setInviteState({ status: 'not_found' });
        return;
      }

      try {
        const invite = await getInvite(token);

        if (!invite) {
          setInviteState({ status: 'not_found' });
          return;
        }

        // Fetch sharer info
        const sharer = await getUserById(invite.createdByUserId);
        const sharerName = sharer?.displayName || 'the list owner';

        // Check if already used
        if (invite.usedBy !== null) {
          setInviteState({ status: 'already_used', sharerName });
          return;
        }

        // Check if expired
        const now = Date.now();
        if (invite.expiresAt <= now) {
          setInviteState({ status: 'expired', sharerName });
          return;
        }

        if (!sharer) {
          setInviteState({ status: 'error', message: 'Could not load invite details.' });
          return;
        }

        setInviteState({ status: 'ready', invite, sharer });
      } catch (error) {
        console.error('Error fetching invite:', error);
        setInviteState({
          status: 'error',
          message: 'Something went wrong. Please try again.',
        });
      }
    }

    fetchInvite();
  }, [token]);

  /**
   * Handle the invite redemption after authentication.
   * Maps RedeemInviteResult to RedemptionState.
   */
  const handleRedemption = useCallback(
    async (user: AuthUser) => {
      if (!token) return;

      setRedemptionState({ status: 'redeeming' });

      try {
        const result: RedeemInviteResult = await redeemInvite(token, user.uid);

        if (result.success) {
          const provider = getProviderDisplayName(user.providerId);
          setRedemptionState({ status: 'success', provider, alias: result.alias });
        } else {
          switch (result.reason) {
            case 'list_full':
              setRedemptionState({ status: 'list_full' });
              break;
            case 'already_member':
              setRedemptionState({ status: 'already_member' });
              break;
            case 'invite_not_found':
            case 'invite_expired':
            case 'invite_already_used':
            case 'list_not_found':
              setRedemptionState({
                status: 'error',
                message: 'This invite is no longer valid.',
              });
              break;
            default:
              setRedemptionState({
                status: 'error',
                message: 'Something went wrong. Please try again.',
              });
          }
        }
      } catch (error) {
        console.error('Error redeeming invite:', error);
        setRedemptionState({
          status: 'error',
          message: 'Something went wrong. Please try again.',
        });
      }
    },
    [token]
  );

  const handleContinueWithExistingSession = useCallback(async () => {
    setShowIdentityConfirmation(false);
    if (currentUser) {
      await handleRedemption(currentUser);
    }
  }, [currentUser, handleRedemption]);

  const handleSwitchAccount = useCallback(async () => {
    // Sign out and let user choose a different account
    try {
      await signOut();
      setShowIdentityConfirmation(false);
      setCurrentUser(null);
      setRedemptionState({ status: 'idle' });
    } catch (error) {
      console.error('Error signing out:', error);
    }
  }, []);

  const handleGoogleSignIn = useCallback(async () => {
    try {
      const user = await signInWithGooglePopup();
      setCurrentUser(user);
      await handleRedemption(user);
    } catch (error) {
      console.error('Error signing in with Google:', error);
      setRedemptionState({
        status: 'error',
        message: 'Failed to sign in with Google. Please try again.',
      });
    }
  }, [handleRedemption]);

  const handleAppleSignIn = useCallback(async () => {
    try {
      const user = await signInWithApplePopup();
      setCurrentUser(user);
      await handleRedemption(user);
    } catch (error) {
      console.error('Error signing in with Apple:', error);
      setRedemptionState({
        status: 'error',
        message: 'Failed to sign in with Apple. Please try again.',
      });
    }
  }, [handleRedemption]);

  // Loading state
  if (inviteState.status === 'loading' || isAuthLoading) {
    return (
      <Screen>
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Text fontSize="$2" color="$textMuted">
            Loading...
          </Text>
        </YStack>
      </Screen>
    );
  }

  // Not found state
  if (inviteState.status === 'not_found') {
    return (
      <Screen>
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
          <ErrorCard
            title="Invite Not Found"
            message="This invite link is invalid or has been removed."
          />
        </YStack>
      </Screen>
    );
  }

  // Expired state
  if (inviteState.status === 'expired') {
    return (
      <Screen>
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
          <ErrorCard
            title="Invite Expired"
            message="This invite has expired."
            sharerName={inviteState.sharerName}
          />
        </YStack>
      </Screen>
    );
  }

  // Already used state
  if (inviteState.status === 'already_used') {
    return (
      <Screen>
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
          <ErrorCard
            title="Invite Already Used"
            message="This invite has already been used."
            sharerName={inviteState.sharerName}
          />
        </YStack>
      </Screen>
    );
  }

  // Error state
  if (inviteState.status === 'error') {
    return (
      <Screen>
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
          <ErrorCard title="Something Went Wrong" message={inviteState.message} />
        </YStack>
      </Screen>
    );
  }

  // Ready state - show invite details
  const { invite, sharer } = inviteState;

  // Redemption in progress
  if (redemptionState.status === 'redeeming') {
    return (
      <Screen>
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
          <YStack alignItems="center" marginBottom="$4">
            <Text fontSize="$4" fontWeight="$2" color="$text">
              Zusamn
            </Text>
          </YStack>
          <Text fontSize="$2" color="$textMuted">
            Joining list...
          </Text>
        </YStack>
      </Screen>
    );
  }

  // Redemption success
  if (redemptionState.status === 'success' && token) {
    return (
      <Screen>
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
          <YStack alignItems="center" marginBottom="$4">
            <Text fontSize="$4" fontWeight="$2" color="$text">
              Zusamn
            </Text>
          </YStack>
          <SuccessCard
            provider={redemptionState.provider}
            alias={redemptionState.alias}
            token={token}
            onSwitchAccount={handleSwitchAccount}
          />
        </YStack>
      </Screen>
    );
  }

  // Redemption error - list full
  if (redemptionState.status === 'list_full') {
    return (
      <Screen>
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
          <YStack alignItems="center" marginBottom="$4">
            <Text fontSize="$4" fontWeight="$2" color="$text">
              Zusamn
            </Text>
          </YStack>
          <RedemptionErrorCard
            title="List is Full"
            message="This list has reached its maximum of 3 people."
          />
        </YStack>
      </Screen>
    );
  }

  // Redemption error - already a member
  if (redemptionState.status === 'already_member') {
    return (
      <Screen>
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
          <YStack alignItems="center" marginBottom="$4">
            <Text fontSize="$4" fontWeight="$2" color="$text">
              Zusamn
            </Text>
          </YStack>
          <RedemptionErrorCard
            title="Already a Member"
            message="You're already a member of this list."
          />
        </YStack>
      </Screen>
    );
  }

  // Redemption error - generic
  if (redemptionState.status === 'error') {
    return (
      <Screen>
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
          <YStack alignItems="center" marginBottom="$4">
            <Text fontSize="$4" fontWeight="$2" color="$text">
              Zusamn
            </Text>
          </YStack>
          <RedemptionErrorCard
            title="Something Went Wrong"
            message={redemptionState.message}
            onTryAgain={handleSwitchAccount}
          />
        </YStack>
      </Screen>
    );
  }

  // If user has existing session, show identity confirmation first
  if (currentUser && showIdentityConfirmation) {
    return (
      <Screen>
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
          <YStack alignItems="center" marginBottom="$4">
            <Text fontSize="$4" fontWeight="$2" color="$text">
              Zusamn
            </Text>
          </YStack>

          <YStack
            width="100%"
            maxWidth={400}
            padding="$4"
            backgroundColor="$surface"
            borderRadius="$1"
            alignItems="center"
            gap="$3"
          >
            <Avatar displayName={sharer.displayName} avatarUrl={sharer.avatarUrl} />
            <Text fontSize="$1" color="$textMuted" textAlign="center">
              {sharer.displayName} invited you to
            </Text>
            <Text fontSize="$3" fontWeight="$2" color="$text" textAlign="center">
              {invite.inviteAlias}
            </Text>
          </YStack>

          <IdentityConfirmation
            user={currentUser}
            onContinue={handleContinueWithExistingSession}
            onSwitchAccount={handleSwitchAccount}
          />
        </YStack>
      </Screen>
    );
  }

  // Show auth options
  return (
    <Screen>
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
        <YStack alignItems="center" marginBottom="$4">
          <Text fontSize="$4" fontWeight="$2" color="$text">
            Zusamn
          </Text>
        </YStack>

        {/* Invite card with sharer info */}
        <YStack
          width="100%"
          maxWidth={400}
          padding="$4"
          backgroundColor="$surface"
          borderRadius="$1"
          alignItems="center"
          gap="$3"
        >
          <Avatar displayName={sharer.displayName} avatarUrl={sharer.avatarUrl} />
          <Text fontSize="$1" color="$textMuted" textAlign="center">
            {sharer.displayName} invited you to
          </Text>
          <Text fontSize="$3" fontWeight="$2" color="$text" textAlign="center">
            {invite.inviteAlias}
          </Text>
        </YStack>

        {/* Auth buttons */}
        <YStack width="100%" maxWidth={400} gap="$3">
          <GoogleSignInButton onPress={handleGoogleSignIn} />
          <AppleSignInButton onPress={handleAppleSignIn} />
        </YStack>

        {/* Warning about login method - FR-WEB-016 */}
        <YStack
          width="100%"
          maxWidth={400}
          padding="$3"
          backgroundColor="#FFF9E6"
          borderRadius="$1"
          borderColor="#FFE066"
          borderWidth={1}
        >
          <Text fontSize="$1" color="#8B6914" textAlign="center">
            Important: Use the same login method in the app to see this list.
          </Text>
        </YStack>
      </YStack>
    </Screen>
  );
}
