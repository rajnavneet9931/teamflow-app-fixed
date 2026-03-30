import {Entity, model, property} from '@loopback/repository';

@model()
export class Reminder extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'date',
    required: true,
  })
  remindAt: string;

  @property({
    type: 'boolean',
    default: false,
  })
  isSent?: boolean;

  @property({
    type: 'date',
  })
  createdAt?: string;

  @property({
    type: 'number',
    required: true,
  })
  taskId: number;

  @property({
    type: 'number',
    required: true,
  })
  userId: number;


  constructor(data?: Partial<Reminder>) {
    super(data);
  }
}

export interface ReminderRelations {
  // describe navigational properties here
}

export type ReminderWithRelations = Reminder & ReminderRelations;
