import type { ReactNode } from 'react';
import { YStack } from 'tamagui';

export interface ScreenProps {
  children: ReactNode;
  /** Whether to include safe area padding (default: true) */
  safeArea?: boolean;
}

/**
 * Screen wrapper providing consistent padding, background, and safe area behavior.
 * Use this as the root container for all screens.
 */
export function Screen({ children, safeArea = true }: ScreenProps) {
  return (
    <YStack
      flex={1}
      backgroundColor="$bg"
      paddingHorizontal="$4" // 16px screen padding
      paddingTop={safeArea ? '$6' : '$4'} // safe area approximation
      paddingBottom={safeArea ? '$6' : '$4'}
      accessible={false}
    >
      {children}
    </YStack>
  );
}
