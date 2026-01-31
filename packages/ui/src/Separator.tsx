import { YStack } from 'tamagui';

export interface SeparatorProps {
  /** Horizontal margin/inset from edges */
  inset?: number;
}

/**
 * Hairline divider/separator.
 * Uses the separator color from theme.
 */
export function Separator({ inset = 0 }: SeparatorProps) {
  return (
    <YStack height={0.5} backgroundColor="$separator" marginHorizontal={inset} accessible={false} />
  );
}
