import { MMKV } from 'react-native-mmkv';

/**
 * Shared MMKV storage instance for the app.
 * Provides fast, synchronous key-value storage that persists across app launches.
 */
export const storage = new MMKV();
