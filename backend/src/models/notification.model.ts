import {Entity, model, property} from '@loopback/repository';

@model()
export class Notification extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'number',
    required: true,
  })
  userId: number; // recipient

  @property({
    type: 'string',
    required: true,
  })
  type: string; // 'task_assigned' | 'deadline' | 'reminder'

  @property({
    type: 'string',
    required: true,
  })
  message: string;

  @property({
    type: 'number',
  })
  taskId?: number;

  @property({
    type: 'boolean',
    default: false,
  })
  isRead?: boolean;

  @property({
    type: 'date',
  })
  createdAt?: string;

  constructor(data?: Partial<Notification>) {
    super(data);
  }
}

export interface NotificationRelations {}
export type NotificationWithRelations = Notification & NotificationRelations;
