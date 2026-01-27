/**
 * Cross-platform UUID generation utility.
 *
 * Tries multiple UUID generation strategies in order of preference:
 * 1. Web Crypto API (modern browsers, Node.js 19+)
 * 2. expo-crypto (React Native/Expo via dynamic require)
 * 3. Fallback: Manual RFC 4122 v4 UUID generator using Math.random
 *
 * This ensures the function works across all environments:
 * - Browser (Web Crypto)
 * - Node.js (Web Crypto or manual fallback)
 * - React Native/Hermes (expo-crypto or manual fallback)
 *
 * Note: No external uuid package dependency is used.
 */
export function generateUUID(): string {
  // Try Web Crypto API first (available in browsers and Node.js 19+)
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  // Try expo-crypto for React Native environments
  try {
    // Dynamic import to avoid bundler issues in non-RN environments
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ExpoCrypto = require('expo-crypto');
    if (typeof ExpoCrypto?.randomUUID === 'function') {
      return ExpoCrypto.randomUUID();
    }
  } catch {
    // expo-crypto not available, continue to fallback
  }

  // Fallback: generate UUID v4 manually (RFC 4122 compliant)
  // This works in all environments including Hermes without native modules
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
