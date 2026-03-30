import {
  repository,
} from '@loopback/repository';
import {
  get,
  getModelSchemaRef,
  param,
  patch,
  response,
  HttpErrors,
} from '@loopback/rest';
import {authenticate} from '@loopback/authentication';
import {SecurityBindings, securityId, UserProfile} from '@loopback/security';
import {inject} from '@loopback/core';
import {Notification} from '../models';
import {NotificationRepository} from '../repositories';

export class NotificationController {
  constructor(
    @repository(NotificationRepository)
    public notificationRepository: NotificationRepository,
  ) {}

  // ─── GET MY NOTIFICATIONS ────────────────────────────────────────────────────
  @authenticate('cookie-jwt')
  @get('/notifications/my')
  @response(200, {
    description: 'Notifications for current user',
    content: {
      'application/json': {
        schema: {
          type: 'array',
          items: getModelSchemaRef(Notification, {includeRelations: true}),
        },
      },
    },
  })
  async findMy(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<Notification[]> {
    const userId = Number(currentUser[securityId]);
    return this.notificationRepository.find({
      where: {userId},
      order: ['createdAt DESC'],
      limit: 50,
    });
  }

  // ─── MARK SINGLE AS READ ─────────────────────────────────────────────────────
  @authenticate('cookie-jwt')
  @patch('/notifications/{id}/read')
  @response(204, {description: 'Notification marked as read'})
  async markRead(
    @param.path.number('id') id: number,
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<void> {
    const userId = Number(currentUser[securityId]);
    const notif = await this.notificationRepository.findById(id);
    if (notif.userId !== userId) {
      throw new HttpErrors.Forbidden('Not your notification');
    }
    await this.notificationRepository.updateById(id, {isRead: true});
  }

  // ─── MARK ALL AS READ ────────────────────────────────────────────────────────
  @authenticate('cookie-jwt')
  @patch('/notifications/mark-all-read')
  @response(204, {description: 'All notifications marked as read'})
  async markAllRead(
    @inject(SecurityBindings.USER) currentUser: UserProfile,
  ): Promise<void> {
    const userId = Number(currentUser[securityId]);
    await this.notificationRepository.updateAll(
      {isRead: true},
      {userId, isRead: false},
    );
  }
}
