import { Text, XStack, YStack } from 'tamagui';

export interface ConfirmDialogAction {
  /** Action label */
  label: string;
  /** Called when action is pressed */
  onPress: () => void;
  /** Whether this is a destructive action */
  destructive?: boolean;
}

export interface ConfirmDialogProps {
  /** Dialog title/message */
  title: string;
  /** Optional description */
  description?: string;
  /** Whether the dialog is visible */
  visible: boolean;
  /** Cancel action */
  onCancel: () => void;
  /** Confirm action */
  onConfirm: () => void;
  /** Label for cancel button (default: "Cancel") */
  cancelLabel?: string;
  /** Label for confirm button (default: "Confirm") */
  confirmLabel?: string;
  /** Whether confirm action is destructive */
  destructive?: boolean;
}

/**
 * Confirmation dialog for destructive actions.
 * iOS: Should use native ActionSheet (bottom sheet with destructive red action)
 * Android: Should use native Alert Dialog
 *
 * This is a simple React implementation. For native behavior, use:
 * - iOS: Alert.alert() with ActionSheetIOS
 * - Android: Alert.alert()
 */
export function ConfirmDialog({
  title,
  description,
  visible,
  onCancel,
  onConfirm,
  cancelLabel = 'Cancel',
  confirmLabel = 'Confirm',
  destructive = false,
}: ConfirmDialogProps) {
  if (!visible) return null;

  return (
    <YStack
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      backgroundColor="rgba(0,0,0,0.4)"
      justifyContent="center"
      alignItems="center"
      zIndex={2000}
      accessible={false}
    >
      <YStack
        backgroundColor="$bg"
        borderRadius="$2" // 16px
        padding="$4" // 16px
        marginHorizontal="$4"
        maxWidth={320}
        width="100%"
        accessible
        accessibilityRole="alert"
        accessibilityLiveRegion="assertive"
      >
        <Text
          fontSize="$2" // 17px
          fontWeight="$2" // semibold
          color="$text"
          textAlign="center"
          marginBottom={description ? '$2' : '$4'}
        >
          {title}
        </Text>
        {description && (
          <Text
            fontSize="$1" // 13px
            fontWeight="$1" // regular
            color="$textMuted"
            textAlign="center"
            marginBottom="$4"
          >
            {description}
          </Text>
        )}
        <XStack gap="$2" justifyContent="center">
          <XStack
            flex={1}
            backgroundColor="$surface"
            borderRadius="$1" // 12px
            minHeight={44}
            alignItems="center"
            justifyContent="center"
            onPress={onCancel}
            pressStyle={{ opacity: 0.7 }}
            accessible
            accessibilityRole="button"
            accessibilityLabel={cancelLabel}
          >
            <Text
              fontSize="$2" // 17px
              fontWeight="$1" // regular
              color="$accent"
            >
              {cancelLabel}
            </Text>
          </XStack>
          <XStack
            flex={1}
            backgroundColor={destructive ? '$danger' : '$accent'}
            borderRadius="$1" // 12px
            minHeight={44}
            alignItems="center"
            justifyContent="center"
            onPress={onConfirm}
            pressStyle={{ opacity: 0.7 }}
            accessible
            accessibilityRole="button"
            accessibilityLabel={confirmLabel}
          >
            <Text
              fontSize="$2" // 17px
              fontWeight="$2" // semibold
              color="$accentColor"
            >
              {confirmLabel}
            </Text>
          </XStack>
        </XStack>
      </YStack>
    </YStack>
  );
}
