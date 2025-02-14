import { Queue, UUID, QueueEntry, Customer } from '../entities/types';

export interface IQueueRepository {
  findById(id: UUID): Promise<Queue | null>;
  findAll(): Promise<Queue[]>;
  save(queue: Queue): Promise<Queue>;
  update(id: UUID, queue: Partial<Queue>): Promise<Queue>;
  delete(id: UUID): Promise<void>;
  
  // Queue Entry specific operations
  addEntry(queueId: UUID, entry: QueueEntry): Promise<QueueEntry>;
  removeEntry(queueId: UUID, entryId: UUID): Promise<void>;
  updateEntry(queueId: UUID, entryId: UUID, entry: Partial<QueueEntry>): Promise<QueueEntry>;
  findEntryById(queueId: UUID, entryId: UUID): Promise<QueueEntry | null>;
  
  // Queue analytics
  getAverageWaitTime(queueId: UUID): Promise<number>;
  getCurrentPosition(queueId: UUID, entryId: UUID): Promise<number>;
} 