import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MAX_MEMBERS_PER_LIST } from '@zusamn/domain';

const getDocMock = vi.fn();
const setDocMock = vi.fn();
const runTransactionMock = vi.fn();
const transactionGetMock = vi.fn();
const transactionSetMock = vi.fn();
const transactionUpdateMock = vi.fn();
const docMock = vi.fn();
const timestampNowMock = vi.fn();
const arrayUnionMock = vi.fn();

vi.mock('../src/client', () => ({
  initFirebase: () => ({ db: {} }),
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...args),
  getDoc: (...args: unknown[]) => getDocMock(...args),
  setDoc: (...args: unknown[]) => setDocMock(...args),
  runTransaction: (...args: unknown[]) => runTransactionMock(...args),
  Timestamp: { now: () => ({ toMillis: () => timestampNowMock() }) },
  arrayUnion: (...args: unknown[]) => arrayUnionMock(...args),
}));

const loadInviteService = async () => {
  vi.resetModules();
  return import('../src/services/inviteService');
};

beforeEach(() => {
  getDocMock.mockReset();
  setDocMock.mockReset();
  runTransactionMock.mockReset();
  transactionGetMock.mockReset();
  transactionSetMock.mockReset();
  transactionUpdateMock.mockReset();
  docMock.mockReset();
  timestampNowMock.mockReset();
  arrayUnionMock.mockReset();

  setDocMock.mockResolvedValue(undefined);

  docMock.mockImplementation((...args: unknown[]) => {
    const pathSegments = args.slice(1) as string[];
    const lastSegment = pathSegments[pathSegments.length - 1];
    return { id: lastSegment ?? 'invite-1' };
  });

  timestampNowMock.mockReturnValue(1000000000000); // Fixed timestamp

  runTransactionMock.mockImplementation(
    async (
      _db: unknown,
      callback: (tx: {
        get: typeof transactionGetMock;
        set: typeof transactionSetMock;
        update: typeof transactionUpdateMock;
      }) => Promise<unknown>
    ) => {
      return callback({
        get: transactionGetMock,
        set: transactionSetMock,
        update: transactionUpdateMock,
      });
    }
  );

  vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'invite-1') });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('inviteService', () => {
  describe('generateInvite', () => {
    it('creates invite with correct expiry (7 days)', async () => {
      const { generateInvite } = await loadInviteService();

      const inviteId = await generateInvite('list-1', 'Shopping', 'user-1');

      expect(inviteId).toBe('invite-1');
      // Verify setDoc was called with invite data (not using transaction for single write)
      expect(setDocMock).toHaveBeenCalledTimes(1);
      const setDocCallArgs = setDocMock.mock.calls[0] as unknown[];
      expect(setDocCallArgs[1]).toMatchObject({
        listId: 'list-1',
        inviteAlias: 'Shopping',
        createdByUserId: 'user-1',
        createdAt: 1000000000000,
        expiresAt: 1000000000000 + 7 * 24 * 60 * 60 * 1000,
        usedBy: null,
        usedAt: null,
      });
    });
  });

  describe('getInvite', () => {
    it('returns null when invite not found', async () => {
      const { getInvite } = await loadInviteService();
      getDocMock.mockResolvedValueOnce({ exists: () => false });

      const result = await getInvite('nonexistent');

      expect(result).toBeNull();
    });

    it('returns invite with mapped fields', async () => {
      const { getInvite } = await loadInviteService();
      getDocMock.mockResolvedValueOnce({
        exists: () => true,
        id: 'invite-1',
        data: () => ({
          listId: 'list-1',
          inviteAlias: 'Shopping',
          createdByUserId: 'user-1',
          createdAt: 1000000000000,
          expiresAt: 1000000000000 + 7 * 24 * 60 * 60 * 1000,
          usedBy: null,
          usedAt: null,
        }),
      });

      const result = await getInvite('invite-1');

      expect(result).toEqual({
        id: 'invite-1',
        listId: 'list-1',
        inviteAlias: 'Shopping',
        createdByUserId: 'user-1',
        createdAt: 1000000000000,
        expiresAt: 1000000000000 + 7 * 24 * 60 * 60 * 1000,
        usedBy: null,
        usedAt: null,
      });
    });

    it('handles already-used invite', async () => {
      const { getInvite } = await loadInviteService();
      getDocMock.mockResolvedValueOnce({
        exists: () => true,
        id: 'invite-1',
        data: () => ({
          listId: 'list-1',
          inviteAlias: 'Shopping',
          createdByUserId: 'user-1',
          createdAt: 1000000000000,
          expiresAt: 1000000000000 + 7 * 24 * 60 * 60 * 1000,
          usedBy: 'user-2',
          usedAt: 1000000001000,
        }),
      });

      const result = await getInvite('invite-1');

      expect(result?.usedBy).toBe('user-2');
      expect(result?.usedAt).toBe(1000000001000);
    });
  });

  describe('redeemInvite', () => {
    it('returns invite_not_found when invite missing', async () => {
      const { redeemInvite } = await loadInviteService();
      transactionGetMock.mockResolvedValueOnce({ exists: () => false });

      const result = await redeemInvite('nonexistent', 'user-2');

      expect(result).toEqual({ success: false, reason: 'invite_not_found' });
    });

    it('returns invite_already_used when already redeemed', async () => {
      const { redeemInvite } = await loadInviteService();
      transactionGetMock.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          usedBy: 'user-3',
          expiresAt: 2000000000000,
          listId: 'list-1',
        }),
      });

      const result = await redeemInvite('invite-1', 'user-2');

      expect(result).toEqual({ success: false, reason: 'invite_already_used' });
    });

    it('returns invite_expired when past expiry', async () => {
      const { redeemInvite } = await loadInviteService();
      transactionGetMock.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          usedBy: null,
          expiresAt: 999999999999, // Before now (1000000000000)
          listId: 'list-1',
        }),
      });

      const result = await redeemInvite('invite-1', 'user-2');

      expect(result).toEqual({ success: false, reason: 'invite_expired' });
    });

    it('returns list_not_found when list missing', async () => {
      const { redeemInvite } = await loadInviteService();
      transactionGetMock
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            usedBy: null,
            expiresAt: 2000000000000,
            listId: 'list-1',
          }),
        })
        .mockResolvedValueOnce({ exists: () => false });

      const result = await redeemInvite('invite-1', 'user-2');

      expect(result).toEqual({ success: false, reason: 'list_not_found' });
    });

    it('returns already_member when user already in list', async () => {
      const { redeemInvite } = await loadInviteService();
      transactionGetMock
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            usedBy: null,
            expiresAt: 2000000000000,
            listId: 'list-1',
          }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            memberIds: ['user-1', 'user-2'],
          }),
        });

      const result = await redeemInvite('invite-1', 'user-2');

      expect(result).toEqual({ success: false, reason: 'already_member' });
    });

    it('returns list_full when at member limit', async () => {
      const { redeemInvite } = await loadInviteService();
      transactionGetMock
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            usedBy: null,
            expiresAt: 2000000000000,
            listId: 'list-1',
          }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            // Use user IDs that don't include the redeeming user (user-2)
            memberIds: Array.from({ length: MAX_MEMBERS_PER_LIST }, (_, i) => `user-${i + 10}`),
          }),
        });

      const result = await redeemInvite('invite-1', 'user-2');

      expect(result).toEqual({ success: false, reason: 'list_full' });
    });

    it('successfully redeems valid invite', async () => {
      const { redeemInvite } = await loadInviteService();
      transactionGetMock
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            usedBy: null,
            expiresAt: 2000000000000,
            listId: 'list-1',
            inviteAlias: 'Shopping',
          }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({
            memberIds: ['user-1'],
          }),
        });

      arrayUnionMock.mockReturnValue(['user-1', 'user-2']);

      const result = await redeemInvite('invite-1', 'user-2');

      expect(result).toEqual({
        success: true,
        listId: 'list-1',
        alias: 'Shopping',
      });
      expect(transactionUpdateMock).toHaveBeenCalledTimes(2); // invite + list
      expect(transactionSetMock).toHaveBeenCalledTimes(1); // membership

      // Verify invite update payload (marks invite as used)
      const inviteUpdateCall = transactionUpdateMock.mock.calls.find(
        (call) => (call[1] as { usedBy?: string })?.usedBy !== undefined
      ) as unknown[];
      expect(inviteUpdateCall).toBeTruthy();
      expect(inviteUpdateCall[1]).toMatchObject({
        usedBy: 'user-2',
        usedAt: expect.any(Number),
      });

      // Verify membership set payload
      const membershipSetCall = transactionSetMock.mock.calls[0] as unknown[];
      expect(membershipSetCall[1]).toMatchObject({
        userId: 'user-2',
        listId: 'list-1',
        alias: 'Shopping',
      });
    });
  });
});
