export type EntityId = string;
export type ISODateString = string;

export interface UserProfile {
  uid: string;
  displayName: string | null;
  photoUrl: string | null;
  createdAt: ISODateString;
  lastLoginAt: ISODateString;
}

export interface ShoppingList {
  id: EntityId;
  name: string;
  ownerUid: string;
  memberUids: string[];
  itemCount: number;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface ListItem {
  id: EntityId;
  listId: EntityId;
  title: string;
  quantity?: string | null;
  checked: boolean;
  createdAt: ISODateString;
  updatedAt: ISODateString;
}

export interface InviteLink {
  token: string;
  listId: EntityId;
  createdByUid: string;
  createdAt: ISODateString;
  expiresAt: ISODateString | null;
  maxMembers: number;
  acceptedCount: number;
  isActive: boolean;
}
