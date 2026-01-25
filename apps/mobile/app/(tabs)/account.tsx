import { Screen, Text, TopBar, YStack } from '@zusamn/ui';
import { useAuthContext } from '../../src/providers';

/**
 * Account tab screen - placeholder for FR-NAV-003.
 * Shows user info and sign out option.
 */
export default function AccountScreen() {
  const { user } = useAuthContext();

  return (
    <Screen safeArea={false}>
      <TopBar title="Account" />
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
        <Text fontSize="$2" color="$text" textAlign="center">
          {user?.displayName || 'Unknown User'}
        </Text>
        <Text fontSize="$1" color="$textMuted" textAlign="center">
          {user?.email || 'No email'}
        </Text>
        <Text fontSize="$1" color="$textMuted" textAlign="center" marginTop="$4">
          Account settings will appear here.
        </Text>
      </YStack>
    </Screen>
  );
}
