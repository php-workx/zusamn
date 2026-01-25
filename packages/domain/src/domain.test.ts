import { describe, expect, it } from 'vitest';
import {
  inviteSchema,
  itemSchema,
  listSchema,
  localeSchema,
  membershipSchema,
  userSchema,
} from './schemas';
import { isValidAlias, isValidLocale, isValidText, validateItemText } from './validators';
import {
  MAX_LISTS_PER_USER,
  MAX_ITEMS_PER_LIST,
  MAX_INVITE_MEMBERS,
  MAX_TEXT_LENGTH,
  MAX_ALIAS_LENGTH,
  SUPPORTED_LOCALES,
  LIMITS,
} from './constants';
import { orderItems } from './utils';
import type { Item } from './types';

const now = Date.now();

describe('domain schemas', () => {
  describe('userSchema', () => {
    it('validates a valid user', () => {
      const parsed = userSchema.parse({
        id: 'user_1',
        displayName: 'John Doe',
        email: 'john@example.com',
        avatarUrl: 'https://example.com/avatar.jpg',
        locale: 'en',
        createdAt: now,
      });

      expect(parsed.displayName).toBe('John Doe');
      expect(parsed.locale).toBe('en');
    });

    it('validates user with deletedAt', () => {
      const parsed = userSchema.parse({
        id: 'user_1',
        displayName: 'John Doe',
        email: 'john@example.com',
        locale: 'de',
        createdAt: now,
        deletedAt: now + 1000,
      });

      expect(parsed.deletedAt).toBe(now + 1000);
    });
  });

  describe('listSchema', () => {
    it('validates a valid list', () => {
      const parsed = listSchema.parse({
        id: 'list_1',
        ownerUserId: 'user_1',
        memberIds: ['user_1', 'user_2'],
        createdAt: now,
      });

      expect(parsed.ownerUserId).toBe('user_1');
      expect(parsed.memberIds).toHaveLength(2);
    });
  });

  describe('membershipSchema', () => {
    it('validates a valid membership', () => {
      const parsed = membershipSchema.parse({
        userId: 'user_1',
        listId: 'list_1',
        alias: 'Family List',
        joinedAt: now,
      });

      expect(parsed.alias).toBe('Family List');
    });

    it('rejects alias over 50 characters', () => {
      expect(() =>
        membershipSchema.parse({
          userId: 'user_1',
          listId: 'list_1',
          alias: 'a'.repeat(51),
          joinedAt: now,
        })
      ).toThrow();
    });
  });

  describe('itemSchema', () => {
    it('validates a valid item', () => {
      const parsed = itemSchema.parse({
        id: 'item_1',
        listId: 'list_1',
        text: 'Milk',
        checked: false,
        deleted: false,
        createdByUserId: 'user_1',
        serverCreatedAt: now,
        serverUpdatedAt: now,
      });

      expect(parsed.text).toBe('Milk');
    });

    it('rejects text over 100 characters', () => {
      expect(() =>
        itemSchema.parse({
          id: 'item_1',
          listId: 'list_1',
          text: 'a'.repeat(101),
          checked: false,
          deleted: false,
          createdByUserId: 'user_1',
          serverCreatedAt: now,
          serverUpdatedAt: now,
        })
      ).toThrow();
    });
  });

  describe('inviteSchema', () => {
    it('validates a valid invite', () => {
      const parsed = inviteSchema.parse({
        id: 'invite_1',
        listId: 'list_1',
        inviteAlias: 'Join my list',
        createdByUserId: 'user_1',
        createdAt: now,
        expiresAt: now + 86400000,
      });

      expect(parsed.inviteAlias).toBe('Join my list');
    });

    it('validates used invite', () => {
      const parsed = inviteSchema.parse({
        id: 'invite_1',
        listId: 'list_1',
        inviteAlias: 'Join my list',
        createdByUserId: 'user_1',
        createdAt: now,
        expiresAt: now + 86400000,
        usedBy: 'user_2',
        usedAt: now + 1000,
      });

      expect(parsed.usedBy).toBe('user_2');
    });
  });

  describe('localeSchema', () => {
    it('accepts de', () => {
      expect(localeSchema.parse('de')).toBe('de');
    });

    it('accepts en', () => {
      expect(localeSchema.parse('en')).toBe('en');
    });

    it('rejects invalid locale', () => {
      expect(() => localeSchema.parse('fr')).toThrow();
    });
  });
});

describe('validators', () => {
  describe('isValidText', () => {
    it('returns true for valid text', () => {
      expect(isValidText('Milk')).toBe(true);
      expect(isValidText('a'.repeat(100))).toBe(true);
    });

    it('returns false for empty text', () => {
      expect(isValidText('')).toBe(false);
    });

    it('returns false for whitespace-only text', () => {
      expect(isValidText('   ')).toBe(false);
      expect(isValidText('\t\n')).toBe(false);
    });

    it('returns false for text over 100 characters', () => {
      expect(isValidText('a'.repeat(101))).toBe(false);
    });

    it('returns false for non-string input', () => {
      expect(isValidText(null as unknown as string)).toBe(false);
      expect(isValidText(undefined as unknown as string)).toBe(false);
      expect(isValidText(123 as unknown as string)).toBe(false);
    });
  });

  describe('validateItemText', () => {
    it('returns valid for valid text', () => {
      expect(validateItemText('Milk')).toEqual({ valid: true });
      expect(validateItemText('a'.repeat(100))).toEqual({ valid: true });
    });

    it('returns error for non-string input', () => {
      const result = validateItemText(null as unknown as string);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Item text must be a string');
    });

    it('returns error for empty text', () => {
      const result = validateItemText('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Item text cannot be empty');
    });

    it('returns error for whitespace-only text', () => {
      const result = validateItemText('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Item text cannot be empty');
    });

    it('returns error for text over 100 characters', () => {
      const result = validateItemText('a'.repeat(101));
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Item text exceeds maximum length of 100 characters');
    });
  });

  describe('isValidAlias', () => {
    it('returns true for valid alias', () => {
      expect(isValidAlias('Family List')).toBe(true);
      expect(isValidAlias('a'.repeat(50))).toBe(true);
    });

    it('returns false for empty alias', () => {
      expect(isValidAlias('')).toBe(false);
    });

    it('returns false for whitespace-only alias', () => {
      expect(isValidAlias(' ')).toBe(false);
      expect(isValidAlias('   ')).toBe(false);
    });

    it('returns false for alias over 50 characters', () => {
      expect(isValidAlias('a'.repeat(51))).toBe(false);
    });
  });

  describe('isValidLocale', () => {
    it('returns true for de', () => {
      expect(isValidLocale('de')).toBe(true);
    });

    it('returns true for en', () => {
      expect(isValidLocale('en')).toBe(true);
    });

    it('returns false for invalid locale', () => {
      expect(isValidLocale('fr')).toBe(false);
      expect(isValidLocale('')).toBe(false);
    });
  });
});

