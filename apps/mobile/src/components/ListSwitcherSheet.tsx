import { useCallback } from 'react';
import { FlatList, type ListRenderItemInfo } from 'react-native';
import { SheetModal, Text, XStack, YStack, Separator } from '@zusamn/ui';
import { useUserLists, type UserListItem } from '@zusamn/firebase';
import type { List } from '@zusamn/domain';

export interface ListSwitcherSheetProps {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Called when the sheet should be closed */
  onClose: () => void;
  /** The currently logged-in user's ID */
  userId: string;
  /** The currently selected list ID */
  currentListId: string | null;
  /** Called when user selects a list */
  onSelectList: (list: List) => void;
  /** Called when user wants to rename a list's alias */
  onRenameAlias?: (list: List, currentAlias: string) => void;
}

/**
 * List switcher bottom sheet.
 * Shows user's personal list first, then shared lists alphabetically.
 * Shared lists display a "shared" indicator icon.
 */
export function ListSwitcherSheet({
  visible,
  onClose,
  userId,
  currentListId,
  onSelectList,
  onRenameAlias,
}: ListSwitcherSheetProps) {
  const { lists, isLoading } = useUserLists(visible ? userId : undefined);

  const handleSelectList = useCallback(
    (item: UserListItem) => {
      onSelectList(item.list);
      onClose();
    },
    [onSelectList, onClose]
  );

  const handleLongPress = useCallback(
    (item: UserListItem) => {
      if (onRenameAlias) {
        onRenameAlias(item.list, item.membership.alias);
      }
    },
    [onRenameAlias]
  );

  const renderItem = useCallback(
    ({ item, index }: ListRenderItemInfo<UserListItem>) => {
      const isPersonal = item.list.ownerUserId === userId;
      const isSelected = item.list.id === currentListId;

      return (
        <>
          {index > 0 && <Separator />}
          <XStack
            paddingVertical="$3"
            paddingHorizontal="$2"
            alignItems="center"
            minHeight={48}
            backgroundColor={isSelected ? '$surface' : 'transparent'}
            borderRadius="$1"
            onPress={() => handleSelectList(item)}
            onLongPress={() => handleLongPress(item)}
            pressStyle={{ opacity: 0.7 }}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${item.membership.alias}${isPersonal ? '' : ', shared list'}${isSelected ? ', currently selected' : ''}`}
            accessibilityHint="Double tap to switch to this list. Long press to rename."
          >
            {/* List name */}
            <YStack flex={1}>
              <Text
                fontSize="$2"
                fontWeight={isSelected ? '$2' : '$1'}
                color="$text"
                numberOfLines={1}
              >
                {item.membership.alias}
              </Text>
            </YStack>

            {/* Shared indicator */}
            {!isPersonal && (
              <XStack
                marginLeft="$2"
                paddingHorizontal="$2"
                paddingVertical="$1"
                backgroundColor="$separator"
                borderRadius={4}
              >
                <Text fontSize={11} color="$textMuted">
                  shared
                </Text>
              </XStack>
            )}

            {/* Selection indicator */}
            {isSelected && (
              <Text fontSize="$2" color="$accent" marginLeft="$2" accessible={false}>
                ✓
              </Text>
            )}
          </XStack>
        </>
      );
    },
    [userId, currentListId, handleSelectList, handleLongPress]
  );

  const keyExtractor = useCallback((item: UserListItem) => item.list.id, []);

  return (
    <SheetModal visible={visible} onClose={onClose} title="Switch List">
      {isLoading ? (
        <YStack padding="$4" alignItems="center">
          <Text color="$textMuted">Loading lists...</Text>
        </YStack>
      ) : lists.length === 0 ? (
        <YStack padding="$4" alignItems="center">
          <Text color="$textMuted">No lists found</Text>
        </YStack>
      ) : (
        <FlatList
          data={lists}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          scrollEnabled={lists.length > 6}
          style={{ maxHeight: 400 }}
        />
      )}
    </SheetModal>
  );
}
