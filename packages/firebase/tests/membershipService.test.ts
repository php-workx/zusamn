import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const docMock = vi.fn();
const updateDocMock = vi.fn();

vi.mock('../src/client', () => ({
  initFirebase: () => ({ db: {} }),
}));

vi.mock('firebase/firestore', () => ({
  doc: (...args: unknown[]) => docMock(...args),
  updateDoc: (...args: unknown[]) => updateDocMock(...args),
}));

const loadMembershipService = async () => {
  vi.resetModules();
  return import('../src/services/membershipService');
};

beforeEach(() => {
  docMock.mockReset();
  updateDocMock.mockReset();

  docMock.mockImplementation((...args: unknown[]) => {
    const pathSegments = args.slice(1) as string[];
    return { path: pathSegments.join('/') };
  });

  updateDocMock.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('membershipService', () => {
  it('FR-SWITCH-008: updateAlias updates only the specified user membership', async () => {
    const { updateAlias } = await loadMembershipService();

    await updateAlias('list-1', 'user-1', 'New Alias');

    // Should target the specific user's membership document
    expect(docMock).toHaveBeenCalledWith({}, 'lists', 'list-1', 'memberships', 'user-1');
    // Should update only the alias field
    expect(updateDocMock).toHaveBeenCalledWith(expect.anything(), { alias: 'New Alias' });
  });

  it('FR-SWITCH-008: updateAlias does not affect other users memberships', async () => {
    const { updateAlias } = await loadMembershipService();

    await updateAlias('list-1', 'user-1', 'User1 Alias');

    // The doc path should only reference user-1, not any other user
    const docCallArgs = docMock.mock.calls[0];
    expect(docCallArgs).toContain('user-1');
    expect(docCallArgs).not.toContain('user-2');
  });

  it('FR-SWITCH-009: updateAlias trims whitespace from alias', async () => {
    const { updateAlias } = await loadMembershipService();

    await updateAlias('list-1', 'user-1', '  Trimmed Alias  ');

    expect(updateDocMock).toHaveBeenCalledWith(expect.anything(), { alias: 'Trimmed Alias' });
  });

  it('FR-SWITCH-009: updateAlias throws error for empty alias', async () => {
    const { updateAlias } = await loadMembershipService();

    await expect(updateAlias('list-1', 'user-1', '')).rejects.toThrow('Alias cannot be empty');
  });

  it('FR-SWITCH-009: updateAlias throws error for whitespace-only alias', async () => {
    const { updateAlias } = await loadMembershipService();

    await expect(updateAlias('list-1', 'user-1', '   ')).rejects.toThrow('Alias cannot be empty');
  });

  it('FR-SWITCH-009: updateAlias throws error for alias over 50 characters', async () => {
    const { updateAlias } = await loadMembershipService();

    const longAlias = 'a'.repeat(51);
    await expect(updateAlias('list-1', 'user-1', longAlias)).rejects.toThrow(
      'Alias cannot exceed 50 characters'
    );
  });

  it('FR-SWITCH-009: updateAlias allows alias exactly 50 characters', async () => {
    const { updateAlias } = await loadMembershipService();

    const exactAlias = 'a'.repeat(50);
    await updateAlias('list-1', 'user-1', exactAlias);

    expect(updateDocMock).toHaveBeenCalledWith(expect.anything(), { alias: exactAlias });
  });
});
