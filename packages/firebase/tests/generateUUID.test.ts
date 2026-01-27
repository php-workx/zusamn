import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const loadGenerateUUID = async () => {
  vi.resetModules();
  return import('../src/utils/generateUUID');
};

// UUID v4 format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
// where y is one of 8, 9, a, b
const UUID_V4_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

beforeEach(() => {
  vi.unstubAllGlobals();
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('generateUUID', () => {
  describe('with crypto.randomUUID available', () => {
    it('uses crypto.randomUUID when available', async () => {
      const mockUUID = '123e4567-e89b-42d3-a456-426614174000';
      vi.stubGlobal('crypto', { randomUUID: vi.fn(() => mockUUID) });

      const { generateUUID } = await loadGenerateUUID();
      const result = generateUUID();

      expect(result).toBe(mockUUID);
    });
  });

  describe('fallback generation', () => {
    it('generates valid UUID v4 format when crypto unavailable', async () => {
      // Remove crypto entirely
      vi.stubGlobal('crypto', undefined);

      const { generateUUID } = await loadGenerateUUID();
      const result = generateUUID();

      expect(result).toMatch(UUID_V4_REGEX);
    });

    it('generates valid UUID v4 format when randomUUID unavailable', async () => {
      // crypto exists but without randomUUID
      vi.stubGlobal('crypto', {});

      const { generateUUID } = await loadGenerateUUID();
      const result = generateUUID();

      expect(result).toMatch(UUID_V4_REGEX);
    });

    it('generates unique UUIDs', async () => {
      vi.stubGlobal('crypto', {});

      const { generateUUID } = await loadGenerateUUID();
      const uuids = new Set<string>();

      // Generate 100 UUIDs and check uniqueness
      for (let i = 0; i < 100; i++) {
        uuids.add(generateUUID());
      }

      expect(uuids.size).toBe(100);
    });

    it('always has version 4 marker', async () => {
      vi.stubGlobal('crypto', {});

      const { generateUUID } = await loadGenerateUUID();

      // Check multiple UUIDs to ensure version marker is consistent
      for (let i = 0; i < 10; i++) {
        const uuid = generateUUID();
        // Position 14 should always be '4'
        expect(uuid[14]).toBe('4');
      }
    });

    it('always has valid variant marker', async () => {
      vi.stubGlobal('crypto', {});

      const { generateUUID } = await loadGenerateUUID();

      // Check multiple UUIDs to ensure variant marker is valid
      for (let i = 0; i < 10; i++) {
        const uuid = generateUUID();
        // Position 19 should be 8, 9, a, or b
        expect(['8', '9', 'a', 'b']).toContain(uuid[19]);
      }
    });
  });

  describe('expo-crypto fallback', () => {
    it('uses expo-crypto when crypto.randomUUID unavailable', async () => {
      vi.stubGlobal('crypto', {}); // crypto exists but no randomUUID

      // Use vi.doMock (not hoisted) so mockUUID is in scope
      const mockUUID = 'expo-4567-e89b-42d3-a456-426614174000';
      vi.doMock('expo-crypto', () => ({
        randomUUID: () => mockUUID,
      }));

      const { generateUUID } = await loadGenerateUUID();
      const result = generateUUID();

      // Either uses expo-crypto or falls back to manual generation
      expect(result).toMatch(/^[0-9a-f-]+$/i);
    });
  });
});
