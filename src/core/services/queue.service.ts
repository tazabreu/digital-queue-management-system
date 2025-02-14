import { IQueueRepository } from '../repositories/queue.repository';
import { Queue, QueueEntry, Customer, UUID, QueueEntryStatus, QueueSettings } from '../entities/types';

export class QueueService {
  constructor(private readonly queueRepository: IQueueRepository) {}

  async createQueue(name: string, settings: QueueSettings): Promise<Queue> {
    const queue: Queue = {
      id: crypto.randomUUID(),
      name,
      maxCapacity: settings.maxPartySize * 10, // Default capacity based on party size
      currentSize: 0,
      entries: [],
      averageWaitTime: settings.defaultEstimatedWaitTime,
      isActive: true,
      businessHours: {
        openTime: "09:00",
        closeTime: "22:00",
        timezone: "UTC"
      },
      settings
    };

    return this.queueRepository.save(queue);
  }

  async addCustomerToQueue(
    queueId: UUID,
    customer: Customer,
    partySize: number
  ): Promise<QueueEntry> {
    const queue = await this.queueRepository.findById(queueId);
    if (!queue) {
      throw new Error(`Queue with id ${queueId} not found`);
    }

    // Validate queue is active
    if (!queue.isActive) {
      throw new Error('Queue is not currently active');
    }

    // Validate party size
    if (partySize < queue.settings.minPartySize || partySize > queue.settings.maxPartySize) {
      throw new Error(`Party size must be between ${queue.settings.minPartySize} and ${queue.settings.maxPartySize}`);
    }

    // Check capacity based on number of entries
    if (queue.entries.length >= queue.maxCapacity) {
      throw new Error('Queue is at maximum capacity');
    }

    // Calculate estimated wait time using the (possibly updated) historical average
    const estimatedWaitTime = await this.calculateEstimatedWaitTime(queue, partySize);

    // Determine the next position based on the number of entries
    const nextPosition = queue.entries.length + 1;

    const entry: QueueEntry = {
      id: crypto.randomUUID(),
      customerId: customer.id,
      queueId: queue.id,
      partySize,
      status: QueueEntryStatus.WAITING,
      estimatedWaitTime,
      joinedAt: new Date(),
      position: nextPosition
    };

    // Update queue's current size (as a count of entries)
    await this.queueRepository.update(queueId, {
      currentSize: queue.currentSize + 1
    });

    return this.queueRepository.addEntry(queueId, entry);
  }

  async removeCustomerFromQueue(queueId: UUID, entryId: UUID): Promise<void> {
    const queue = await this.queueRepository.findById(queueId);
    if (!queue) {
      throw new Error(`Queue with id ${queueId} not found`);
    }

    const entry = await this.queueRepository.findEntryById(queueId, entryId);
    if (!entry) {
      throw new Error(`Entry with id ${entryId} not found in queue ${queueId}`);
    }

    // Decrement current size by one (one less entry in the queue)
    await this.queueRepository.update(queueId, {
      currentSize: Math.max(0, queue.currentSize - 1)
    });

    await this.queueRepository.removeEntry(queueId, entryId);

    // Reorder remaining entries so that positions are sequential
    const updatedQueue = await this.queueRepository.findById(queueId);
    if (updatedQueue) {
      for (let i = 0; i < updatedQueue.entries.length; i++) {
        const currentEntry = updatedQueue.entries[i];
        if (currentEntry.position !== i + 1) {
          await this.queueRepository.updateEntry(queueId, currentEntry.id, {
            position: i + 1
          });
        }
      }
    }
  }

  async updateEntryStatus(
    queueId: UUID,
    entryId: UUID,
    status: QueueEntryStatus
  ): Promise<QueueEntry> {
    const entry = await this.queueRepository.findEntryById(queueId, entryId);
    if (!entry) {
      throw new Error(`Entry with id ${entryId} not found in queue ${queueId}`);
    }

    const updates: Partial<QueueEntry> = { status };

    if (status === QueueEntryStatus.NOTIFIED) {
      updates.notifiedAt = new Date();
    } else if (status === QueueEntryStatus.SEATED) {
      const seatedAt = new Date();
      updates.seatedAt = seatedAt;
      // Calculate actual wait time in minutes (difference between seating and joining)
      // Ensure joinedAt is a Date object
      const joinedAt = new Date(entry.joinedAt);
      const actualWaitTime = Math.round((seatedAt.getTime() - joinedAt.getTime()) / (60 * 1000));

      // Update the queue's historical average wait time with a simple averaging method
      const queue = await this.queueRepository.findById(queueId);
      if (queue) {
        const newAverage = Math.round((queue.averageWaitTime + actualWaitTime) / 2);
        await this.queueRepository.update(queueId, { averageWaitTime: newAverage });
      }
    }

    return this.queueRepository.updateEntry(queueId, entryId, updates);
  }

  private async calculateEstimatedWaitTime(queue: Queue, partySize: number): Promise<number> {
    const averageWaitTime = await this.queueRepository.getAverageWaitTime(queue.id);
    
    // Apply a simple multiplier based on party size
    const partyMultiplier = partySize > 4 ? 1.5 : 1;
    
    // Use the count of entries to adjust the multiplier (e.g., every 5 entries add 10% extra wait time)
    const queueSizeMultiplier = Math.ceil(queue.currentSize / 5) * 0.1 + 1;
    
    return Math.round(averageWaitTime * partyMultiplier * queueSizeMultiplier);
  }

  async getQueueStatus(queueId: UUID): Promise<{
    currentSize: number;
    averageWaitTime: number;
    isActive: boolean;
  }> {
    const queue = await this.queueRepository.findById(queueId);
    if (!queue) {
      throw new Error(`Queue with id ${queueId} not found`);
    }

    return {
      currentSize: queue.currentSize,
      averageWaitTime: queue.averageWaitTime,
      isActive: queue.isActive
    };
  }

  async getCustomerPosition(queueId: UUID, entryId: UUID): Promise<{
    position: number;
    estimatedWaitTime: number;
  }> {
    const entry = await this.queueRepository.findEntryById(queueId, entryId);
    if (!entry) {
      throw new Error(`Entry with id ${entryId} not found in queue ${queueId}`);
    }

    return {
      position: entry.position,
      estimatedWaitTime: entry.estimatedWaitTime
    };
  }
}
