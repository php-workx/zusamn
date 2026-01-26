import { describe, expect, it } from 'vitest';
import {
  inviteSchema,
  itemSchema,
  listSchema,
  localeSchema,
  membershipSchema,
  userSchema,
} from './schemas';
import { isValidAlias, isValidLocale, isValidText } from './validators';

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
    });

    it('returns false for text over 100 characters', () => {
      expect(isValidText('a'.repeat(101))).toBe(false);
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
