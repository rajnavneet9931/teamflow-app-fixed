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
  HttpErrors,
} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {inject} from '@loopback/core';
import {TaskModel} from '../models';
import {TaskModelRepository, NotificationRepository, UserRepository} from '../repositories';

/** Check if userId is in the assignedTo JSON string (array or 'all') */
function isAssignee(assignedTo: string | undefined, userId: number): boolean {
  if (!assignedTo) return false;
  if (assignedTo === 'all') return true;
  try {
    const ids: number[] = JSON.parse(assignedTo);
    return ids.includes(userId);
  } catch {
    return false;
  }
}

export class TasksController {
  constructor(
    @repository(TaskModelRepository)
    public taskModelRepository : TaskModelRepository,
    @repository(NotificationRepository)
    public notificationRepository: NotificationRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
  ) {}

  // ─── CREATE ─────────────────────────────────────────────────────────────────
  @authenticate('cookie-jwt')
  @post('/tasks')
  @response(200, {
    description: 'TaskModel model instance',
    content: {'application/json': {schema: getModelSchemaRef(TaskModel)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(TaskModel, {
            title: 'NewTaskModel',
            exclude: ['id', 'createdBy'],
          }),
        },
      },
    })
    taskModel: Omit<TaskModel, 'id'>,
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<TaskModel> {
    if (!taskModel.dueDate) {
      throw new HttpErrors.UnprocessableEntity('Due date is required for every task');
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(taskModel.dueDate) < today) {
      throw new HttpErrors.UnprocessableEntity('Due date cannot be in the past');
    }
    taskModel.createdBy = Number(currentUser[securityId]);
    const created = await this.taskModelRepository.create(taskModel);

    // ── Auto-notify assigned users ───────────────────────────────────────────
    if (taskModel.assignedTo) {
      const creatorId = Number(currentUser[securityId]);
      let userIds: number[] = [];

      if (taskModel.assignedTo === 'all') {
        // Fetch ALL users, exclude the creator
        const allUsers = await this.userRepository.find();
        userIds = allUsers
          .map(u => u.id!)
          .filter(uid => uid !== creatorId);
      } else {
        try {
          userIds = (JSON.parse(taskModel.assignedTo) as number[])
            .filter(uid => uid !== creatorId);
        } catch { /* malformed assignedTo, skip */ }
      }

      const notifPromises = userIds.map(uid =>
        this.notificationRepository.create({
          userId: uid,
          type: 'task_assigned',
          message: `You were assigned to: "${created.title}"`,
          taskId: created.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        }),
      );
      await Promise.all(notifPromises);
    }

    return created;
  }

  // ─── GET MY TASKS (created by me OR assigned to me) ─────────────────────────
  @authenticate('cookie-jwt')
  @get('/tasks')
  @response(200, {
    description: 'Tasks visible to the current user',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(TaskModel, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<TaskModel[]> {
    const userId = Number(currentUser[securityId]);
    // Fetch all tasks where I am creator, then filter assignedTo in-memory
    // (assignedTo is a JSON string so SQL can't filter it directly)
    const allTasks = await this.taskModelRepository.find();
    return allTasks.filter(
      t => t.createdBy === userId || isAssignee(t.assignedTo, userId),
    );
  }

  // ─── GET SINGLE TASK (must be creator or assignee) ──────────────────────────
  @authenticate('cookie-jwt')
  @get('/tasks/{id}')
  @response(200, {
    description: 'TaskModel model instance',
    content: {
      'application/json': {
        schema: getModelSchemaRef(TaskModel, {includeRelations: true}),
      },
    },
  })
  async findById(
    @param.path.number('id') id: number,
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.filter(TaskModel, {exclude: 'where'}) filter?: FilterExcludingWhere<TaskModel>,
  ): Promise<TaskModel> {
    const task = await this.taskModelRepository.findById(id, filter);
    const userId = Number(currentUser[securityId]);
    if (task.createdBy !== userId && !isAssignee(task.assignedTo, userId)) {
      throw new HttpErrors.Forbidden('You are not allowed to view this task');
    }
    return task;
  }

  // ─── UPDATE TASK ─────────────────────────────────────────────────────────────
  // Creator → can edit everything
  // Assignee → can only update status
  @authenticate('cookie-jwt')
  @patch('/tasks/{id}')
  @response(204, {description: 'TaskModel PATCH success'})
  async updateById(
    @param.path.number('id') id: number,
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(TaskModel, {partial: true}),
        },
      },
    })
    taskModel: TaskModel,
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<void> {
    const task = await this.taskModelRepository.findById(id);
    const userId = Number(currentUser[securityId]);

    if (task.createdBy === userId) {
      // Creator can update any field
      await this.taskModelRepository.updateById(id, taskModel);
    } else if (isAssignee(task.assignedTo, userId)) {
      // Assignee can only update status
      if (Object.keys(taskModel).some(k => k !== 'status')) {
        throw new HttpErrors.Forbidden('Assignees can only update the task status');
      }
      await this.taskModelRepository.updateById(id, {status: taskModel.status});
    } else {
      throw new HttpErrors.Forbidden('You are not allowed to edit this task');
    }
  }

  // ─── DELETE TASK (creator only) ──────────────────────────────────────────────
  @authenticate('cookie-jwt')
  @del('/tasks/{id}')
  @response(204, {description: 'TaskModel DELETE success'})
  async deleteById(
    @param.path.number('id') id: number,
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<void> {
    const task = await this.taskModelRepository.findById(id);
    const userId = Number(currentUser[securityId]);
    if (task.createdBy !== userId) {
      throw new HttpErrors.Forbidden('Only the task creator can delete this task');
    }

    // Notify assigned users that the task was deleted
    if (task.assignedTo) {
      let userIds: number[] = [];
      if (task.assignedTo === 'all') {
        const allUsers = await this.userRepository.find();
        userIds = allUsers.map(u => u.id!).filter(uid => uid !== userId);
      } else {
        try {
          userIds = (JSON.parse(task.assignedTo) as number[]).filter(uid => uid !== userId);
        } catch { /* skip */ }
      }
      const notifPromises = userIds.map(uid =>
        this.notificationRepository.create({
          userId: uid,
          type: 'task_deleted',
          message: `Task deleted: "${task.title}"`,
          taskId: task.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        }),
      );
      await Promise.all(notifPromises);
    }

    await this.taskModelRepository.deleteById(id);
  }

  // ─── COUNT (utility, authenticated) ─────────────────────────────────────────
  @authenticate('cookie-jwt')
  @get('/tasks/count')
  @response(200, {
    description: 'TaskModel model count',
    content: {'application/json': {schema: CountSchema}},
  })
  async count(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
    @param.where(TaskModel) where?: Where<TaskModel>,
  ): Promise<Count> {
    const userId = Number(currentUser[securityId]);
    const ownWhere = {
      and: [
        where ?? {},
        {or: [{createdBy: userId}, {assignedTo: userId}]},
      ],
    };
    return this.taskModelRepository.count(ownWhere as Where<TaskModel>);
  }
}
