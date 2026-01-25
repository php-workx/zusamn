import { useCallback, useRef } from 'react';
import { Pressable } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { ListRow, Text, XStack } from '@zusamn/ui';
import type { Item } from '@zusamn/domain';

export interface SwipeableListRowProps {
  item: Item;
  onToggleChecked: (item: Item) => void;
  onDelete: (item: Item) => void;
}

/**
 * ListRow with swipe-left delete gesture and long-press delete.
 * Per spec: swipe-left OR long-press both trigger delete.
 */
export function SwipeableListRow({
  item,
  onToggleChecked,
  onDelete,
}: SwipeableListRowProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const handleSwipeOpen = useCallback(() => {
    swipeableRef.current?.close();
    onDelete(item);
  }, [item, onDelete]);

  const handleLongPress = useCallback(() => {
    onDelete(item);
  }, [item, onDelete]);

  const handlePress = useCallback(() => {
    onToggleChecked(item);
  }, [item, onToggleChecked]);

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

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      onSwipeableOpen={handleSwipeOpen}
      friction={2}
      rightThreshold={40}
    >
      <Pressable onPress={handlePress} onLongPress={handleLongPress} delayLongPress={500}>
        <ListRow text={item.text} checked={item.checked} onPress={handlePress} />
      </Pressable>
    </Swipeable>
  );
}
