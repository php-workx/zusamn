export const MAX_LISTS_PER_USER = 5;
export const MAX_ITEMS_PER_LIST = 200;
export const MAX_INVITE_MEMBERS = 10;

export const MAX_TEXT_LENGTH = 100;
export const MAX_ALIAS_LENGTH = 50;

export const SUPPORTED_LOCALES = ['de', 'en'] as const;

/**
 * Consolidated limits object for easy import
 */
export const LIMITS = {
  LISTS_PER_USER_MAX: MAX_LISTS_PER_USER,
  ITEMS_PER_LIST_MAX: MAX_ITEMS_PER_LIST,
  INVITE_MEMBERS_MAX: MAX_INVITE_MEMBERS,
  ITEM_TEXT_MAX: MAX_TEXT_LENGTH,
  ALIAS_MAX: MAX_ALIAS_LENGTH,
} as const;
