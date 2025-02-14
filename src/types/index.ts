// Common types used across modules

export interface Queue {
  id: string;
  name: string;
  currentNumber: number;
  status: 'active' | 'paused' | 'closed';
}

export interface Customer {
  id: string;
  ticketNumber: number;
  queueId: string;
  status: 'waiting' | 'called' | 'served' | 'cancelled';
}

export interface Notification {
  id: string;
  type: 'SMS' | 'EMAIL' | 'PUSH';
  recipient: string;
  content: string;
  status: 'pending' | 'sent' | 'failed';
}

export interface WebSocketMessage {
  type: 'QUEUE_UPDATE' | 'CUSTOMER_NOTIFICATION' | 'ADMIN_ACTION';
  payload: any;
} 