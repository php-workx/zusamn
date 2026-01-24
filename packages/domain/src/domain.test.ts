import { describe, expect, it } from 'vitest';
import { listItemSchema, shoppingListSchema } from './schemas';

const now = new Date().toISOString();

describe('domain schemas', () => {
  it('validates list items', () => {
    const parsed = listItemSchema.parse({
      id: 'item_1',
      listId: 'list_1',
      title: 'Milk',
      quantity: '1 gallon',
      checked: false,
      createdAt: now,
      updatedAt: now,
    });

    expect(parsed.title).toBe('Milk');
  });

  it('validates shopping list metadata', () => {
    const parsed = shoppingListSchema.parse({
      id: 'list_1',
      name: 'Weekly',
      ownerUid: 'user_1',
      memberUids: ['user_1'],
      itemCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    expect(parsed.name).toBe('Weekly');
  });
});
