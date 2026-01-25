import { z } from 'zod';
import {
  MAX_ALIAS_LENGTH,
  MAX_ITEMS_PER_LIST,
  MAX_LISTS_PER_USER,
  MAX_TEXT_LENGTH,
  SUPPORTED_LOCALES,
} from './constants';

export const localeSchema = z.enum(SUPPORTED_LOCALES);

export const userSchema = z.object({
  id: z.string().min(1),
  displayName: z.string().min(1),
  email: z.string().email(),
  avatarUrl: z.string().url().nullable().optional(),
  locale: localeSchema,
  createdAt: z.number().int().positive(),
  deletedAt: z.number().int().positive().nullable().optional(),
});

export const listSchema = z.object({
  id: z.string().min(1),
  ownerUserId: z.string().min(1),
  memberIds: z.array(z.string().min(1)),
  createdAt: z.number().int().positive(),
});

export const membershipSchema = z.object({
  userId: z.string().min(1),
  listId: z.string().min(1),
  alias: z.string().min(1).max(MAX_ALIAS_LENGTH),
  joinedAt: z.number().int().positive(),
});

export const itemSchema = z.object({
  id: z.string().min(1),
  listId: z.string().min(1),
  text: z.string().min(1).max(MAX_TEXT_LENGTH),
  checked: z.boolean(),
  deleted: z.boolean(),
  createdByUserId: z.string().min(1),
  serverCreatedAt: z.number().int().positive(),
  serverUpdatedAt: z.number().int().positive(),
});

export const inviteSchema = z.object({
  id: z.string().min(1),
  listId: z.string().min(1),
  inviteAlias: z.string().min(1).max(MAX_ALIAS_LENGTH),
  createdByUserId: z.string().min(1),
  createdAt: z.number().int().positive(),
  expiresAt: z.number().int().positive(),
  usedBy: z.string().min(1).nullable().optional(),
  usedAt: z.number().int().positive().nullable().optional(),
});

export const userListsLimitSchema = z.number().int().min(0).max(MAX_LISTS_PER_USER);
export const listItemsLimitSchema = z.number().int().min(0).max(MAX_ITEMS_PER_LIST);
