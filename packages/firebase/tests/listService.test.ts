import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const getDocsMock = vi.fn();
const getDocMock = vi.fn();
const writeBatchMock = vi.fn();
const batchSetMock = vi.fn();
const batchCommitMock = vi.fn();
const collectionMock = vi.fn();
const queryMock = vi.fn();
const whereMock = vi.fn();
const limitMock = vi.fn();
const docMock = vi.fn();
const updateDocMock = vi.fn();
const timestampNowMock = vi.fn();

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
  batchCommitMock.mockReset();
  collectionMock.mockReset();
  queryMock.mockReset();
  whereMock.mockReset();
  limitMock.mockReset();
  docMock.mockReset();
  updateDocMock.mockReset();
  timestampNowMock.mockReset();

  writeBatchMock.mockReturnValue({
    set: batchSetMock,
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

  it('getUserLists returns personal first then alphabetical', async () => {
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
        id: 'list-shared',
        data: () => ({
          ownerUserId: 'user-2',
          memberIds: ['user-1'],
          createdAt: 2,
          itemCount: 1,
        }),
        ref: { path: 'lists/list-shared' },
      },
    ];

    getDocsMock.mockResolvedValueOnce({ docs: listDocs });
    getDocMock
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ userId: 'user-1', listId: 'list-personal', alias: 'Zeta', joinedAt: 1 }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ userId: 'user-1', listId: 'list-shared', alias: 'Alpha', joinedAt: 2 }),
      });

    const results = await getUserLists('user-1');

    expect(results).toHaveLength(2);
    expect(results[0]?.list.id).toBe('list-personal');
    expect(results[1]?.membership.alias).toBe('Alpha');
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
      docs: [{
        id: 'list-personal',
        data: () => ({
          ownerUserId: 'user-1',
          memberIds: ['user-1'],
          createdAt: 1,
          itemCount: 0,
        }),
        ref: { path: 'lists/list-personal' },
      }],
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
});
