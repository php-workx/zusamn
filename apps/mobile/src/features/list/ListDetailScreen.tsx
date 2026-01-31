import { useCallback, useMemo, useState } from 'react';
import { Alert } from 'react-native';
import { StyleSheet } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ConfirmDialog, EmptyState, OverflowMenu, Screen, Text, TopBar, YStack } from '@zusamn/ui';
import {
  useItems,
  useList,
  useMembership,
  useSyncStatus,
  bulkSoftDelete,
  bulkUndelete,
} from '@zusamn/firebase';
import { useAuthContext, useToast } from '../../providers';
import { useNetworkStatus } from '../../hooks';
import { ItemList } from './ItemList';
import { AddItemInput } from './AddItemInput';

export interface ListDetailScreenProps {
  listId: string;
}

/**
 * List Detail screen showing items with add/check/delete functionality.
 * Shows offline/sync status in TopBar subtitle.
 */
export function ListDetailScreen({ listId }: ListDetailScreenProps) {
  const { user } = useAuthContext();
  const { showUndoToast } = useToast();
  const { isConnected } = useNetworkStatus();
  const { hasPendingWrites, markWritePending, clearWritePending } = useSyncStatus();
  const showError = useCallback((message: string, error?: unknown) => {
    console.error(message, error);
    Alert.alert('Something went wrong', message);
  }, []);

  // Firebase data
  const { list, isLoading: isListLoading } = useList(listId);
  const { membership } = useMembership(listId, user?.uid);
  const { items, isLoading: isItemsLoading } = useItems(listId);

  // Clear checked dialog
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Determine status subtitle (Offline > Syncing priority per spec)
  const getStatusSubtitle = useCallback((): string | undefined => {
    if (!isConnected) return 'Offline';
    if (hasPendingWrites) return 'Syncing';
    return undefined;
  }, [isConnected, hasPendingWrites]);

  // Memoize checked items to avoid recalculating (js-combine-iterations)
  const { checkedItems, checkedCount } = useMemo(() => {
    const checked = items.filter((item) => item.checked);
    return { checkedItems: checked, checkedCount: checked.length };
  }, [items]);

  // Handle clear checked
  const handleClearChecked = useCallback(async () => {
    if (checkedCount === 0) return;

    const itemIds = checkedItems.map((item) => item.id);
    setShowClearDialog(false);

    markWritePending();
    try {
      await bulkSoftDelete(listId, itemIds);

      showUndoToast({
        message: `${checkedCount} item${checkedCount > 1 ? 's' : ''} cleared`,
        onUndo: async () => {
          try {
            markWritePending();
            await bulkUndelete(listId, itemIds);
          } catch (error) {
            clearWritePending();
            showError('Unable to undo clear. Please try again.', error);
          }
        },
      });
    } catch (error) {
      clearWritePending();
      showError('Unable to clear checked items. Please try again.', error);
    }
  }, [
    listId,
    checkedItems,
    checkedCount,
    markWritePending,
    clearWritePending,
    showUndoToast,
    showError,
  ]);

  // Memoize overflow menu items (rerender-memo-with-default-value)
  const overflowMenuItems = useMemo(
    () => [
      {
        label: `Clear checked${checkedCount > 0 ? ` (${checkedCount})` : ''}`,
        onPress: () => {
          if (checkedCount > 0) {
            setShowClearDialog(true);
          }
        },
        destructive: true,
      },
    ],
    [checkedCount]
  );

  // Loading state
  if (isListLoading) {
    return (
      <Screen safeArea={false}>
        <TopBar title="Loading..." />
        <YStack flex={1} justifyContent="center" alignItems="center">
          <Text color="$textMuted">Loading your list...</Text>
        </YStack>
      </Screen>
    );
  }

  // Get list title from membership alias or fallback
  const listTitle = membership?.alias ?? 'Shopping';

  return (
    <GestureHandlerRootView style={styles.root}>
      <Screen safeArea={false}>
        <TopBar
          title={listTitle}
          subtitle={getStatusSubtitle()}
          rightActions={<OverflowMenu items={overflowMenuItems} />}
        />

        {items.length === 0 && !isItemsLoading ? (
          <YStack flex={1} justifyContent="center" paddingBottom={100}>
            <EmptyState message="Your list is empty" description="Add your first item below" />
          </YStack>
        ) : (
          <ItemList listId={listId} items={items} onWritePending={markWritePending} />
        )}

        {user?.uid && (
          <AddItemInput
            listId={listId}
            userId={user.uid}
            onWritePending={markWritePending}
            onWriteFailure={clearWritePending}
          />
        )}

        <ConfirmDialog
          visible={showClearDialog}
          onCancel={() => setShowClearDialog(false)}
          title={`Clear ${checkedCount} checked item${checkedCount !== 1 ? 's' : ''}?`}
          confirmLabel="Clear"
          onConfirm={handleClearChecked}
          destructive
        />
      </Screen>
    </GestureHandlerRootView>
  );
}

// Hoist static styles (rendering-hoist-jsx)
const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
