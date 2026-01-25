import { MAX_ALIAS_LENGTH, MAX_TEXT_LENGTH, SUPPORTED_LOCALES } from './constants';
import type { Locale } from './types';

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates item text (max 100 characters, trimmed)
 */
export function isValidText(text: string): boolean {
  if (typeof text !== 'string') return false;
  const trimmed = text.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_TEXT_LENGTH;
}

/**
 * Validates item text with detailed error message
 */
export function validateItemText(text: string): ValidationResult {
  if (typeof text !== 'string') {
    return { valid: false, error: 'Item text must be a string' };
  }
  const trimmed = text.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Item text cannot be empty' };
  }
  if (trimmed.length > MAX_TEXT_LENGTH) {
    return { valid: false, error: `Item text exceeds maximum length of ${MAX_TEXT_LENGTH} characters` };
  }
  return { valid: true };
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
