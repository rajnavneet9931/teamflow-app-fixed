import {Entity, model, property} from '@loopback/repository';

@model()
export class CommentModel extends Entity {
  @property({
    type: 'number',
    id: true,
    generated: true,
  })
  id?: number;

  @property({
    type: 'string',
    required: true,
  })
  content: string;

  @property({
    type: 'date',
  })
  createdAt?: string;

  @property({
    type: 'number',
    required: true,
  })
  taskId?: number;

  @property({
    type: 'number',
    required: true,
  })
  userId: number;


  constructor(data?: Partial<CommentModel>) {
    super(data);
  }
}

export interface CommentModelRelations {
  // describe navigational properties here
}

export type CommentModelWithRelations = CommentModel & CommentModelRelations;
