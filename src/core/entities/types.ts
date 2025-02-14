export type UUID = string;

export enum QueueEntryStatus {
  WAITING = 'WAITING',
  NOTIFIED = 'NOTIFIED',
  SEATED = 'SEATED',
  NO_SHOW = 'NO_SHOW',
  CANCELLED = 'CANCELLED'
}

export interface Customer {
  id: UUID;
  name: string;
  phoneNumber?: string;
  email?: string;
}

export interface QueueEntry {
  id: UUID;
  customerId: UUID;
  queueId: UUID;
  partySize: number;
  status: QueueEntryStatus;
  estimatedWaitTime: number; // in minutes
  joinedAt: Date;
  notifiedAt?: Date;
  seatedAt?: Date;
  position: number;
}

export interface Queue {
  id: UUID;
  name: string;
  maxCapacity: number;
  currentSize: number;
  entries: QueueEntry[];
  averageWaitTime: number; // in minutes
  isActive: boolean;
  businessHours: BusinessHours;
  settings: QueueSettings;
}

export interface BusinessHours {
  openTime: string; // 24h format "HH:mm"
  closeTime: string; // 24h format "HH:mm"
  timezone: string;
}

export interface QueueSettings {
  maxPartySize: number;
  minPartySize: number;
  allowedOverCapacity: number; // percentage over capacity allowed
  defaultEstimatedWaitTime: number; // in minutes
  notificationThreshold: number; // notify when customer is X positions away
} 