import type { ReactNode } from 'react';
import { Text, XStack } from 'tamagui';

export interface PrimaryButtonProps {
  /** Button label */
  children: ReactNode;
  /** Called when button is pressed */
  onPress?: () => void;
  /** Whether the button is disabled */
  disabled?: boolean;
  /** Accessibility label override */
  accessibilityLabel?: string;
  /** Whether the button is in a loading state */
  loading?: boolean;
}

/**
 * Primary action button with accent background.
 * Used for commit actions: Share, Join, Save.
 * Minimum touch target: 44px.
 */
export function PrimaryButton({
  children,
  onPress,
  disabled = false,
  accessibilityLabel,
  loading = false,
}: PrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <XStack
      backgroundColor={isDisabled ? '$separator' : '$accent'}
      borderRadius="$1" // 12px
      minHeight={44}
      paddingHorizontal="$4" // 16px
      alignItems="center"
      justifyContent="center"
      onPress={isDisabled ? undefined : onPress}
      pressStyle={isDisabled ? undefined : { opacity: 0.8 }}
      opacity={isDisabled ? 0.5 : 1}
      accessible
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || (typeof children === 'string' ? children : undefined)}
      accessibilityState={{ disabled: isDisabled }}
    >
      <Text
        fontSize="$2" // 17px
        fontWeight="$2" // semibold
        color="$accentColor"
      >
        {loading ? 'Loading...' : children}
      </Text>
    </XStack>
  );
}
