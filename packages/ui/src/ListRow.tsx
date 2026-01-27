import { Text, XStack, YStack } from 'tamagui';

export interface ListRowProps {
  /** Item text label */
  text: string;
  /** Whether the item is checked */
  checked: boolean;
  /** Called when the row is pressed to toggle checked state */
  onPress: () => void;
  /** Called when the row is long-pressed (e.g., for delete action) */
  onLongPress?: () => void;
  /** Whether this item should be highlighted (remote change indicator) */
  highlighted?: boolean;
}

/**
 * List item row with checkbox, text, and checked styling.
 * Core item row component for shopping list items.
 * Minimum touch target: 44px (actual height: 48px).
 *
 * When `highlighted` is true, shows a subtle background highlight
 * to indicate the item was recently changed by another user.
 */
export function ListRow({
  text,
  checked,
  onPress,
  onLongPress,
  highlighted = false,
}: ListRowProps) {
  return (
    <XStack
      minHeight={48}
      paddingHorizontal="$4" // 16px
      paddingVertical="$3" // 12px
      alignItems="center"
      gap="$3" // 12px gap between checkbox and text
      backgroundColor={highlighted ? '$surface' : 'transparent'}
      onPress={onPress}
      onLongPress={onLongPress}
      pressStyle={{ opacity: 0.7 }}
      accessible
      accessibilityRole="checkbox"
      accessibilityState={{ checked }}
      accessibilityLabel={`${text}, ${checked ? 'checked' : 'unchecked'}`}
    >
      {/* Checkbox */}
      <YStack
        width={24}
        height={24}
        borderRadius={12} // Circular
        borderWidth={2}
        borderColor={checked ? '$accent' : '$separator'}
        backgroundColor={checked ? '$accent' : 'transparent'}
        alignItems="center"
        justifyContent="center"
      >
        {checked && (
          <Text fontSize={14} color="$accentColor" fontWeight="$2">
            ✓
          </Text>
        )}
      </YStack>

      {/* Text */}
      <Text
        flex={1}
        fontSize="$2" // 17px
        fontWeight="$1" // regular
        color={checked ? '$textMuted' : '$text'}
        textDecorationLine={checked ? 'line-through' : 'none'}
        numberOfLines={2}
        ellipsizeMode="tail"
      >
        {text}
      </Text>
    </XStack>
  );
}
