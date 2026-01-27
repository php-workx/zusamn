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

const now = Date.now();

describe('domain schemas', () => {
  describe('userSchema', () => {
    it('FR-AUTH-003: validates a valid user', () => {
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

    it('FR-ACCT-005: validates user with deletedAt', () => {
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
    it('FR-AUTH-003: validates a valid list', () => {
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
    it('FR-SWITCH-007: validates a valid membership', () => {
      const parsed = membershipSchema.parse({
        userId: 'user_1',
        listId: 'list_1',
        alias: 'Family List',
        joinedAt: now,
      });

      expect(parsed.alias).toBe('Family List');
    });

    it('FR-SWITCH-009: rejects alias over 50 characters', () => {
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
    it('FR-LIST-003: validates a valid item', () => {
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

    it('FR-LIST-022: rejects text over 100 characters', () => {
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
    it('FR-SHARE-003: validates a valid invite', () => {
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

    it('FR-SHARE-006: validates used invite', () => {
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
    it('FR-AUTH-004: accepts de', () => {
      expect(localeSchema.parse('de')).toBe('de');
    });

    it('FR-AUTH-004: accepts en', () => {
      expect(localeSchema.parse('en')).toBe('en');
    });

    it('rejects invalid locale', () => {
      expect(() => localeSchema.parse('fr')).toThrow();
    });
  });
});

describe('validators', () => {
  describe('validateItemText', () => {
    it('FR-LIST-003: returns valid for normal text', () => {
      const result = validateItemText('Milk');
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('FR-LIST-022: returns valid for max length text', () => {
      const result = validateItemText('a'.repeat(100));
      expect(result.valid).toBe(true);
    });

    it('returns error for non-string input', () => {
      // @ts-expect-error Testing runtime validation
      const result = validateItemText(123);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Item text must be a string');
    });

    it('returns error for null input', () => {
      // @ts-expect-error Testing runtime validation
      const result = validateItemText(null);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Item text must be a string');
    });

    it('FR-LIST-003: returns error for empty string', () => {
      const result = validateItemText('');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Item text cannot be empty');
    });

    it('FR-LIST-003: returns error for whitespace-only string', () => {
      const result = validateItemText('   ');
      expect(result.valid).toBe(false);
      expect(result.error).toBe('Item text cannot be empty');
    });

    it('FR-LIST-022: returns error for text over max length', () => {
      const result = validateItemText('a'.repeat(101));
      expect(result.valid).toBe(false);
      expect(result.error).toContain('exceeds maximum length');
    });
  });

  describe('isValidText', () => {
    it('FR-LIST-003, FR-LIST-022: returns true for valid text', () => {
      expect(isValidText('Milk')).toBe(true);
      expect(isValidText('a'.repeat(100))).toBe(true);
    });

    it('FR-LIST-003: returns false for empty text', () => {
      expect(isValidText('')).toBe(false);
    });

    it('FR-LIST-003: returns false for whitespace-only text', () => {
      expect(isValidText('   ')).toBe(false);
    });

    it('FR-LIST-022: returns false for text over 100 characters', () => {
      expect(isValidText('a'.repeat(101))).toBe(false);
    });
  });

  describe('isValidAlias', () => {
    it('FR-SWITCH-009: returns true for valid alias', () => {
      expect(isValidAlias('Family List')).toBe(true);
      expect(isValidAlias('a'.repeat(50))).toBe(true);
    });

    it('FR-SWITCH-009: returns false for empty alias', () => {
      expect(isValidAlias('')).toBe(false);
    });

    it('FR-SWITCH-009: returns false for alias over 50 characters', () => {
      expect(isValidAlias('a'.repeat(51))).toBe(false);
    });

    it('FR-SWITCH-009: returns false for non-string input', () => {
      // @ts-expect-error Testing runtime validation
      expect(isValidAlias(123)).toBe(false);
      // @ts-expect-error Testing runtime validation
      expect(isValidAlias(null)).toBe(false);
      // @ts-expect-error Testing runtime validation
      expect(isValidAlias(undefined)).toBe(false);
    });
  });

  describe('isValidLocale', () => {
    it('FR-AUTH-004: returns true for de', () => {
      expect(isValidLocale('de')).toBe(true);
    });

    it('FR-AUTH-004: returns true for en', () => {
      expect(isValidLocale('en')).toBe(true);
    });

    it('FR-AUTH-004: returns false for invalid locale', () => {
      expect(isValidLocale('fr')).toBe(false);
      expect(isValidLocale('')).toBe(false);
    });
  });
});
