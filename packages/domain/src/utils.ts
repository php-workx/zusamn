import type { Item } from './types';

/**
 * Orders items according to spec:
 * - Unchecked items first, sorted by serverCreatedAt descending (newest first)
 * - Checked items at bottom, sorted by serverCreatedAt descending
 */
export function orderItems(items: Item[]): Item[] {
  const unchecked = items
    .filter((item) => !item.checked)
    .sort((a, b) => b.serverCreatedAt - a.serverCreatedAt);

  const checked = items
    .filter((item) => item.checked)
    .sort((a, b) => b.serverCreatedAt - a.serverCreatedAt);

  return [...unchecked, ...checked];
}
