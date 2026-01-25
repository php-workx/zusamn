import { GhostButton, PrimaryButton, Screen, Text, TopBar, YStack } from '@zusamn/ui';
import { useAuthContext } from '../../src/providers';

/**
 * Account tab screen - placeholder for FR-NAV-003.
 * Shows user info and sign out option.
 */
export default function AccountScreen() {
  const { user, signOut } = useAuthContext();

  return (
    <Screen safeArea={false}>
      <TopBar title="Account" />
      <YStack flex={1} padding="$4" gap="$5">
        <YStack gap="$1">
          <Text fontSize="$3" color="$text">
            {user?.displayName || 'Unknown User'}
          </Text>
          <Text fontSize="$1" color="$textMuted">
            {user?.email || 'No email'}
          </Text>
        </YStack>

        <YStack gap="$3">
          <PrimaryButton onPress={() => void signOut()}>Logout</PrimaryButton>
          <GhostButton danger>Delete Account</GhostButton>
        </YStack>
      </YStack>
    </Screen>
  );
}
