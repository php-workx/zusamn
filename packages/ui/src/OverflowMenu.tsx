import { useState } from 'react';
import { Text, XStack, YStack } from 'tamagui';

export interface OverflowMenuItem {
  /** Optional unique identifier for stable React keys */
  id?: string;
  /** Menu item label */
  label: string;
  /** Called when item is pressed */
  onPress: () => void;
  /** Whether this is a destructive action (shows in danger color) */
  destructive?: boolean;
}

export interface OverflowMenuProps {
  /** Menu items to display */
  items: OverflowMenuItem[];
}

/**
 * TopBar overflow menu ("...") component.
 * Opens a simple popover menu with action items.
 * Minimum touch target: 44px.
 */
export function OverflowMenu({ items }: OverflowMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleItemPress = (item: OverflowMenuItem) => {
    setIsOpen(false);
    item.onPress();
  };

  return (
    <YStack>
      {/* Trigger button */}
      <XStack
        minWidth={44}
        minHeight={44}
        alignItems="center"
        justifyContent="center"
        onPress={() => setIsOpen(!isOpen)}
        pressStyle={{ opacity: 0.6 }}
        accessible
        accessibilityRole="button"
        accessibilityLabel="More options"
        accessibilityState={{ expanded: isOpen }}
      >
        <Text
          fontSize="$2" // 17px
          fontWeight="$2" // semibold
          color="$accent"
          letterSpacing={2}
        >
          •••
        </Text>
      </XStack>

      {/* Menu popover */}
      {isOpen && (
        <>
          {/* Backdrop to close menu */}
          <YStack
            position="absolute"
            top={-1000}
            left={-1000}
            right={-1000}
            bottom={-1000}
            zIndex={1000}
            onPress={() => setIsOpen(false)}
          />

          {/* Menu */}
          <YStack
            position="absolute"
            top={44}
            right={0}
            minWidth={180}
            backgroundColor="$surface"
            borderRadius="$1" // 12px
            borderWidth={0.5}
            borderColor="$separator"
            zIndex={1001}
            overflow="hidden"
            shadowColor="$black"
            shadowOffset={{ width: 0, height: 2 }}
            shadowOpacity={0.15}
            shadowRadius={8}
            elevation={4}
          >
            {items.map((item, index) => (
              <XStack
                key={item.id ?? `${index}-${item.label}`}
                minHeight={44}
                paddingHorizontal="$4" // 16px
                alignItems="center"
                onPress={() => handleItemPress(item)}
                pressStyle={{ backgroundColor: '$separator' }}
                borderBottomWidth={index < items.length - 1 ? 0.5 : 0}
                borderBottomColor="$separator"
                accessible
                accessibilityRole="menuitem"
                accessibilityLabel={item.label}
              >
                <Text
                  fontSize="$2" // 17px
                  fontWeight="$1" // regular
                  color={item.destructive ? '$danger' : '$text'}
                >
                  {item.label}
                </Text>
              </XStack>
            ))}
          </YStack>
        </>
      )}
    </YStack>
  );
}
