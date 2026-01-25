import { useEffect } from 'react';
import { Text, XStack } from 'tamagui';

export interface ToastProps {
  /** Toast message */
  message: string;
  /** Whether the toast is visible */
  visible: boolean;
  /** Called when toast should be dismissed */
  onDismiss: () => void;
  /** Optional undo action */
  onUndo?: () => void;
  /** Duration in ms (default: 5000) */
  duration?: number;
}

/**
 * Toast notification with optional undo action.
 * Auto-dismisses after 5 seconds.
 * Placement: above keyboard and TabBar.
 * Accessibility: announced as polite live region.
 */
export function Toast({
  message,
  visible,
  onDismiss,
  onUndo,
  duration = 5000,
}: ToastProps) {
  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, duration);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [visible, duration, onDismiss]);

  if (!visible) return null;

  return (
    <XStack
      position="absolute"
      bottom={100} // Above TabBar and keyboard
      left="$4"
      right="$4"
      backgroundColor="$surface"
      borderRadius="$1" // 12px
      paddingVertical="$3" // 12px
      paddingHorizontal="$4" // 16px
      alignItems="center"
      justifyContent="space-between"
      shadowColor="$text"
      shadowOffset={{ width: 0, height: 2 }}
      shadowOpacity={0.15}
      shadowRadius={8}
      elevation={4}
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      zIndex={1000}
    >
      <Text
        fontSize="$2" // 17px
        fontWeight="$1" // regular
        color="$text"
        flex={1}
      >
        {message}
      </Text>
      {onUndo && (
        <XStack
          onPress={() => {
            onUndo();
            onDismiss();
          }}
          pressStyle={{ opacity: 0.7 }}
          minHeight={44}
          minWidth={44}
          alignItems="center"
          justifyContent="center"
          marginLeft="$2"
          accessible
          accessibilityRole="button"
          accessibilityLabel="Undo"
          accessibilityHint="Double tap to undo the action"
        >
          <Text
            fontSize="$2" // 17px
            fontWeight="$2" // semibold
            color="$accent"
          >
            Undo
          </Text>
        </XStack>
      )}
    </XStack>
  );
}
