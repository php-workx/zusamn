import type { ReactNode } from 'react';
import { Text, XStack, YStack } from 'tamagui';

export interface TabBarItemProps {
  /** Tab label */
  label: string;
  /** Whether this tab is currently active */
  active?: boolean;
  /** Icon to display above the label */
  icon?: ReactNode;
  /** Called when tab is pressed */
  onPress?: () => void;
}

export interface TabBarProps {
  /** Tab items to render */
  children: ReactNode;
}

/**
 * Individual tab item for TabBar.
 * Minimum touch target of 44px.
 */
export function TabBarItem({
  label,
  active = false,
  icon,
  onPress,
}: TabBarItemProps) {
  return (
    <YStack
      flex={1}
      alignItems="center"
      justifyContent="center"
      minHeight={44}
      onPress={onPress}
      pressStyle={{ opacity: 0.7 }}
      accessible
      accessibilityRole="tab"
      accessibilityState={{ selected: active }}
      accessibilityLabel={label}
    >
      {icon && (
        <YStack marginBottom="$1">
          {icon}
        </YStack>
      )}
      <Text
        fontSize="$1" // 13px
        fontWeight={active ? '$2' : '$1'} // semibold when active
        color={active ? '$accent' : '$textMuted'}
      >
        {label}
      </Text>
    </YStack>
  );
}

/**
 * Bottom tab bar container.
 * Note: For Expo Router, you may need to use their tab navigator
 * and style it with these tokens. This component provides the visual styling.
 */
export function TabBar({ children }: TabBarProps) {
  return (
    <XStack
      backgroundColor="$surface"
      borderTopWidth={0.5}
      borderTopColor="$separator"
      paddingBottom="$4" // safe area padding
      minHeight={49}
      accessible
      accessibilityRole="tablist"
    >
      {children}
    </XStack>
  );
}
