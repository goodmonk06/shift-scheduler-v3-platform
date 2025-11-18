import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { INotificationAdapter, ConsoleNotificationAdapter } from '../lib/adapters/notification.adapter';
import { EventBus, EventType, createEvent } from '../lib/events/domain-events';
import { logger } from '../lib/logger';
import { NotificationType } from '@prisma/client';

export interface CreateNotificationDto {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class NotificationService {
  private adapter: INotificationAdapter;

  constructor(
    private prisma: PrismaService,
    private eventBus: EventBus,
    adapter?: INotificationAdapter,
  ) {
    // Use provided adapter or default to ConsoleNotificationAdapter
    this.adapter = adapter || new ConsoleNotificationAdapter();
  }

  async create(tenantId: string, createNotificationDto: CreateNotificationDto) {
    const log = logger.child({
      tenantId,
      userId: createNotificationDto.userId,
      action: 'create_notification',
    });

    // Verify user exists
    const user = await this.prisma.user.findFirst({
      where: {
        id: createNotificationDto.userId,
        tenantId,
      },
    });

    if (!user) {
      log.warn('User not found', { userId: createNotificationDto.userId });
      throw new NotFoundException('User not found');
    }

    // Create notification in database
    const notification = await this.prisma.notification.create({
      data: {
        userId: createNotificationDto.userId,
        type: createNotificationDto.type,
        title: createNotificationDto.title,
        message: createNotificationDto.message,
        data: {
          link: createNotificationDto.link,
          ...(createNotificationDto.metadata || {}),
        },
        isRead: false,
        tenantId,
      },
    });

    log.info('Notification created', {
      notificationId: notification.id,
      type: notification.type,
    });

    // Send notification via adapter
    try {
      await this.adapter.send({
        userId: createNotificationDto.userId,
        title: createNotificationDto.title,
        message: createNotificationDto.message,
        type: createNotificationDto.type,
        data: {
          notificationId: notification.id,
          link: createNotificationDto.link,
          ...createNotificationDto.metadata,
        },
      });

      log.debug('Notification sent via adapter');
    } catch (error) {
      log.error('Failed to send notification via adapter', error as Error);
      // Don't fail the request if adapter fails - notification is still saved
    }

    // Publish domain event
    await this.eventBus.publish(
      createEvent(EventType.NOTIFICATION_SENT, notification.id, tenantId, {
        userId: createNotificationDto.userId,
        type: notification.type,
        title: notification.title,
      }),
    );

    return notification;
  }

  async findAll(tenantId: string, userId: string, onlyUnread = false) {
    const log = logger.child({ tenantId, userId, action: 'find_all_notifications' });

    const notifications = await this.prisma.notification.findMany({
      where: {
        tenantId,
        userId,
        ...(onlyUnread && { isRead: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to recent notifications
    });

    log.debug('Notifications retrieved', { count: notifications.length });

    return notifications;
  }

  async findOne(id: string, tenantId: string, userId: string) {
    const log = logger.child({ tenantId, userId, notificationId: id, action: 'find_one_notification' });

    const notification = await this.prisma.notification.findFirst({
      where: {
        id,
        tenantId,
        userId,
      },
    });

    if (!notification) {
      log.warn('Notification not found');
      throw new NotFoundException('Notification not found');
    }

    log.debug('Notification retrieved');

    return notification;
  }

  async markAsRead(id: string, tenantId: string, userId: string) {
    const log = logger.child({ tenantId, userId, notificationId: id, action: 'mark_as_read' });

    await this.findOne(id, tenantId, userId);

    const notification = await this.prisma.notification.update({
      where: { id },
      data: { isRead: true },
    });

    log.info('Notification marked as read');

    return notification;
  }

  async markAllAsRead(tenantId: string, userId: string) {
    const log = logger.child({ tenantId, userId, action: 'mark_all_as_read' });

    const result = await this.prisma.notification.updateMany({
      where: {
        tenantId,
        userId,
        isRead: false,
      },
      data: { isRead: true },
    });

    log.info('All notifications marked as read', { count: result.count });

    return result;
  }

  async delete(id: string, tenantId: string, userId: string) {
    const log = logger.child({ tenantId, userId, notificationId: id, action: 'delete_notification' });

    await this.findOne(id, tenantId, userId);

    await this.prisma.notification.delete({
      where: { id },
    });

    log.info('Notification deleted');
  }

  async getUnreadCount(tenantId: string, userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        tenantId,
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Helper methods to send specific notification types
   */

  async notifyShiftAssigned(
    tenantId: string,
    staffUserId: string,
    shiftDetails: { date: Date; patternName: string; startTime: string; endTime: string },
  ) {
    return this.create(tenantId, {
      userId: staffUserId,
      type: NotificationType.SHIFT_ASSIGNED,
      title: 'New Shift Assigned',
      message: `You have been assigned a ${shiftDetails.patternName} shift on ${shiftDetails.date.toDateString()} from ${shiftDetails.startTime} to ${shiftDetails.endTime}`,
      metadata: { shiftDetails },
    });
  }

  async notifyShiftSwapRequested(
    tenantId: string,
    targetUserId: string,
    requesterName: string,
    swapId: string,
  ) {
    return this.create(tenantId, {
      userId: targetUserId,
      type: NotificationType.SWAP_REQUESTED,
      title: 'Shift Swap Request',
      message: `${requesterName} has requested to swap shifts with you`,
      link: `/shift-swaps/${swapId}`,
      metadata: { swapId, requesterName },
    });
  }

  async notifySwapApproved(
    tenantId: string,
    requesterUserId: string,
    swapId: string,
  ) {
    return this.create(tenantId, {
      userId: requesterUserId,
      type: NotificationType.SWAP_APPROVED,
      title: 'Shift Swap Approved',
      message: 'Your shift swap request has been approved',
      link: `/shift-swaps/${swapId}`,
      metadata: { swapId },
    });
  }

  async notifySwapRejected(
    tenantId: string,
    requesterUserId: string,
    swapId: string,
    reason?: string,
  ) {
    return this.create(tenantId, {
      userId: requesterUserId,
      type: NotificationType.SWAP_REJECTED,
      title: 'Shift Swap Rejected',
      message: reason || 'Your shift swap request has been rejected',
      link: `/shift-swaps/${swapId}`,
      metadata: { swapId, reason },
    });
  }

  async notifyLeaveApproved(
    tenantId: string,
    staffUserId: string,
    leaveId: string,
  ) {
    return this.create(tenantId, {
      userId: staffUserId,
      type: NotificationType.LEAVE_APPROVED,
      title: 'Leave Request Approved',
      message: 'Your leave request has been approved',
      link: `/leave-requests/${leaveId}`,
      metadata: { leaveId },
    });
  }

  async notifyLeaveRejected(
    tenantId: string,
    staffUserId: string,
    leaveId: string,
    reason?: string,
  ) {
    return this.create(tenantId, {
      userId: staffUserId,
      type: NotificationType.LEAVE_REJECTED,
      title: 'Leave Request Rejected',
      message: reason || 'Your leave request has been rejected',
      link: `/leave-requests/${leaveId}`,
      metadata: { leaveId, reason },
    });
  }
}
