import type { ReactNode } from 'react';
import { Text, XStack, YStack } from 'tamagui';

export interface SheetModalProps {
  /** Whether the sheet is visible */
  visible: boolean;
  /** Called when the sheet should be closed */
  onClose: () => void;
  /** Sheet title */
  title?: string;
  /** Sheet content */
  children: ReactNode;
}

/**
 * Bottom sheet modal wrapper.
 * Used for: List switcher, Share flow, Rename alias, Share-disabled explanation.
 * Sheet radius: 16px, padding: 16px.
 */
export function SheetModal({ visible, onClose, title, children }: SheetModalProps) {
  if (!visible) return null;

  return (
    <YStack
      position="absolute"
      top={0}
      left={0}
      right={0}
      bottom={0}
      zIndex={1500}
      accessible={false}
    >
      {/* Backdrop */}
      <YStack
        position="absolute"
        top={0}
        left={0}
        right={0}
        bottom={0}
        backgroundColor="rgba(0,0,0,0.4)"
        onPress={onClose}
        accessible
        accessibilityRole="button"
        accessibilityLabel="Close sheet"
      />

      {/* Sheet */}
      <YStack
        position="absolute"
        left={0}
        right={0}
        bottom={0}
        backgroundColor="$bg"
        borderTopLeftRadius="$2" // 16px
        borderTopRightRadius="$2" // 16px
        padding="$4" // 16px
        paddingBottom="$7" // Extra padding for safe area
        accessible
        accessibilityRole="none"
        accessibilityLabel={title || 'Sheet'}
      >
        {/* Handle */}
        <XStack justifyContent="center" marginBottom="$3">
          <YStack width={36} height={4} backgroundColor="$separator" borderRadius={2} />
        </XStack>

        {/* Title */}
        {title && (
          <Text
            fontSize="$3" // 20px
            fontWeight="$2" // semibold
            color="$text"
            textAlign="center"
            marginBottom="$4"
            accessible
            accessibilityRole="header"
          >
            {title}
          </Text>
        )}

        {/* Content */}
        {children}
      </YStack>
    </YStack>
  );
}
