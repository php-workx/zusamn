<<<<<<< HEAD
import { Screen, Text, TopBar, YStack } from '@zusamn/ui';
import { usePersonalList } from '../../src/providers';
import { ListDetailScreen } from '../../src/features/list';
=======
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  FlatList,
  type TextInput,
  type ListRenderItemInfo,
} from 'react-native';
import { GestureHandlerRootView, Swipeable } from 'react-native-gesture-handler';
import {
  EmptyState,
  ListRow,
  OverflowMenu,
  Screen,
  Text,
  TopBar,
  XStack,
  YStack,
  ConfirmDialog,
} from '@zusamn/ui';
import {
  useItems,
  useList,
  useMembership,
  useSyncStatus,
  addItem,
  toggleItemChecked,
  softDeleteItem,
  undeleteItem,
  bulkSoftDelete,
  bulkUndelete,
  getItemCount,
  getPersonalList,
  createPersonalList,
  useUser,
} from '@zusamn/firebase';
import { MAX_TEXT_LENGTH, MAX_ITEMS_PER_LIST } from '@zusamn/domain';
import type { Item } from '@zusamn/domain';
import { useAuthContext, useToast } from '../../src/providers';
import { useNetworkStatus, useLastUsedList } from '../../src/hooks';
import { FixedBottomInput } from '../../src/components';
>>>>>>> fix: improve error handling and hook safety

/**
 * Lists tab screen - shows the user's personal list.
 * Uses PersonalListProvider for list initialization.
 */
