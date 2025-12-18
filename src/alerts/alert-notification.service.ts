import { Injectable, Logger } from '@nestjs/common';
import { Alert, AlertSeverity } from './entities/alert.entity';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationPriority } from '../notifications/entities/notification.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';

@Injectable()
export class AlertNotificationService {
  private readonly logger = new Logger(AlertNotificationService.name);

  constructor(
    private readonly notificationsService: NotificationsService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Gửi notification khi có alert mới
   */
  async sendAlertNotification(alert: Alert): Promise<void> {
    try {
      // Tìm users cần notify
      const usersToNotify = await this.getUsersToNotify(alert);

      if (usersToNotify.length === 0) {
        this.logger.warn(`Không tìm thấy user nào để notify cho alert ${alert.id}`);
        return;
      }

      const priority = this.mapSeverityToPriority(alert.severity);

      // Tạo in-app notification cho các users
      for (const user of usersToNotify) {
        await this.notificationsService.createAlertNotification(
          user.id,
          alert.id,
          alert.title,
          alert.message,
          priority,
        );

        this.logger.log(`Đã tạo in-app notification cho user ${user.id}`);
      }

      // Gửi email cho các user (nếu có email)
      await this.sendEmailNotifications(alert, usersToNotify);

      // Gửi SMS (nếu có số điện thoại và alert critical)
      if (alert.severity === AlertSeverity.CRITICAL) {
        await this.sendSMSNotifications(alert, usersToNotify);
      }

      this.logger.log(`Đã gửi notification thành công cho alert ${alert.id}`);
    } catch (error) {
      this.logger.error(`Lỗi khi gửi notification cho alert ${alert.id}`, error);
    }
  }

  /**
   * Tìm users cần được notify
   */
  private async getUsersToNotify(alert: Alert): Promise<User[]> {
    const users: User[] = [];

    // 1. Nếu alert có assignedTo, thêm user đó
    if (alert.assignedTo) {
      const assignedUser = await this.userRepository.findOne({
        where: { id: alert.assignedTo },
      });
      if (assignedUser) {
        users.push(assignedUser);
      }
    }

    // 2. Nếu không có assignedTo hoặc alert critical, notify admins và managers
    if (!alert.assignedTo || alert.severity === AlertSeverity.CRITICAL) {
      const adminsAndManagers = await this.userRepository.find({
        where: [
          { role: UserRole.ADMIN, status: UserStatus.ACTIVE },
          { role: UserRole.MANAGER, status: UserStatus.ACTIVE },
        ],
      });
      users.push(...adminsAndManagers);
    }

    // 3. Nếu alert liên quan đến maintenance, notify technicians
    if (alert.maintenanceId) {
      const technicians = await this.userRepository.find({
        where: { role: UserRole.TECHNICIAN, status: UserStatus.ACTIVE },
      });
      users.push(...technicians);
    }

    // Loại bỏ duplicate users
    const uniqueUsers = Array.from(
      new Map(users.map((user) => [user.id, user])).values(),
    );

    return uniqueUsers;
  }

  /**
   * Gửi email notifications
   */
  private async sendEmailNotifications(alert: Alert, users: User[]): Promise<void> {
    const usersWithEmail = users.filter((user) => user.email);

    if (usersWithEmail.length === 0) {
      return;
    }

    // TODO: Implement actual email sending
    // Ví dụ: Sử dụng nodemailer hoặc service như SendGrid
    this.logger.log(`[Email] Cần gửi email cho ${usersWithEmail.length} users`);

    for (const user of usersWithEmail) {
      this.logger.log(`[Email] To: ${user.email}`);
      this.logger.log(`[Email] Subject: ${alert.title}`);
      this.logger.log(`[Email] Body: ${alert.message}`);

      // Giả lập gửi email thành công
      // Trong production, bạn sẽ gọi email service thật tại đây
      // Ví dụ:
      // await this.emailService.send({
      //   to: user.email,
      //   subject: alert.title,
      //   html: this.buildAlertEmailTemplate(alert),
      // });
    }
  }

  /**
   * Gửi SMS notifications (chỉ cho critical alerts)
   */
  private async sendSMSNotifications(alert: Alert, users: User[]): Promise<void> {
    const usersWithPhone = users.filter(
      (user) => user.phoneNumber && user.phoneNumber.trim() !== '',
    );

    if (usersWithPhone.length === 0) {
      return;
    }

    // TODO: Implement actual SMS sending
    // Ví dụ: Sử dụng Twilio hoặc service SMS khác
    this.logger.log(`[SMS] Cần gửi SMS cho ${usersWithPhone.length} users`);

    for (const user of usersWithPhone) {
      const smsMessage = this.buildSMSMessage(alert);
      this.logger.log(`[SMS] To: ${user.phoneNumber}`);
      this.logger.log(`[SMS] Message: ${smsMessage}`);

      // Giả lập gửi SMS thành công
      // Trong production, bạn sẽ gọi SMS service thật tại đây
      // Ví dụ:
      // await this.smsService.send({
      //   to: user.phoneNumber,
      //   body: smsMessage,
      // });
    }
  }

  /**
   * Build SMS message (short version)
   */
  private buildSMSMessage(alert: Alert): string {
    return `[iGymCare ${alert.severity.toUpperCase()}] ${alert.title}. Chi tiết: Đăng nhập vào hệ thống để xem.`;
  }

  /**
   * Build email HTML template
   */
  private buildAlertEmailTemplate(alert: Alert): string {
    const severityColor = {
      low: '#3498db',
      medium: '#f39c12',
      high: '#e67e22',
      critical: '#e74c3c',
    }[alert.severity];

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${severityColor}; color: white; padding: 20px; border-radius: 5px 5px 0 0; }
            .content { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; border-top: none; }
            .footer { text-align: center; margin-top: 20px; color: #777; font-size: 12px; }
            .button { display: inline-block; padding: 10px 20px; background: ${severityColor}; color: white; text-decoration: none; border-radius: 5px; margin-top: 15px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚨 ${alert.title}</h1>
              <p>Mức độ: <strong>${alert.severity.toUpperCase()}</strong></p>
            </div>
            <div class="content">
              <p>${alert.message}</p>
              <p><strong>Thời gian:</strong> ${alert.createdAt.toLocaleString('vi-VN')}</p>
              <a href="http://localhost:3000/alerts/${alert.id}" class="button">Xem chi tiết</a>
            </div>
            <div class="footer">
              <p>Đây là email tự động từ hệ thống iGymCare. Vui lòng không trả lời email này.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Map alert severity to notification priority
   */
  private mapSeverityToPriority(severity: AlertSeverity): NotificationPriority {
    switch (severity) {
      case AlertSeverity.LOW:
        return NotificationPriority.LOW;
      case AlertSeverity.MEDIUM:
        return NotificationPriority.MEDIUM;
      case AlertSeverity.HIGH:
        return NotificationPriority.HIGH;
      case AlertSeverity.CRITICAL:
        return NotificationPriority.CRITICAL;
      default:
        return NotificationPriority.MEDIUM;
    }
  }
}