describe('constants', () => {
  it('has correct limit values', () => {
    expect(MAX_LISTS_PER_USER).toBe(5);
    expect(MAX_ITEMS_PER_LIST).toBe(200);
    expect(MAX_INVITE_MEMBERS).toBe(10);
    expect(MAX_TEXT_LENGTH).toBe(100);
    expect(MAX_ALIAS_LENGTH).toBe(50);
  });

  it('has correct supported locales', () => {
    expect(SUPPORTED_LOCALES).toEqual(['de', 'en']);
  });

  it('LIMITS object matches individual constants', () => {
    expect(LIMITS.LISTS_PER_USER_MAX).toBe(MAX_LISTS_PER_USER);
    expect(LIMITS.ITEMS_PER_LIST_MAX).toBe(MAX_ITEMS_PER_LIST);
    expect(LIMITS.INVITE_MEMBERS_MAX).toBe(MAX_INVITE_MEMBERS);
    expect(LIMITS.ITEM_TEXT_MAX).toBe(MAX_TEXT_LENGTH);
    expect(LIMITS.ALIAS_MAX).toBe(MAX_ALIAS_LENGTH);
  });
});

// Helper to create test items with deterministic defaults
function createItem(overrides: Partial<Item> = {}): Item {
  const defaultTimestamp = 1000000;
  return {
    id: 'item-1',
    listId: 'list-1',
    text: 'Test item',
    checked: false,
    deleted: false,
    createdByUserId: 'user-1',
    serverCreatedAt: defaultTimestamp,
    serverUpdatedAt: defaultTimestamp,
    ...overrides,
  };
}

describe('utils', () => {
  describe('orderItems', () => {
    it('returns empty array for empty input', () => {
      expect(orderItems([])).toEqual([]);
    });

    it('returns unchecked items before checked items', () => {
      const items: Item[] = [
        createItem({ id: '1', checked: true, serverCreatedAt: 1000 }),
        createItem({ id: '2', checked: false, serverCreatedAt: 2000 }),
        createItem({ id: '3', checked: true, serverCreatedAt: 3000 }),
        createItem({ id: '4', checked: false, serverCreatedAt: 4000 }),
      ];

      const result = orderItems(items);

      // Unchecked items should be first (4, 2), then checked (3, 1)
      expect(result.map((i) => i.id)).toEqual(['4', '2', '3', '1']);
    });

    it('sorts unchecked items by serverCreatedAt descending (newest first)', () => {
      const items: Item[] = [
        createItem({ id: '1', checked: false, serverCreatedAt: 1000 }),
        createItem({ id: '2', checked: false, serverCreatedAt: 3000 }),
        createItem({ id: '3', checked: false, serverCreatedAt: 2000 }),
      ];

      const result = orderItems(items);

      expect(result.map((i) => i.id)).toEqual(['2', '3', '1']);
    });

    it('sorts checked items by serverCreatedAt descending', () => {
      const items: Item[] = [
        createItem({ id: '1', checked: true, serverCreatedAt: 1000 }),
        createItem({ id: '2', checked: true, serverCreatedAt: 3000 }),
        createItem({ id: '3', checked: true, serverCreatedAt: 2000 }),
      ];

      const result = orderItems(items);

      expect(result.map((i) => i.id)).toEqual(['2', '3', '1']);
    });

    it('handles single unchecked item', () => {
      const items: Item[] = [createItem({ id: '1', checked: false })];

      const result = orderItems(items);

      expect(result.map((i) => i.id)).toEqual(['1']);
    });

    it('handles single checked item', () => {
      const items: Item[] = [createItem({ id: '1', checked: true })];

      const result = orderItems(items);

      expect(result.map((i) => i.id)).toEqual(['1']);
    });

    it('handles all unchecked items', () => {
      const items: Item[] = [
        createItem({ id: '1', checked: false, serverCreatedAt: 1000 }),
        createItem({ id: '2', checked: false, serverCreatedAt: 2000 }),
      ];

      const result = orderItems(items);

      expect(result.map((i) => i.id)).toEqual(['2', '1']);
    });

    it('handles all checked items', () => {
      const items: Item[] = [
        createItem({ id: '1', checked: true, serverCreatedAt: 1000 }),
        createItem({ id: '2', checked: true, serverCreatedAt: 2000 }),
      ];

      const result = orderItems(items);

      expect(result.map((i) => i.id)).toEqual(['2', '1']);
    });
  });
});
