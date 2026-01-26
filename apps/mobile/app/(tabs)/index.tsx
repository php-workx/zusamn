import { Screen, Text, TopBar, YStack } from '@zusamn/ui';
import { usePersonalList } from '../../src/providers';
import { ListDetailScreen } from '../../src/features/list';

/**
 * Lists tab screen - shows the user's personal list.
 * Uses PersonalListProvider for list initialization.
 */
export default function ListsScreen() {
  const { listId, isInitializing, error } = usePersonalList();

  // Loading state
  if (isInitializing) {
    return (
      <Screen safeArea={false}>
        <TopBar title="Loading..." />
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Text color="$textMuted">Loading your list...</Text>
        </YStack>
      </Screen>
    );
  }

  // Error state
  if (error) {
    console.error('Failed to load personal list', error);
    const errorMessage = __DEV__
      ? error.message
      : 'Something went wrong. Please try again.';
    return (
      <Screen safeArea={false}>
        <TopBar title="Error" />
        <YStack flex={1} justifyContent="center" alignItems="center" padding="$4">
          <Text color="$danger" textAlign="center">
            {errorMessage}
          </Text>
        </YStack>
      </Screen>
    );
  }

  // No list (shouldn't happen, but handle gracefully)
  if (!listId) {
    return (
      <Screen safeArea={false}>
        <TopBar title="Lists" />
        <YStack flex={1} justifyContent="center" alignItems="center" gap="$4">
          <Text fontSize="$2" color="$textMuted" textAlign="center">
            Unable to load your list. Please try again.
          </Text>
        </YStack>
      </Screen>
    );
  }

  return <ListDetailScreen listId={listId} />;
}
