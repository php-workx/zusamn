import { useMemo } from 'react';
import { orderItems, type Item } from '@zusamn/domain';

/**
 * Hook for ordering items according to spec.
 * Uses orderItems utility from domain for the actual ordering logic.
 */
export function useItemOrdering(items: Item[]): Item[] {
  return useMemo(() => orderItems(items), [items]);
}
