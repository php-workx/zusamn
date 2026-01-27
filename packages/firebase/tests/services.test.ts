import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock generateUUID for deterministic tests
const mockListId = 'mock-list-id-123';
vi.mock('../src/utils/generateUUID', () => ({
  generateUUID: () => mockListId,
}));

const firestoreMocks = vi.hoisted(() => {
  const setMock = vi.fn();
  const commitMock = vi.fn().mockResolvedValue(undefined);
  const writeBatchMock = vi.fn(() => ({
    set: setMock,
    commit: commitMock,
  }));
  const docMock = vi.fn((...segments: unknown[]) => {
    const stringSegments = segments.filter(
      (segment): segment is string => typeof segment === 'string'
    );
    return {
      path: stringSegments.join('/'),
      id: stringSegments[stringSegments.length - 1],
    };
  });

  return { setMock, commitMock, writeBatchMock, docMock };
});

vi.mock('firebase/firestore', () => ({
  doc: firestoreMocks.docMock,
  writeBatch: firestoreMocks.writeBatchMock,
  Timestamp: {
    now: () => ({
      toMillis: () => 1_701_234_567_890,
    }),
  },
  getDoc: vi.fn(),
  getDocs: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
}));

vi.mock('../src/client', () => ({
  initFirebase: () => ({ db: { name: 'test-db' } }),
}));

import { createPersonalList } from '../src/services/listService';

describe('listService', () => {
  beforeEach(() => {
    firestoreMocks.setMock.mockClear();
    firestoreMocks.commitMock.mockClear();
    firestoreMocks.docMock.mockClear();
    firestoreMocks.writeBatchMock.mockClear();
  });

  describe('createPersonalList', () => {
    it('FR-AUTH-003, FR-AUTH-004: creates a personal list and membership with defaults for en locale', async () => {
      const result = await createPersonalList('user-123', 'en');

      expect(result.list.id).toBe(mockListId);
      expect(result.list.ownerUserId).toBe('user-123');
      expect(result.list.memberIds).toEqual(['user-123']);
      expect(result.list.itemCount).toBe(0);

      expect(result.membership.userId).toBe('user-123');
      expect(result.membership.listId).toBe(result.list.id);
      expect(result.membership.alias).toBe('Shopping');

      expect(firestoreMocks.writeBatchMock).toHaveBeenCalledTimes(1);
      expect(firestoreMocks.setMock).toHaveBeenCalledTimes(2);
      expect(firestoreMocks.commitMock).toHaveBeenCalledTimes(1);

      // Verify list data payload
      const listCall = firestoreMocks.setMock.mock.calls.find(
        (call) => (call[0] as { path: string })?.path === `lists/${mockListId}`
      ) as unknown[];
      expect(listCall).toBeTruthy();
      expect(listCall[1]).toMatchObject({
        ownerUserId: 'user-123',
        memberIds: ['user-123'],
        itemCount: 0,
      });

      // Verify membership data payload
      const membershipCall = firestoreMocks.setMock.mock.calls.find(
        (call) => (call[0] as { path: string })?.path === `lists/${mockListId}/memberships/user-123`
      ) as unknown[];
      expect(membershipCall).toBeTruthy();
      expect(membershipCall[1]).toMatchObject({
        userId: 'user-123',
        listId: mockListId,
        alias: 'Shopping',
      });
    });

    it('creates a personal list with German default alias for de locale', async () => {
      const result = await createPersonalList('user-456', 'de');

      expect(result.list.id).toBe(mockListId);
      expect(result.membership.alias).toBe('Einkaufen');

      // Verify membership data payload has German alias
      const membershipCall = firestoreMocks.setMock.mock.calls.find(
        (call) => (call[0] as { path: string })?.path === `lists/${mockListId}/memberships/user-456`
      ) as unknown[];
      expect(membershipCall).toBeTruthy();
      expect(membershipCall[1]).toMatchObject({
        alias: 'Einkaufen',
      });
    });

    it('throws error when batch commit fails', async () => {
      firestoreMocks.commitMock.mockRejectedValueOnce(new Error('Firestore unavailable'));

      await expect(createPersonalList('user-789', 'en')).rejects.toThrow('Firestore unavailable');
    });
  });
});
