import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getDocsMock = vi.fn();
const getDocMock = vi.fn();
const writeBatchMock = vi.fn();
const batchSetMock = vi.fn();
const batchDeleteMock = vi.fn();
const batchUpdateMock = vi.fn();
const batchCommitMock = vi.fn();
const collectionMock = vi.fn();
const queryMock = vi.fn();
const whereMock = vi.fn();
const limitMock = vi.fn();
const docMock = vi.fn();
const updateDocMock = vi.fn();
const timestampNowMock = vi.fn();
const arrayRemoveMock = vi.fn();

vi.mock('../src/client', () => ({
  initFirebase: () => ({ db: {} }),
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  where: (...args: unknown[]) => whereMock(...args),
  limit: (...args: unknown[]) => limitMock(...args),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  writeBatch: (...args: unknown[]) => writeBatchMock(...args),
  doc: (...args: unknown[]) => docMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
  Timestamp: { now: () => ({ toMillis: () => timestampNowMock() }) },
  arrayRemove: (...args: unknown[]) => arrayRemoveMock(...args),
}));

const loadListService = async () => {
  vi.resetModules();
  return import('../src/services/listService');
};

beforeEach(() => {
  getDocsMock.mockReset();
  getDocMock.mockReset();
  writeBatchMock.mockReset();
  batchSetMock.mockReset();
  batchDeleteMock.mockReset();
  batchUpdateMock.mockReset();
  batchCommitMock.mockReset();
  collectionMock.mockReset();
  queryMock.mockReset();
  whereMock.mockReset();
  limitMock.mockReset();
  docMock.mockReset();
  updateDocMock.mockReset();
  timestampNowMock.mockReset();
  arrayRemoveMock.mockReset();

  writeBatchMock.mockReturnValue({
    set: batchSetMock,
    delete: batchDeleteMock,
    update: batchUpdateMock,
    commit: batchCommitMock,
  });

  docMock.mockImplementation((...args: unknown[]) => {
    const pathSegments = args.slice(1) as string[];
    const lastSegment = pathSegments[pathSegments.length - 1];
    return { id: lastSegment ?? 'list-1' };
  });

  timestampNowMock.mockReturnValue(1234567890);

  // Mock crypto.randomUUID for predictable list IDs
  vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'list-1') });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('listService', () => {
  it('createPersonalList uses locale default alias and writes batch', async () => {
    const { createPersonalList } = await loadListService();

    const result = await createPersonalList('user-1', 'de');

    expect(result.list.id).toBe('list-1');
    expect(result.membership.alias).toBe('Einkaufen');
    expect(batchSetMock).toHaveBeenCalledTimes(2);
    expect(batchCommitMock).toHaveBeenCalledTimes(1);
  });

  it('FR-SWITCH-001: getUserLists returns personal list first', async () => {
    const { getUserLists } = await loadListService();

    const listDocs = [
      {
        id: 'list-shared',
        data: () => ({
          ownerUserId: 'user-2',
          memberIds: ['user-1'],
          createdAt: 2,
          itemCount: 1,
        }),
        ref: { path: 'lists/list-shared' },
      },
      {
        id: 'list-personal',
        data: () => ({
          ownerUserId: 'user-1',
          memberIds: ['user-1'],
          createdAt: 1,
          itemCount: 2,
        }),
        ref: { path: 'lists/list-personal' },
      },
    ];

    getDocsMock.mockResolvedValueOnce({ docs: listDocs });
    getDocMock
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ userId: 'user-1', listId: 'list-shared', alias: 'Shared', joinedAt: 2 }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ userId: 'user-1', listId: 'list-personal', alias: 'Personal', joinedAt: 1 }),
      });

    const results = await getUserLists('user-1');

    // Personal list should be first regardless of input order
    expect(results[0]?.list.ownerUserId).toBe('user-1');
    expect(results[0]?.list.id).toBe('list-personal');
  });

  it('FR-SWITCH-002: getUserLists returns all shared lists', async () => {
    const { getUserLists } = await loadListService();

    const listDocs = [
      {
        id: 'list-personal',
        data: () => ({
          ownerUserId: 'user-1',
          memberIds: ['user-1'],
          createdAt: 1,
          itemCount: 0,
        }),
        ref: { path: 'lists/list-personal' },
      },
      {
        id: 'list-shared-1',
        data: () => ({
          ownerUserId: 'user-2',
          memberIds: ['user-1', 'user-2'],
          createdAt: 2,
          itemCount: 0,
        }),
        ref: { path: 'lists/list-shared-1' },
      },
      {
        id: 'list-shared-2',
        data: () => ({
          ownerUserId: 'user-3',
          memberIds: ['user-1', 'user-3'],
          createdAt: 3,
          itemCount: 0,
        }),
        ref: { path: 'lists/list-shared-2' },
      },
    ];

    getDocsMock.mockResolvedValueOnce({ docs: listDocs });
    getDocMock
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ userId: 'user-1', listId: 'list-personal', alias: 'Mine', joinedAt: 1 }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ userId: 'user-1', listId: 'list-shared-1', alias: 'Shared1', joinedAt: 2 }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ userId: 'user-1', listId: 'list-shared-2', alias: 'Shared2', joinedAt: 3 }),
      });

    const results = await getUserLists('user-1');

    expect(results).toHaveLength(3);
    // Should include both shared lists
    const sharedLists = results.filter((r) => r.list.ownerUserId !== 'user-1');
    expect(sharedLists).toHaveLength(2);
  });

  it('FR-SWITCH-003: getUserLists sorts shared lists alphabetically by alias', async () => {
    const { getUserLists } = await loadListService();

    const listDocs = [
      {
        id: 'list-personal',
        data: () => ({
          ownerUserId: 'user-1',
          memberIds: ['user-1'],
          createdAt: 1,
          itemCount: 2,
        }),
        ref: { path: 'lists/list-personal' },
      },
      {
        id: 'list-shared-z',
        data: () => ({
          ownerUserId: 'user-2',
          memberIds: ['user-1'],
          createdAt: 2,
          itemCount: 1,
        }),
        ref: { path: 'lists/list-shared-z' },
      },
      {
        id: 'list-shared-a',
        data: () => ({
          ownerUserId: 'user-3',
          memberIds: ['user-1'],
          createdAt: 3,
          itemCount: 1,
        }),
        ref: { path: 'lists/list-shared-a' },
      },
    ];

    getDocsMock.mockResolvedValueOnce({ docs: listDocs });
    getDocMock
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ userId: 'user-1', listId: 'list-personal', alias: 'Personal', joinedAt: 1 }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          userId: 'user-1',
          listId: 'list-shared-z',
          alias: 'Zeta List',
          joinedAt: 2,
        }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          userId: 'user-1',
          listId: 'list-shared-a',
          alias: 'Alpha List',
          joinedAt: 3,
        }),
      });

    const results = await getUserLists('user-1');

    expect(results).toHaveLength(3);
    // Personal first
    expect(results[0]?.list.id).toBe('list-personal');
    // Then alphabetically: Alpha before Zeta
    expect(results[1]?.membership.alias).toBe('Alpha List');
    expect(results[2]?.membership.alias).toBe('Zeta List');
  });

  it('FR-SWITCH-004: getUserLists returns user alias for each list', async () => {
    const { getUserLists } = await loadListService();

    const listDocs = [
      {
        id: 'list-1',
        data: () => ({
          ownerUserId: 'user-1',
          memberIds: ['user-1'],
          createdAt: 1,
          itemCount: 0,
        }),
        ref: { path: 'lists/list-1' },
      },
    ];

    getDocsMock.mockResolvedValueOnce({ docs: listDocs });
    getDocMock.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ userId: 'user-1', listId: 'list-1', alias: 'My Custom Alias', joinedAt: 1 }),
    });

    const results = await getUserLists('user-1');

    expect(results[0]?.membership.alias).toBe('My Custom Alias');
  });

  it('getPersonalList returns null when no list found', async () => {
    const { getPersonalList } = await loadListService();
    getDocsMock.mockResolvedValueOnce({ empty: true, docs: [] });

    const result = await getPersonalList('user-1');

    expect(result).toBeNull();
  });

  it('getPersonalList returns null when membership missing', async () => {
    const { getPersonalList } = await loadListService();
    getDocsMock.mockResolvedValueOnce({
      empty: false,
      docs: [
        {
          id: 'list-personal',
          data: () => ({
            ownerUserId: 'user-1',
            memberIds: ['user-1'],
            createdAt: 1,
            itemCount: 0,
          }),
          ref: { path: 'lists/list-personal' },
        },
      ],
    });
    getDocMock.mockResolvedValueOnce({ exists: () => false });

    const result = await getPersonalList('user-1');

    expect(result).toBeNull();
  });

  it('hasPersonalList returns true when list exists', async () => {
    const { hasPersonalList } = await loadListService();
    getDocsMock.mockResolvedValueOnce({ empty: false });

    const result = await hasPersonalList('user-1');

    expect(result).toBe(true);
  });

  it('hasPersonalList returns false when no list exists', async () => {
    const { hasPersonalList } = await loadListService();
    getDocsMock.mockResolvedValueOnce({ empty: true, docs: [] });

    const result = await hasPersonalList('user-1');

    expect(result).toBe(false);
  });

  it('FR-LIST-029: leaveList removes membership and updates memberIds', async () => {
    const { leaveList } = await loadListService();

    // Mock getting the list (not owned by user)
    getDocMock.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        ownerUserId: 'user-2',
        memberIds: ['user-1', 'user-2'],
      }),
    });

    await leaveList('list-shared', 'user-1');

    // Should delete membership doc
    expect(batchDeleteMock).toHaveBeenCalled();
    // Should update memberIds with arrayRemove
    expect(batchUpdateMock).toHaveBeenCalled();
    expect(arrayRemoveMock).toHaveBeenCalledWith('user-1');
    // Should commit the batch
    expect(batchCommitMock).toHaveBeenCalled();
  });

  it('FR-LIST-030: leaveList throws error for personal list', async () => {
    const { leaveList } = await loadListService();

    // Mock getting the list (owned by user - personal list)
    getDocMock.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({
        ownerUserId: 'user-1',
        memberIds: ['user-1'],
      }),
    });

    await expect(leaveList('list-personal', 'user-1')).rejects.toThrow(
      'Cannot leave your personal list'
    );
  });

  it('leaveList throws error when list not found', async () => {
    const { leaveList } = await loadListService();

    getDocMock.mockResolvedValueOnce({
      exists: () => false,
    });

    await expect(leaveList('nonexistent-list', 'user-1')).rejects.toThrow('List not found');
  });

  // Note: FR-LIST-031 (Leave requires confirmation dialog) is a pure UI behavior
  // tested via ConfirmDialog component in apps/mobile/app/(tabs)/index.tsx:717-725
  // The dialog shows "Leave this list?" with "Leave" confirm button.
  // This is covered by E2E/manual testing rather than unit tests.
});
