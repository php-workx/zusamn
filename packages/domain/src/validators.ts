import { MAX_ALIAS_LENGTH, MAX_TEXT_LENGTH, SUPPORTED_LOCALES } from './constants';
import type { Locale } from './types';

/**
 * Validates item text (max 100 characters)
 */
export function isValidText(text: string): boolean {
  return typeof text === 'string' && text.length > 0 && text.length <= MAX_TEXT_LENGTH;
}

/**
 * Validates alias (max 50 characters)
 */
export function isValidAlias(alias: string): boolean {
  return typeof alias === 'string' && alias.length > 0 && alias.length <= MAX_ALIAS_LENGTH;
}

/**
 * Validates locale ('de' | 'en')
 */
export function isValidLocale(locale: string): locale is Locale {
  return SUPPORTED_LOCALES.includes(locale as Locale);
}
