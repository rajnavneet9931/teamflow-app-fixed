import {
  Count,
  CountSchema,
  Filter,
  FilterExcludingWhere,
  repository,
  Where,
} from '@loopback/repository';
import {
  post,
  param,
  get,
  getModelSchemaRef,
  patch,
  put,
  del,
  requestBody,
  response,
} from '@loopback/rest';
import {Reminder} from '../models';
import {ReminderRepository} from '../repositories';

export class ReminderController {
  constructor(
    @repository(ReminderRepository)
    public reminderRepository : ReminderRepository,
  ) {}

  @post('/reminders')
  @response(200, {
    description: 'Reminder model instance',
    content: {'application/json': {schema: getModelSchemaRef(Reminder)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Reminder, {
            title: 'NewReminder',
            exclude: ['id'],
          }),
        },
      },
    })
    reminder: Omit<Reminder, 'id'>,
  ): Promise<Reminder> {
    return this.reminderRepository.create(reminder);
  }

  @get('/reminders/count')
  @response(200, {
    description: 'Reminder model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @param.where(Reminder) where?: Where<Reminder>,
  ): Promise<Count> {
    return this.reminderRepository.count(where);
  }

  @get('/reminders')
  @response(200, {
    description: 'Array of Reminder model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Reminder, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(Reminder) filter?: Filter<Reminder>,
  ): Promise<Reminder[]> {
    return this.reminderRepository.find(filter);
  }

  @patch('/reminders')
  @response(200, {
    description: 'Reminder PATCH success count',
    content: {'application/json': {schema: CountSchema}},
  })
  async updateAll(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Reminder, {partial: true}),
        },
      },
    })
    reminder: Reminder,
    @param.where(Reminder) where?: Where<Reminder>,
  ): Promise<Count> {
    return this.reminderRepository.updateAll(reminder, where);
  }

  @get('/reminders/{id}')
  @response(200, {
    description: 'Reminder model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(Reminder, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @param.filter(Reminder, {exclude: 'where'}) filter?: FilterExcludingWhere<Reminder>
  ): Promise<Reminder> {
    return this.reminderRepository.findById(id, filter);
  }

  @patch('/reminders/{id}')
  @response(204, {
    description: 'Reminder PATCH success',
  })
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(Reminder, {partial: true}),
        },
      },
    })
    reminder: Reminder,
  ): Promise<void> {
    await this.reminderRepository.updateById(id, reminder);
  }

  @put('/reminders/{id}')
  @response(204, {
    description: 'Reminder PUT success',
  })
  async replaceById(
    @param.path.number('id') id: number,
    @requestBody() reminder: Reminder,
  ): Promise<void> {
    await this.reminderRepository.replaceById(id, reminder);
  }

  @del('/reminders/{id}')
  @response(204, {
    description: 'Reminder DELETE success',
  })
  async deleteById(@param.path.number('id') id: number): Promise<void> {
    await this.reminderRepository.deleteById(id);
  }
}
