import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { LIMITS } from '@zusamn/domain';

const getDocsMock = vi.fn();
const runTransactionMock = vi.fn();
const transactionGetMock = vi.fn();
const transactionSetMock = vi.fn();
const transactionUpdateMock = vi.fn();
const collectionMock = vi.fn();
const queryMock = vi.fn();
const whereMock = vi.fn();
const docMock = vi.fn();
const serverTimestampMock = vi.fn();

vi.mock('../src/client', () => ({
  initFirebase: () => ({ db: {} }),
}));

vi.mock('firebase/firestore', () => ({
  collection: (...args: unknown[]) => collectionMock(...args),
  query: (...args: unknown[]) => queryMock(...args),
  where: (...args: unknown[]) => whereMock(...args),
  getDocs: (...args: unknown[]) => getDocsMock(...args),
  runTransaction: (...args: unknown[]) => runTransactionMock(...args),
  doc: (...args: unknown[]) => docMock(...args),
  serverTimestamp: () => serverTimestampMock(),
}));

const loadItemService = async () => {
  vi.resetModules();
  return import('../src/services/itemService');
};

beforeEach(() => {
  getDocsMock.mockReset();
  runTransactionMock.mockReset();
  transactionGetMock.mockReset();
  transactionSetMock.mockReset();
  transactionUpdateMock.mockReset();
  collectionMock.mockReset();
  queryMock.mockReset();
  whereMock.mockReset();
  docMock.mockReset();
  serverTimestampMock.mockReset();

  docMock.mockImplementation(() => ({ id: 'item-1' }));
  serverTimestampMock.mockReturnValue('server-time');

  runTransactionMock.mockImplementation(async (_db: unknown, callback: (tx: {
    get: typeof transactionGetMock;
    set: typeof transactionSetMock;
    update: typeof transactionUpdateMock;
  }) => Promise<void>) => {
    await callback({
      get: transactionGetMock,
      set: transactionSetMock,
      update: transactionUpdateMock,
    });
  });

  vi.stubGlobal('crypto', { randomUUID: vi.fn(() => 'item-1') });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('itemService', () => {
  it('getItemCount returns non-deleted count', async () => {
    const { getItemCount } = await loadItemService();
    getDocsMock.mockResolvedValueOnce({ size: 3 });

    const count = await getItemCount('list-1');

    expect(count).toBe(3);
    expect(whereMock).toHaveBeenCalledWith('deleted', '==', false);
  });

  it('addItem rejects invalid text', async () => {
    const { addItem } = await loadItemService();

    await expect(addItem('list-1', '', 'user-1')).rejects.toThrow(
      'Item text cannot be empty'
    );
  });

  it('addItem rejects when list limit reached', async () => {
    const { addItem, LIST_FULL_ERROR } = await loadItemService();
    transactionGetMock.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ itemCount: LIMITS.ITEMS_PER_LIST_MAX }),
    });

    await expect(addItem('list-1', 'Milk', 'user-1')).rejects.toThrow(
      `${LIST_FULL_ERROR}: List has reached the maximum of ${LIMITS.ITEMS_PER_LIST_MAX} items`
    );
  });

  it('addItem rejects when itemCount is missing', async () => {
    const { addItem, LIST_COUNT_MISSING_ERROR } = await loadItemService();
    transactionGetMock.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({}),
    });

    await expect(addItem('list-1', 'Milk', 'user-1')).rejects.toThrow(
      `${LIST_COUNT_MISSING_ERROR}: List is missing itemCount (list-1)`
    );
  });

  it('addItem writes item and returns item with id', async () => {
    const { addItem } = await loadItemService();
    transactionGetMock.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ itemCount: 0 }),
    });

    const item = await addItem('list-1', ' Milk ', 'user-1');

    expect(transactionSetMock).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({
        listId: 'list-1',
        text: 'Milk',
        checked: false,
        deleted: false,
        createdByUserId: 'user-1',
        serverCreatedAt: 'server-time',
        serverUpdatedAt: 'server-time',
      })
    );
    expect(transactionUpdateMock).toHaveBeenCalledWith(expect.anything(), {
      itemCount: 1,
    });
    expect(item.id).toBe('item-1');
    expect(item.text).toBe('Milk');
  });

  it('toggleItemChecked throws when item missing', async () => {
    const { toggleItemChecked } = await loadItemService();
    transactionGetMock.mockResolvedValueOnce({ exists: () => false });

    await expect(toggleItemChecked('list-1', 'item-1')).rejects.toThrow(
      'Item not found: item-1'
    );
  });

  it('toggleItemChecked flips checked state', async () => {
    const { toggleItemChecked } = await loadItemService();
    transactionGetMock.mockResolvedValueOnce({
      exists: () => true,
      data: () => ({ checked: false }),
    });

    await toggleItemChecked('list-1', 'item-1');

    expect(transactionUpdateMock).toHaveBeenCalledWith(expect.anything(), {
      checked: true,
      serverUpdatedAt: expect.anything(),
    });
  });

  it('softDeleteItem marks deleted true', async () => {
    const { softDeleteItem } = await loadItemService();
    transactionGetMock
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ itemCount: 3 }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ deleted: false }),
      });

    await softDeleteItem('list-1', 'item-1');

    expect(transactionUpdateMock).toHaveBeenCalledWith(expect.anything(), {
      deleted: true,
      serverUpdatedAt: expect.anything(),
    });
    expect(transactionUpdateMock).toHaveBeenCalledWith(expect.anything(), {
      itemCount: 2,
    });
  });

  it('undeleteItem marks deleted false', async () => {
    const { undeleteItem } = await loadItemService();
    transactionGetMock
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ itemCount: 2 }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ deleted: true }),
      });

    await undeleteItem('list-1', 'item-1');

    expect(transactionUpdateMock).toHaveBeenCalledWith(expect.anything(), {
      deleted: false,
      serverUpdatedAt: expect.anything(),
    });
    expect(transactionUpdateMock).toHaveBeenCalledWith(expect.anything(), {
      itemCount: 3,
    });
  });

  it('bulkSoftDelete skips empty input', async () => {
    const { bulkSoftDelete } = await loadItemService();

    await bulkSoftDelete('list-1', []); 

    expect(runTransactionMock).not.toHaveBeenCalled();
  });

  it('bulkSoftDelete updates each item and commits', async () => {
    const { bulkSoftDelete } = await loadItemService();
    transactionGetMock
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ itemCount: 5 }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ deleted: false }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ deleted: false }),
      });

    await bulkSoftDelete('list-1', ['item-1', 'item-2']);

    expect(transactionUpdateMock).toHaveBeenCalledTimes(3);
  });

  it('bulkUndelete updates each item and commits', async () => {
    const { bulkUndelete } = await loadItemService();
    transactionGetMock
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ itemCount: 1 }),
      })
      .mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ deleted: true }),
      });

    await bulkUndelete('list-1', ['item-1']);

    expect(transactionUpdateMock).toHaveBeenCalledTimes(2);
  });
});
