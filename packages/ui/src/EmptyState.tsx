import { Text, YStack } from 'tamagui';

export interface EmptyStateProps {
  /** Primary message to display */
  message: string;
  /** Optional secondary/helper text */
  description?: string;
}

/**
 * Empty list placeholder with calm guidance.
 * Example: "Add your first item..."
 */
export function EmptyState({ message, description }: EmptyStateProps) {
  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      padding="$4"
      accessible
      accessibilityRole="text"
    >
      <Text
        fontSize="$2" // 17px
        fontWeight="$1" // regular
        color="$textMuted"
        textAlign="center"
        marginBottom={description ? '$2' : 0}
      >
        {message}
      </Text>
      {description && (
        <Text
          fontSize="$1" // 13px
          fontWeight="$1" // regular
          color="$textMuted"
          textAlign="center"
        >
          {description}
        </Text>
      )}
    </YStack>
  );
}
