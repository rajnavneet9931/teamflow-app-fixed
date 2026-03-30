import {DefaultCrudRepository} from '@loopback/repository';
import {Notification} from '../models';

/**
 * Polls tasks every 5 minutes and creates a 'deadline' notification
 * for each assigned user if the task is due within the next 24 hours
 * and no such notification was created in the last 24 hours.
 */
export class DeadlineNotifierService {
  private taskRepo: DefaultCrudRepository<any, any, any>;
  private notifRepo: DefaultCrudRepository<Notification, any, any>;

  constructor(
    taskRepo: DefaultCrudRepository<any, any, any>,
    notifRepo: DefaultCrudRepository<Notification, any, any>,
  ) {
    this.taskRepo = taskRepo;
    this.notifRepo = notifRepo;
  }

  start(): void {
    // Run immediately, then every 5 minutes
    this.check().catch(console.error);
    setInterval(() => this.check().catch(console.error), 5 * 60 * 1000);
  }

  private async check(): Promise<void> {
    const now = new Date();
    const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const since24hAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    // Fetch tasks that have a dueDate within the next 24 hours and are not completed
    const allTasks = await this.taskRepo.find() as Array<{
      id: number;
      title: string;
      dueDate?: string;
      status?: string;
      assignedTo?: string;
    }>;

    const upcomingTasks = allTasks.filter(t => {
      if (!t.dueDate || t.status === 'completed') return false;
      const due = new Date(t.dueDate);
      return due >= now && due <= in24h;
    });

    for (const task of upcomingTasks) {
      if (!task.assignedTo) continue;

      let userIds: number[] = [];
      if (task.assignedTo === 'all') {
        // For 'all', skip (would need UserRepository; not injected here)
        continue;
      }
      try {
        userIds = JSON.parse(task.assignedTo) as number[];
      } catch {
        continue;
      }

      for (const uid of userIds) {
        // Check if we already sent a deadline notification for this (task, user) in the last 24h
        const existing = await this.notifRepo.findOne({
          where: {
            userId: uid,
            taskId: task.id,
            type: 'deadline',
            createdAt: {gte: since24hAgo.toISOString()} as any,
          },
        });

        if (!existing) {
          const dueDate = new Date(task.dueDate!);
          const hoursLeft = Math.round((dueDate.getTime() - now.getTime()) / (60 * 60 * 1000));
          await this.notifRepo.create({
            userId: uid,
            type: 'deadline',
            message: `⚠️ Deadline in ~${hoursLeft}h: "${task.title}"`,
            taskId: task.id,
            isRead: false,
            createdAt: now.toISOString(),
          });
        }
      }
    }
  }
}
