import type { ReactNode } from 'react';
import { Text, XStack, YStack } from 'tamagui';

export interface TopBarProps {
  /** Main title text */
  title: string;
  /** Optional subtitle (e.g., "Offline", "Syncing") */
  subtitle?: string;
  /** Whether the title is tappable */
  onTitlePress?: () => void;
  /** Accessibility hint for tappable title (default: "Double tap to open list switcher") */
  titleAccessibilityHint?: string;
  /** Right-side action elements */
  rightActions?: ReactNode;
  /** Left-side action elements */
  leftActions?: ReactNode;
}

/**
 * Header component with title, optional subtitle, and action buttons.
 * Title is tappable when onTitlePress is provided.
 */
export function TopBar({
  title,
  subtitle,
  onTitlePress,
  titleAccessibilityHint = 'Double tap to open list switcher',
  rightActions,
  leftActions,
}: TopBarProps) {
  const titleContent = (
    <YStack alignItems="center" flex={1}>
      <Text
        fontSize="$3" // 20px
        fontWeight="$2" // semibold (600)
        color="$text"
        numberOfLines={1}
        accessible
        accessibilityRole="header"
      >
        {title}
      </Text>
      {subtitle && (
        <Text
          fontSize="$1" // 13px
          fontWeight="$1" // regular
          color="$textMuted"
          accessible
          accessibilityLiveRegion="polite"
        >
          {subtitle}
        </Text>
      )}
    </YStack>
  );

  return (
    <XStack
      height={44}
      alignItems="center"
      paddingHorizontal="$4" // 16px
      backgroundColor="$bg"
      accessible={false}
    >
      {/* Left actions */}
      <XStack minWidth={44} alignItems="center">
        {leftActions}
      </XStack>

      {/* Center title area */}
      {onTitlePress ? (
        <YStack
          flex={1}
          alignItems="center"
          onPress={onTitlePress}
          pressStyle={{ opacity: 0.7 }}
          accessible
          accessibilityRole="button"
          accessibilityLabel={`${title}${subtitle ? `, ${subtitle}` : ''}`}
          accessibilityHint={titleAccessibilityHint}
          minHeight={44}
          justifyContent="center"
        >
          <Text fontSize="$3" fontWeight="$2" color="$text" numberOfLines={1}>
            {title}
          </Text>
          {subtitle && (
            <Text
              fontSize="$1"
              fontWeight="$1"
              color="$textMuted"
              accessible
              accessibilityLiveRegion="polite"
            >
              {subtitle}
            </Text>
          )}
        </YStack>
      ) : (
        titleContent
      )}

      {/* Right actions */}
      <XStack minWidth={44} alignItems="center" justifyContent="flex-end">
        {rightActions}
      </XStack>
    </XStack>
  );
}
