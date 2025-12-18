import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType, NotificationPriority } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  /**
   * Tạo thông báo mới
   */
  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationRepository.create({
      id: uuidv4(),
      ...createNotificationDto,
      isRead: false,
    });
    return this.notificationRepository.save(notification);
  }

  /**
   * Tạo thông báo bảo trì cho kỹ thuật viên
   */
  async createMaintenanceNotification(
    technicianId: string,
    maintenanceId: string,
    title: string,
    message: string,
    priority: NotificationPriority = NotificationPriority.MEDIUM,
  ): Promise<Notification> {
    return this.create({
      userId: technicianId,
      type: NotificationType.MAINTENANCE,
      title,
      message,
      referenceId: maintenanceId,
      referenceType: 'maintenance',
      priority,
    });
  }

  /**
   * Tạo thông báo sự cố cho kỹ thuật viên
   */
  async createIncidentNotification(
    technicianId: string,
    incidentId: string,
    title: string,
    message: string,
    priority: NotificationPriority = NotificationPriority.HIGH,
  ): Promise<Notification> {
    return this.create({
      userId: technicianId,
      type: NotificationType.INCIDENT,
      title,
      message,
      referenceId: incidentId,
      referenceType: 'incident',
      priority,
    });
  }

  /**
   * Tạo thông báo cảnh báo (IoT sensor)
   */
  async createAlertNotification(
    technicianId: string,
    alertId: string,
    title: string,
    message: string,
    priority: NotificationPriority = NotificationPriority.CRITICAL,
  ): Promise<Notification> {
    return this.create({
      userId: technicianId,
      type: NotificationType.ALERT,
      title,
      message,
      referenceId: alertId,
      referenceType: 'alert',
      priority,
    });
  }

  /**
   * Lấy tất cả thông báo của user
   */
  async findByUser(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lấy thông báo chưa đọc của user
   */
  async findUnreadByUser(userId: string): Promise<Notification[]> {
    return this.notificationRepository.find({
      where: { userId, isRead: false },
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Đếm số thông báo chưa đọc
   */
  async countUnreadByUser(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Đánh dấu thông báo đã đọc
   */
  async markAsRead(id: string): Promise<Notification> {
    const notification = await this.notificationRepository.findOne({ where: { id } });
    if (!notification) {
      throw new Error('Notification not found');
    }
    notification.isRead = true;
    notification.readAt = new Date();
    return this.notificationRepository.save(notification);
  }

  /**
   * Đánh dấu tất cả thông báo của user đã đọc
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true, readAt: new Date() },
    );
  }

  /**
   * Xóa thông báo
   */
  async remove(id: string): Promise<void> {
    await this.notificationRepository.delete(id);
  }

  /**
   * Xóa tất cả thông báo đã đọc của user
   */
  async removeAllRead(userId: string): Promise<void> {
    await this.notificationRepository.delete({ userId, isRead: true });
  }

  /**
   * Gửi thông báo đến các kỹ thuật viên đang on-shift khi có cảnh báo
   * Tự động chọn kỹ thuật viên phù hợp dựa trên work shift
   */
  async notifyOnShiftTechnicians(
    technicianIds: string[],
    type: NotificationType,
    title: string,
    message: string,
    referenceId?: string,
    referenceType?: string,
    priority: NotificationPriority = NotificationPriority.HIGH,
  ): Promise<Notification[]> {
    const notifications: Notification[] = [];

    for (const technicianId of technicianIds) {
      const notification = await this.create({
        userId: technicianId,
        type,
        title,
        message,
        referenceId,
        referenceType,
        priority,
      });
      notifications.push(notification);
    }

    return notifications;
  }
}
