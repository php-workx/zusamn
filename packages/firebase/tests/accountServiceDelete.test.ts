import { describe, expect, it, vi, beforeEach } from 'vitest';
import { FirebaseError } from 'firebase/app';

// Auth-related mocks
const authMocks = vi.hoisted(() => {
  const deleteUserMock = vi.fn();
  const signOutMock = vi.fn();
  return { deleteUserMock, signOutMock };
});

// Firestore-related mocks (separated for clarity)
const firestoreMocks = vi.hoisted(() => {
  const updateDocMock = vi.fn();
  const writeBatchMock = {
    delete: vi.fn(),
    update: vi.fn(),
    commit: vi.fn().mockResolvedValue(undefined),
  };
  return { updateDocMock, writeBatchMock };
});

vi.mock('firebase/auth', () => ({
  deleteUser: authMocks.deleteUserMock,
}));

vi.mock('firebase/firestore', () => ({
  doc: vi.fn(),
  updateDoc: firestoreMocks.updateDocMock,
  serverTimestamp: vi.fn(() => ({ __serverTimestamp: true })),
  // Additional mocks needed for deleteAccountWithDb cascade delete
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn().mockResolvedValue({ docs: [] }), // No lists to clean up
  writeBatch: vi.fn(() => firestoreMocks.writeBatchMock),
  arrayRemove: vi.fn(),
  deleteDoc: vi.fn(),
}));

vi.mock('../src/auth', () => ({
  signOut: authMocks.signOutMock,
}));

vi.mock('../src/client', () => ({
  initFirebase: () => ({
    auth: { currentUser: { uid: 'user-1' } },
    db: { name: 'test-db' },
  }),
}));

import { deleteAccount } from '../src/services/accountService';

// FR-ACCT-005: Delete Account functionality
describe('accountService deleteAccount', () => {
  beforeEach(() => {
    authMocks.deleteUserMock.mockReset();
    authMocks.signOutMock.mockReset();
    firestoreMocks.updateDocMock.mockReset();
    firestoreMocks.writeBatchMock.delete.mockReset();
    firestoreMocks.writeBatchMock.update.mockReset();
    firestoreMocks.writeBatchMock.commit.mockReset().mockResolvedValue(undefined);
  });

  it('successfully deletes account and signs out', async () => {
    authMocks.deleteUserMock.mockResolvedValueOnce(undefined);
    authMocks.signOutMock.mockResolvedValueOnce(undefined);

    await deleteAccount('user-1');

    expect(authMocks.deleteUserMock).toHaveBeenCalledTimes(1);
    expect(firestoreMocks.writeBatchMock.commit).toHaveBeenCalledTimes(1);
    expect(authMocks.signOutMock).toHaveBeenCalledTimes(1);
  });

  it('throws on non-reauth errors without signing out (auth-first approach)', async () => {
    // With auth-first deletion, if Auth deletion fails, user account still exists
    // so we don't sign out - user can retry after resolving the issue
    const genericError = new Error('Network error');
    authMocks.deleteUserMock.mockRejectedValueOnce(genericError);

    await expect(deleteAccount('user-1')).rejects.toThrow('Network error');
    expect(authMocks.signOutMock).not.toHaveBeenCalled();
  });

  it('rethrows reauth-required errors without signing out', async () => {
    const reauthError = new FirebaseError('auth/requires-recent-login', 'Reauth');
    authMocks.deleteUserMock.mockRejectedValueOnce(reauthError);

    await expect(deleteAccount('user-1')).rejects.toThrow('Reauth');
    expect(authMocks.signOutMock).not.toHaveBeenCalled();
  });

  it('throws when userId does not match authenticated user', async () => {
    await expect(deleteAccount('different-user-id')).rejects.toThrow(
      'User ID mismatch: authenticated as user-1 but requested to delete different-user-id'
    );
    expect(authMocks.deleteUserMock).not.toHaveBeenCalled();
    expect(authMocks.signOutMock).not.toHaveBeenCalled();
  });
});

describe('accountService deleteAccount - no authenticated user', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('throws when no user is authenticated', async () => {
    // Override the client mock to return no currentUser
    vi.doMock('../src/client', () => ({
      initFirebase: () => ({
        auth: { currentUser: null },
        db: { name: 'test-db' },
      }),
    }));

    const { deleteAccount: deleteAccountNoUser } = await import('../src/services/accountService');

    await expect(deleteAccountNoUser('user-1')).rejects.toThrow('No authenticated user');
  });
});
