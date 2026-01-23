import { z } from "zod";
import { MAX_INVITE_MEMBERS, MAX_ITEMS_PER_LIST, MAX_LISTS_PER_USER } from "./constants";

export const isoDateString = z.string().datetime();

export const userProfileSchema = z.object({
  uid: z.string().min(1),
  displayName: z.string().nullable(),
  photoUrl: z.string().url().nullable(),
  createdAt: isoDateString,
  lastLoginAt: isoDateString
});

export const shoppingListSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1).max(120),
  ownerUid: z.string().min(1),
  memberUids: z.array(z.string().min(1)),
  itemCount: z.number().int().min(0).max(MAX_ITEMS_PER_LIST),
  createdAt: isoDateString,
  updatedAt: isoDateString
});

export const listItemSchema = z.object({
  id: z.string().min(1),
  listId: z.string().min(1),
  title: z.string().min(1).max(200),
  quantity: z.string().max(64).nullable().optional(),
  checked: z.boolean(),
  createdAt: isoDateString,
  updatedAt: isoDateString
});

export const inviteLinkSchema = z.object({
  token: z.string().min(10),
  listId: z.string().min(1),
  createdByUid: z.string().min(1),
  createdAt: isoDateString,
  expiresAt: isoDateString.nullable(),
  maxMembers: z.number().int().min(1).max(MAX_INVITE_MEMBERS),
  acceptedCount: z.number().int().min(0).max(MAX_INVITE_MEMBERS),
  isActive: z.boolean()
});

export const userListsLimitSchema = z
  .number()
  .int()
  .min(0)
  .max(MAX_LISTS_PER_USER);