<<<<<<< HEAD
export default function ListsScreen() {
  const { listId, isInitializing, error } = usePersonalList();
=======
export default function ListDetailScreen() {
  const { user } = useAuthContext();
  const { showUndoToast } = useToast();
  const { isConnected } = useNetworkStatus();
  const { hasPendingWrites, markWritePending } = useSyncStatus();
  const { getLastUsedListId, setLastUsedListId } = useLastUsedList();
  const showError = useCallback((message: string, error?: unknown) => {
    console.error(message, error);
    Alert.alert('Something went wrong', message);
  }, []);

  // List state
  const [listId, setListId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [initError, setInitError] = useState<Error | null>(null);

  // Input state
  const [inputValue, setInputValue] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);
  const inputRef = useRef<TextInput>(null) as React.RefObject<TextInput>;

  // Clear checked dialog
  const [showClearDialog, setShowClearDialog] = useState(false);

  // Swipeable refs for closing
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());

  // Firebase hooks
  const { user: firestoreUser } = useUser(user?.uid, {
    displayName: user?.displayName ?? undefined,
    email: user?.email ?? undefined,
  });
  const { list, isLoading: isListLoading } = useList(listId);
  const { membership } = useMembership(listId, user?.uid);
  const { items, isLoading: isItemsLoading } = useItems(listId);

  // Initialize personal list on mount
  useEffect(() => {
    async function initializeList() {
      if (!user?.uid || !firestoreUser) return;

      try {
        // Check for last used list first
        const lastListId = getLastUsedListId();
        if (lastListId) {
          setListId(lastListId);
          setIsInitializing(false);
          return;
        }

        // Check for existing personal list
        const existingList = await getPersonalList(user.uid);
        if (existingList) {
          setListId(existingList.list.id);
          setLastUsedListId(existingList.list.id);
          setIsInitializing(false);
          return;
        }

        // Create personal list for first-time users
        const { list: newList } = await createPersonalList(
          user.uid,
          firestoreUser.locale
        );
        setListId(newList.id);
        setLastUsedListId(newList.id);
        setIsInitializing(false);
      } catch (error) {
        setInitError(
          error instanceof Error ? error : new Error('Failed to initialize list')
        );
        setIsInitializing(false);
      }
    }

    initializeList();
  }, [user?.uid, firestoreUser, getLastUsedListId, setLastUsedListId]);

  // Determine status subtitle
  const getStatusSubtitle = useCallback((): string | undefined => {
    // Priority: Offline > Sync pending
    if (!isConnected) return 'Offline';
    if (hasPendingWrites) return 'Syncing...';
    return undefined;
  }, [isConnected, hasPendingWrites]);

  // Handle add item
  const handleAddItem = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || !listId || !user?.uid) return;

    // Check item limit
    const count = await getItemCount(listId);
    if (count >= MAX_ITEMS_PER_LIST) {
      // Could show a toast here, for now just return
      return;
    }

    setInputValue('');
    markWritePending();

    try {
      await addItem(listId, text, user.uid);
    } catch (error) {
      // Restore input on error
      setInputValue(text);
    }
  }, [inputValue, listId, user?.uid, markWritePending]);

  // Handle check/uncheck
  const handleToggleChecked = useCallback(
    async (item: Item) => {
      if (!listId) return;
      markWritePending();
      try {
        await toggleItemChecked(listId, item.id);
      } catch {
        // Silent error handling - UI will reflect actual state
      }
    },
    [listId, markWritePending]
  );

  // Handle delete with undo
  const handleDeleteItem = useCallback(
    async (item: Item) => {
      if (!listId) return;

      // Close any open swipeable
      swipeableRefs.current.get(item.id)?.close();

      markWritePending();
      try {
        await softDeleteItem(listId, item.id);

        showUndoToast({
          message: 'Item deleted',
          onUndo: async () => {
            try {
              markWritePending();
              await undeleteItem(listId, item.id);
            } catch (error) {
              showError('Unable to undo delete. Please try again.', error);
            }
          },
        });
      } catch {
        showError('Unable to delete item. Please try again.');
      }
    },
    [listId, markWritePending, showUndoToast, showError]
  );

  // Handle clear checked
  const handleClearChecked = useCallback(async () => {
    if (!listId) return;

    const checkedItems = items.filter((item) => item.checked);
    if (checkedItems.length === 0) return;

    const itemIds = checkedItems.map((item) => item.id);
    setShowClearDialog(false);

    markWritePending();
    try {
      await bulkSoftDelete(listId, itemIds);

      showUndoToast({
        message: `${checkedItems.length} item${checkedItems.length > 1 ? 's' : ''} cleared`,
        onUndo: async () => {
          try {
            markWritePending();
            await bulkUndelete(listId, itemIds);
          } catch (error) {
            showError('Unable to undo clear. Please try again.', error);
          }
        },
      });
    } catch {
      showError('Unable to clear checked items. Please try again.');
    }
  }, [listId, items, markWritePending, showUndoToast, showError]);

  // Separate items into unchecked and checked
  const uncheckedItems = items.filter((item) => !item.checked);
  const checkedItems = items.filter((item) => item.checked);

  // Combine for display: unchecked first, then checked
  const displayItems = [...uncheckedItems, ...checkedItems];
  const checkedCount = checkedItems.length;

  // Overflow menu items
  const overflowMenuItems = [
    {
      label: `Clear checked${checkedCount > 0 ? ` (${checkedCount})` : ''}`,
      onPress: () => setShowClearDialog(true),
      destructive: true,
    },
  ];

  // Render delete action for swipe
  const renderRightActions = useCallback(() => {
    return (
      <XStack
        backgroundColor="$danger"
        justifyContent="center"
        alignItems="center"
        paddingHorizontal="$4"
      >
        <Text color="white" fontWeight="$2">
          Delete
        </Text>
      </XStack>
    );
  }, []);

  // Render item
  const renderItem = useCallback(
    ({ item }: ListRenderItemInfo<Item>) => {
      return (
        <Swipeable
          ref={(ref) => {
            if (ref) {
              swipeableRefs.current.set(item.id, ref);
            } else {
              swipeableRefs.current.delete(item.id);
            }
          }}
          renderRightActions={renderRightActions}
          onSwipeableOpen={() => handleDeleteItem(item)}
          friction={2}
          rightThreshold={40}
        >
          <ListRow
            text={item.text}
            checked={item.checked}
            onPress={() => handleToggleChecked(item)}
          />
        </Swipeable>
      );
    },
    [handleToggleChecked, handleDeleteItem, renderRightActions]
  );

  // Key extractor
  const keyExtractor = useCallback((item: Item) => item.id, []);
>>>>>>> fix: improve error handling and hook safety

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
