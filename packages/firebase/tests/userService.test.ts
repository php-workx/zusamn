import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getDocMock = vi.fn();
const docMock = vi.fn();

vi.mock('../src/client', () => ({
  initFirebase: () => ({ db: {} }),
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
}));

const loadUserService = async () => {
  vi.resetModules();
  return import('../src/services/userService');
};

beforeEach(() => {
  getDocMock.mockReset();
  docMock.mockReset();

  docMock.mockImplementation((...args: unknown[]) => {
    const pathSegments = args.slice(1) as string[];
    const lastSegment = pathSegments[pathSegments.length - 1];
    return { id: lastSegment ?? 'user-1' };
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('userService', () => {
  describe('getUser', () => {
    it('returns null when user not found', async () => {
      const { getUser } = await loadUserService();
      getDocMock.mockResolvedValueOnce({ exists: () => false });

      const result = await getUser('nonexistent');

      expect(result).toBeNull();
    });

    it('returns user with mapped fields', async () => {
      const { getUser } = await loadUserService();
      getDocMock.mockResolvedValueOnce({
        exists: () => true,
        id: 'user-1',
        data: () => ({
          displayName: 'John Doe',
          email: 'john@example.com',
          avatarUrl: 'https://example.com/avatar.jpg',
          locale: 'de',
          createdAt: { toMillis: () => 1000000000000 },
          deletedAt: null,
        }),
      });

      const result = await getUser('user-1');

      expect(result).toEqual({
        id: 'user-1',
        displayName: 'John Doe',
        email: 'john@example.com',
        avatarUrl: 'https://example.com/avatar.jpg',
        locale: 'de',
        createdAt: 1000000000000,
        deletedAt: null,
      });
    });

    it('handles missing optional fields with defaults', async () => {
      const { getUser } = await loadUserService();
      getDocMock.mockResolvedValueOnce({
        exists: () => true,
        id: 'user-1',
        data: () => ({}), // Empty data
      });

      const result = await getUser('user-1');

      expect(result).toEqual({
        id: 'user-1',
        displayName: '',
        email: '',
        avatarUrl: null,
        locale: 'en',
        createdAt: expect.any(Number),
        deletedAt: null,
      });
    });

    it('handles deletedAt timestamp', async () => {
      const { getUser } = await loadUserService();
      getDocMock.mockResolvedValueOnce({
        exists: () => true,
        id: 'user-1',
        data: () => ({
          displayName: 'Deleted User',
          deletedAt: { toMillis: () => 1000000001000 },
        }),
      });

      const result = await getUser('user-1');

      expect(result?.deletedAt).toBe(1000000001000);
    });
  });

  describe('getUsers', () => {
    it('returns empty array for empty input', async () => {
      const { getUsers } = await loadUserService();

      const result = await getUsers([]);

      expect(result).toEqual([]);
      expect(getDocMock).not.toHaveBeenCalled();
    });

    it('returns all found users', async () => {
      const { getUsers } = await loadUserService();
      getDocMock
        .mockResolvedValueOnce({
          exists: () => true,
          id: 'user-1',
          data: () => ({ displayName: 'User 1', email: 'user1@example.com' }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          id: 'user-2',
          data: () => ({ displayName: 'User 2', email: 'user2@example.com' }),
        });

      const result = await getUsers(['user-1', 'user-2']);

      expect(result).toHaveLength(2);
      expect(result[0]?.displayName).toBe('User 1');
      expect(result[1]?.displayName).toBe('User 2');
    });

    it('skips users that are not found', async () => {
      const { getUsers } = await loadUserService();
      getDocMock
        .mockResolvedValueOnce({
          exists: () => true,
          id: 'user-1',
          data: () => ({ displayName: 'User 1' }),
        })
        .mockResolvedValueOnce({ exists: () => false })
        .mockResolvedValueOnce({
          exists: () => true,
          id: 'user-3',
          data: () => ({ displayName: 'User 3' }),
        });

      const result = await getUsers(['user-1', 'user-2', 'user-3']);

      expect(result).toHaveLength(2);
      expect(result[0]?.displayName).toBe('User 1');
      expect(result[1]?.displayName).toBe('User 3');
    });
  });

  describe('getUserDisplayNames', () => {
    it('returns empty array for empty input', async () => {
      const { getUserDisplayNames } = await loadUserService();

      const result = await getUserDisplayNames([]);

      expect(result).toEqual([]);
      expect(getDocMock).not.toHaveBeenCalled();
    });

    it('returns display names for found users', async () => {
      const { getUserDisplayNames } = await loadUserService();
      getDocMock
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ displayName: 'Alice' }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ displayName: 'Bob' }),
        });

      const result = await getUserDisplayNames(['user-1', 'user-2']);

      expect(result).toEqual(['Alice', 'Bob']);
    });

    it('returns Unknown for missing users', async () => {
      const { getUserDisplayNames } = await loadUserService();
      getDocMock
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ displayName: 'Alice' }),
        })
        .mockResolvedValueOnce({ exists: () => false });

      const result = await getUserDisplayNames(['user-1', 'user-2']);

      expect(result).toEqual(['Alice', 'Unknown']);
    });

    it('returns Unknown for empty display names', async () => {
      const { getUserDisplayNames } = await loadUserService();
      getDocMock
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ displayName: '' }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ displayName: '   ' }), // Whitespace only
        });

      const result = await getUserDisplayNames(['user-1', 'user-2']);

      expect(result).toEqual(['Unknown', 'Unknown']);
    });
  });
});
