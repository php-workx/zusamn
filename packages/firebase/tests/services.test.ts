import { describe, expect, it, vi, beforeEach } from 'vitest';

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

  it('FR-AUTH-003, FR-AUTH-004: creates a personal list and membership with defaults', async () => {
    const result = await createPersonalList('user-123', 'en');

    expect(result.list.ownerUserId).toBe('user-123');
    expect(result.list.memberIds).toEqual(['user-123']);
    expect(result.list.itemCount).toBe(0);

    expect(result.membership.userId).toBe('user-123');
    expect(result.membership.listId).toBe(result.list.id);
    expect(result.membership.alias).toBe('Shopping');

    expect(firestoreMocks.writeBatchMock).toHaveBeenCalledTimes(1);
    expect(firestoreMocks.setMock).toHaveBeenCalledTimes(2);
    expect(firestoreMocks.commitMock).toHaveBeenCalledTimes(1);

    const listCall = firestoreMocks.setMock.mock.calls.find(
      (call) => call[0]?.path === `lists/${result.list.id}`
    );
    const membershipCall = firestoreMocks.setMock.mock.calls.find(
      (call) => call[0]?.path === `lists/${result.list.id}/memberships/user-123`
    );

    expect(listCall).toBeTruthy();
    expect(membershipCall).toBeTruthy();
  });
});
