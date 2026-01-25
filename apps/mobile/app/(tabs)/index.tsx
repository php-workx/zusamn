import { Screen, Text, TopBar, YStack } from '@zusamn/ui';

/**
 * Lists tab screen - placeholder for FR-NAV-002.
 * Will eventually show List Detail screen with last-used list.
 */
export default function ListsScreen() {
  return (
    <Screen safeArea={false}>
      <TopBar title="Lists" />
      <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
        <Text fontSize="$2" color="$textMuted" textAlign="center">
          Your shopping lists will appear here.
        </Text>
      </YStack>
    </Screen>
  );
}
