export type Locale = 'de' | 'en';

export interface User {
  id: string;
  displayName: string;
  email: string;
  avatarUrl?: string | null;
  locale: Locale;
  createdAt: number; // Timestamp
  deletedAt?: number | null;
}

export interface List {
  id: string;
  ownerUserId: string;
  memberIds: string[];
  createdAt: number;
}

export interface Membership {
  userId: string;
  listId: string;
  alias: string;
  joinedAt: number;
}

export interface Item {
  id: string;
  listId: string;
  text: string;
  checked: boolean;
  deleted: boolean;
  createdByUserId: string;
  serverCreatedAt: number;
  serverUpdatedAt: number;
}

export interface Invite {
  id: string;
  listId: string;
  inviteAlias: string;
  createdByUserId: string;
  createdAt: number;
  expiresAt: number;
  usedBy?: string | null;
  usedAt?: number | null;
}
