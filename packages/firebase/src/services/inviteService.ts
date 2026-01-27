import {
  doc,
  getDoc,
  runTransaction,
  Timestamp,
  arrayUnion,
} from 'firebase/firestore';
import { initFirebase } from '../client';
import type { Invite, Membership } from '@zusamn/domain';
import { INVITE_EXPIRY_DAYS, MAX_MEMBERS_PER_LIST } from '@zusamn/domain';

/**
 * Result type for invite redemption
 */
export type RedeemInviteResult =
  | { success: true; listId: string; alias: string }
  | {
      success: false;
      reason:
        | 'invite_not_found'
        | 'invite_expired'
        | 'invite_already_used'
        | 'list_not_found'
        | 'list_full'
        | 'already_member';
    };

/**
 * Generates a UUIDv4.
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Gets the Firestore database instance.
 */
function getDb() {
  return initFirebase().db;
}

/**
 * Generates a new invite for a list.
 * Creates an invite document that expires in 7 days.
 *
 * @param listId - The ID of the list to invite to
 * @param inviteAlias - The name of the list as shared by the creator
 * @param userId - The ID of the user creating the invite
 * @returns The generated invite ID (token)
 */
export async function generateInvite(
  listId: string,
  inviteAlias: string,
  userId: string
): Promise<string> {
  const db = getDb();
  const inviteId = generateUUID();
  const now = Timestamp.now().toMillis();

  // Calculate expiry: now + 7 days
  const expiresAt = now + INVITE_EXPIRY_DAYS * 24 * 60 * 60 * 1000;

  const inviteData = {
    listId,
    inviteAlias,
    createdByUserId: userId,
    createdAt: now,
    expiresAt,
    usedBy: null,
    usedAt: null,
  };

  const inviteRef = doc(db, 'invites', inviteId);

  await runTransaction(db, async (transaction) => {
    transaction.set(inviteRef, inviteData);
  });

  return inviteId;
}

/**
 * Fetches an invite by ID for validation.
 *
 * @param inviteId - The invite ID (token) to fetch
 * @returns The invite if found, null otherwise
 */
export async function getInvite(inviteId: string): Promise<Invite | null> {
  const db = getDb();
  const inviteRef = doc(db, 'invites', inviteId);
  const inviteSnapshot = await getDoc(inviteRef);

  if (!inviteSnapshot.exists()) {
    return null;
  }

  const data = inviteSnapshot.data();
  return {
    id: inviteSnapshot.id,
    listId: data.listId,
    inviteAlias: data.inviteAlias,
    createdByUserId: data.createdByUserId,
    createdAt: data.createdAt,
    expiresAt: data.expiresAt,
    usedBy: data.usedBy ?? null,
    usedAt: data.usedAt ?? null,
  };
}

/**
 * Redeems an invite for a user, adding them to the list.
 * This is an atomic transaction that:
 * 1. Validates the invite is not used and not expired
 * 2. Validates the list exists and has room for new members
 * 3. Marks the invite as used
 * 4. Adds the user to the list's memberIds
 * 5. Creates a membership document with the invite's alias
 *
 * @param inviteId - The invite ID (token) to redeem
 * @param userId - The ID of the user redeeming the invite
 * @returns Result indicating success or failure with reason
 */
export async function redeemInvite(
  inviteId: string,
  userId: string
): Promise<RedeemInviteResult> {
  const db = getDb();
  const inviteRef = doc(db, 'invites', inviteId);

  const result = await runTransaction(db, async (transaction) => {
    // Step 1: Read the invite
    const inviteSnapshot = await transaction.get(inviteRef);

    if (!inviteSnapshot.exists()) {
      return { success: false as const, reason: 'invite_not_found' as const };
    }

    const inviteData = inviteSnapshot.data();
    const now = Timestamp.now().toMillis();

    // Step 2: Validate invite is not already used
    if (inviteData.usedBy !== null) {
      return {
        success: false as const,
        reason: 'invite_already_used' as const,
      };
    }

    // Step 3: Validate invite is not expired
    if (inviteData.expiresAt <= now) {
      return { success: false as const, reason: 'invite_expired' as const };
    }

    // Step 4: Read the list
    const listRef = doc(db, 'lists', inviteData.listId);
    const listSnapshot = await transaction.get(listRef);

    if (!listSnapshot.exists()) {
      return { success: false as const, reason: 'list_not_found' as const };
    }

    const listData = listSnapshot.data();
    const memberIds: string[] = listData.memberIds || [];

    // Step 5: Check if user is already a member
    if (memberIds.includes(userId)) {
      return { success: false as const, reason: 'already_member' as const };
    }

    // Step 6: Validate list has room for new members
    if (memberIds.length >= MAX_MEMBERS_PER_LIST) {
      return { success: false as const, reason: 'list_full' as const };
    }

    // Step 7: Update invite as used
    transaction.update(inviteRef, {
      usedBy: userId,
      usedAt: Timestamp.now().toMillis(),
    });

    // Step 8: Add user to list's memberIds
    transaction.update(listRef, {
      memberIds: arrayUnion(userId),
    });

    // Step 9: Create membership document
    const membershipRef = doc(
      db,
      'lists',
      inviteData.listId,
      'memberships',
      userId
    );
    const membership: Omit<Membership, 'userId' | 'listId'> & {
      userId: string;
      listId: string;
    } = {
      userId,
      listId: inviteData.listId,
      alias: inviteData.inviteAlias,
      joinedAt: Timestamp.now().toMillis(),
    };
    transaction.set(membershipRef, membership);

    return {
      success: true as const,
      listId: inviteData.listId,
      alias: inviteData.inviteAlias,
    };
  });

  return result;
}
