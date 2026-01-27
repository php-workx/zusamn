import type { ReactNode } from 'react';
import { Text, XStack } from 'tamagui';

export interface GhostButtonProps {
  /** Button label */
  children: ReactNode;
  /** Called when button is pressed */
  onPress?: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Accessibility label override */
  accessibilityLabel?: string;
  /** Whether to use danger color (for destructive actions) */
  danger?: boolean;
}

/**
 * Secondary/ghost button with transparent background.
 * Used for secondary actions.
 * Minimum touch target: 44px.
 */
export function GhostButton({
  children,
  onPress,
  disabled = false,
  accessibilityLabel,
  danger = false,
}: GhostButtonProps) {
  return (
    <XStack
      backgroundColor="transparent"
      borderRadius="$1" // 12px
      minHeight={44}
      paddingHorizontal="$4" // 16px
      alignItems="center"
      justifyContent="center"
      onPress={disabled ? undefined : onPress}
      pressStyle={disabled ? undefined : { opacity: 0.6 }}
      opacity={disabled ? 0.5 : 1}
      accessible
      accessibilityRole="button"
      accessibilityLabel={
        accessibilityLabel || (typeof children === 'string' ? children : undefined)
      }
      accessibilityState={{ disabled }}
    >
      <Text
        fontSize="$2" // 17px
        fontWeight="$1" // regular
        color={danger ? '$danger' : '$accent'}
      >
        {children}
      </Text>
    </XStack>
  );
}
