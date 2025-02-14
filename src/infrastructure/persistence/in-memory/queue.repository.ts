import { IQueueRepository } from '../../../core/repositories/queue.repository';
import { Queue, UUID, QueueEntry } from '../../../core/entities/types';

// Reviver function to convert ISO date strings back to Date objects.
// This regex matches strings in the format "YYYY-MM-DDTHH:mm:ss.sssZ"
const dateReviver = (key: any, value: any) => {
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/.test(value)) {
    return new Date(value);
  }
  return value;
};

export class InMemoryQueueRepository implements IQueueRepository {
  private queues: Map<UUID, Queue> = new Map();
  
  async findById(id: UUID): Promise<Queue | null> {
    return this.queues.get(id) || null;
  }

  async findAll(): Promise<Queue[]> {
    return Array.from(this.queues.values());
  }

  async save(queue: Queue): Promise<Queue> {
    // Deep copy the queue while preserving Date objects using the reviver.
    const queueCopy = JSON.parse(JSON.stringify(queue), dateReviver);
    this.queues.set(queue.id, queueCopy);
    return queueCopy;
  }

  async update(id: UUID, queueData: Partial<Queue>): Promise<Queue> {
    const existingQueue = await this.findById(id);
    if (!existingQueue) {
      throw new Error(`Queue with id ${id} not found`);
    }

    const updatedQueue = { ...existingQueue, ...queueData };
    return this.save(updatedQueue);
  }

  async delete(id: UUID): Promise<void> {
    this.queues.delete(id);
  }

  async addEntry(queueId: UUID, entry: QueueEntry): Promise<QueueEntry> {
    const queue = await this.findById(queueId);
    if (!queue) {
      throw new Error(`Queue with id ${queueId} not found`);
    }

    // Add new entry maintaining position order
    const entryCopy = { ...entry };
    queue.entries.push(entryCopy);
    
    // Sort entries by position to maintain order
    queue.entries.sort((a, b) => a.position - b.position);

    await this.save(queue);
    return entryCopy;
  }

  async removeEntry(queueId: UUID, entryId: UUID): Promise<void> {
    const queue = await this.findById(queueId);
    if (!queue) {
      throw new Error(`Queue with id ${queueId} not found`);
    }

    const entryIndex = queue.entries.findIndex(e => e.id === entryId);
    if (entryIndex === -1) {
      throw new Error(`Entry with id ${entryId} not found in queue ${queueId}`);
    }

    // Remove entry
    queue.entries.splice(entryIndex, 1);

    await this.save(queue);
  }

  async updateEntry(queueId: UUID, entryId: UUID, entryData: Partial<QueueEntry>): Promise<QueueEntry> {
    const queue = await this.findById(queueId);
    if (!queue) {
      throw new Error(`Queue with id ${queueId} not found`);
    }

    const entryIndex = queue.entries.findIndex(e => e.id === entryId);
    if (entryIndex === -1) {
      throw new Error(`Entry with id ${entryId} not found in queue ${queueId}`);
    }

    const updatedEntry = { ...queue.entries[entryIndex], ...entryData };
    queue.entries[entryIndex] = updatedEntry;

    // If position was updated, resort entries
    if (entryData.position !== undefined) {
      queue.entries.sort((a, b) => a.position - b.position);
    }
    
    await this.save(queue);
    return updatedEntry;
  }

  async findEntryById(queueId: UUID, entryId: UUID): Promise<QueueEntry | null> {
    const queue = await this.findById(queueId);
    if (!queue) {
      return null;
    }

    return queue.entries.find(e => e.id === entryId) || null;
  }

  async getAverageWaitTime(queueId: UUID): Promise<number> {
    const queue = await this.findById(queueId);
    if (!queue) {
      throw new Error(`Queue with id ${queueId} not found`);
    }

    const completedEntries = queue.entries.filter(e => e.seatedAt);
    if (completedEntries.length === 0) {
      return queue.settings.defaultEstimatedWaitTime;
    }

    const totalWaitTime = completedEntries.reduce((sum, entry) => {
      // Both entry.joinedAt and entry.seatedAt are guaranteed to be Date objects due to our reviver
      const waitTime = entry.seatedAt!.getTime() - entry.joinedAt.getTime();
      return sum + (waitTime / (1000 * 60)); // Convert to minutes
    }, 0);

    return Math.round(totalWaitTime / completedEntries.length);
  }

  async getCurrentPosition(queueId: UUID, entryId: UUID): Promise<number> {
    const entry = await this.findEntryById(queueId, entryId);
    if (!entry) {
      throw new Error(`Entry with id ${entryId} not found in queue ${queueId}`);
    }
    return entry.position;
  }
}
