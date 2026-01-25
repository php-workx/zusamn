import { useMemo } from 'react';
import type { Item } from '@zusamn/domain';

/**
 * Hook for ordering items according to spec:
 * - Unchecked items first, sorted by serverCreatedAt descending (newest first)
 * - Checked items at bottom, sorted by serverCreatedAt descending
 */
export function useItemOrdering(items: Item[]): Item[] {
  return useMemo(() => {
    const unchecked = items
      .filter((item) => !item.checked)
      .sort((a, b) => b.serverCreatedAt - a.serverCreatedAt);

    const checked = items
      .filter((item) => item.checked)
      .sort((a, b) => b.serverCreatedAt - a.serverCreatedAt);

    return [...unchecked, ...checked];
  }, [items]);
}
