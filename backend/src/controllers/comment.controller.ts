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
  del,
  requestBody,
  response,
  HttpErrors,
} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {inject} from '@loopback/core';
import {CommentModel} from '../models';
import {CommentModelRepository, TaskModelRepository, NotificationRepository, UserRepository} from '../repositories';

export class CommentController {
  constructor(
    @repository(CommentModelRepository)
    public commentModelRepository : CommentModelRepository,
    @repository(TaskModelRepository)
    public taskModelRepository: TaskModelRepository,
    @repository(NotificationRepository)
    public notificationRepository: NotificationRepository,
    @repository(UserRepository)
    public userRepository: UserRepository,
  ) {}

  // ─── POST COMMENT (auth required, userId comes from cookie) ──────────────────
  @authenticate('cookie-jwt')
  @post('/comments')
  @response(200, {
    description: 'CommentModel model instance',
    content: {'application/json': {schema: getModelSchemaRef(CommentModel)}},
  })
  async create(
    @requestBody({
      content: {
        'application/json': {
          schema: getModelSchemaRef(CommentModel, {
            title: 'NewCommentModel',
            exclude: ['id', 'userId'],
          }),
        },
      },
    })
    commentModel: Omit<CommentModel, 'id' | 'userId'>,
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<CommentModel> {
    const commenterId = Number(currentUser[securityId]);
    const newComment = {
      ...commentModel,
      userId: commenterId,
      createdAt: new Date().toISOString(),
    };
    const created = await this.commentModelRepository.create(newComment);

    // ── Notify task participants about the new comment ─────────────────────
    try {
      const task = await this.taskModelRepository.findById(commentModel.taskId);
      const recipientIds = new Set<number>();

      // Add task creator
      if (task.createdBy && task.createdBy !== commenterId) {
        recipientIds.add(task.createdBy);
      }

      // Add assigned users
      if (task.assignedTo) {
        if (task.assignedTo === 'all') {
          const allUsers = await this.userRepository.find();
          allUsers.forEach(u => { if (u.id && u.id !== commenterId) recipientIds.add(u.id); });
        } else {
          try {
            const ids: number[] = JSON.parse(task.assignedTo);
            ids.forEach(uid => { if (uid !== commenterId) recipientIds.add(uid); });
          } catch { /* skip */ }
        }
      }

      // Create notifications
      const notifPromises = Array.from(recipientIds).map(uid =>
        this.notificationRepository.create({
          userId: uid,
          type: 'comment',
          message: `New comment on "${task.title}"`,
          taskId: task.id,
          isRead: false,
          createdAt: new Date().toISOString(),
        }),
      );
      await Promise.all(notifPromises);
    } catch (e) {
      console.error('[Notification] Failed to notify on comment:', e);
    }

    return created;
  }

  // ─── GET COMMENTS FOR A TASK (auth required) ─────────────────────────────────
  @authenticate('cookie-jwt')
  @get('/comments')
  @response(200, {
    description: 'Array of CommentModel model instances',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(CommentModel, {includeRelations: true}),
        },
      },
    },
  })
  async find(
    @param.filter(CommentModel) filter?: Filter<CommentModel>,
  ): Promise<CommentModel[]> {
    return this.commentModelRepository.find(filter);
  }

  // ─── DELETE COMMENT (only the comment author) ─────────────────────────────────
  @authenticate('cookie-jwt')
  @del('/comments/{id}')
  @response(204, {description: 'CommentModel DELETE success'})
  async deleteById(
    @param.path.number('id') id: number,
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<void> {
    const comment = await this.commentModelRepository.findById(id);
    if (comment.userId !== Number(currentUser[securityId])) {
      throw new HttpErrors.Forbidden('You can only delete your own comments');
    }
    await this.commentModelRepository.deleteById(id);
  }
}
