import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, MoreThan, IsNull } from 'typeorm';
import { AlertsService } from './alerts.service';
import { AlertNotificationService } from './alert-notification.service';
import { MaintenanceRecord, MaintenanceStatus } from '../tracking/entities/maintenance-record.entity';
import { Equipment, EquipmentStatus } from '../equipment/entities/equipment.entity';
import { Alert, AlertType, AlertSeverity, AlertStatus } from './entities/alert.entity';

@Injectable()
export class AlertsSchedulerService {
  private readonly logger = new Logger(AlertsSchedulerService.name);

  constructor(
    private readonly alertsService: AlertsService,
    private readonly alertNotificationService: AlertNotificationService,
    @InjectRepository(MaintenanceRecord)
    private maintenanceRepository: Repository<MaintenanceRecord>,
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
  ) {}

  /**
   * Chạy mỗi 1 giờ để kiểm tra maintenance due/overdue
   * Cron: Mỗi giờ vào phút 0
   */
  @Cron(CronExpression.EVERY_HOUR)
  async checkMaintenanceDue() {
    this.logger.log('Đang kiểm tra maintenance due/overdue...');

    try {
      const now = new Date();

      // Kiểm tra maintenance sắp đến hạn (trong 3 ngày tới)
      const dueDate = new Date();
      dueDate.setDate(now.getDate() + 3);

      const upcomingMaintenance = await this.maintenanceRepository.find({
        where: {
          status: MaintenanceStatus.SCHEDULED,
          scheduledDate: LessThanOrEqual(dueDate),
        },
        relations: ['equipment'],
      });

      for (const maintenance of upcomingMaintenance) {
        // Kiểm tra xem đã có alert cho maintenance này chưa
        const existingAlert = await this.alertRepository.findOne({
          where: {
            maintenanceId: maintenance.id,
            type: AlertType.MAINTENANCE_DUE,
            status: AlertStatus.ACTIVE,
          },
        });

        if (!existingAlert) {
          const daysUntil = Math.ceil(
            (maintenance.scheduledDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
          );

          let severity = AlertSeverity.LOW;
          if (daysUntil <= 1) {
            severity = AlertSeverity.HIGH;
          } else if (daysUntil <= 2) {
            severity = AlertSeverity.MEDIUM;
          }

          await this.alertsService.create({
            type: AlertType.MAINTENANCE_DUE,
            severity,
            equipmentId: maintenance.equipmentId,
            branchId: maintenance.equipment?.branchId,
            maintenanceId: maintenance.id,
            title: `Bảo trì sắp đến hạn: ${maintenance.equipment?.name}`,
            message: `Lịch bảo trì cho thiết bị "${maintenance.equipment?.name}" sẽ đến hạn trong ${daysUntil} ngày (${maintenance.scheduledDate.toLocaleDateString('vi-VN')}). Vui lòng chuẩn bị thực hiện bảo trì.`,
            assignedTo: maintenance.assignedTo,
          });

          this.logger.log(`Đã tạo alert maintenance_due cho maintenance ${maintenance.id}`);
        }
      }

      // Kiểm tra maintenance quá hạn
      const overdueMaintenance = await this.maintenanceRepository.find({
        where: {
          status: MaintenanceStatus.SCHEDULED,
          scheduledDate: LessThanOrEqual(now),
        },
        relations: ['equipment'],
      });

      for (const maintenance of overdueMaintenance) {
        // Kiểm tra xem đã có alert overdue chưa
        const existingAlert = await this.alertRepository.findOne({
          where: {
            maintenanceId: maintenance.id,
            type: AlertType.MAINTENANCE_OVERDUE,
            status: AlertStatus.ACTIVE,
          },
        });

        if (!existingAlert) {
          const daysOverdue = Math.ceil(
            (now.getTime() - maintenance.scheduledDate.getTime()) / (1000 * 60 * 60 * 24),
          );

          let severity = AlertSeverity.HIGH;
          if (daysOverdue > 7) {
            severity = AlertSeverity.CRITICAL;
          }

          await this.alertsService.create({
            type: AlertType.MAINTENANCE_OVERDUE,
            severity,
            equipmentId: maintenance.equipmentId,
            branchId: maintenance.equipment?.branchId,
            maintenanceId: maintenance.id,
            title: `Bảo trì quá hạn: ${maintenance.equipment?.name}`,
            message: `Lịch bảo trì cho thiết bị "${maintenance.equipment?.name}" đã quá hạn ${daysOverdue} ngày (hạn: ${maintenance.scheduledDate.toLocaleDateString('vi-VN')}). Cần thực hiện ngay!`,
            assignedTo: maintenance.assignedTo,
          });

          this.logger.log(`Đã tạo alert maintenance_overdue cho maintenance ${maintenance.id}`);
        }
      }

      // Kiểm tra equipment cần bảo trì định kỳ (dựa vào maintenance_interval và last_maintenance_date)
      await this.checkEquipmentMaintenanceSchedule();

      this.logger.log('Hoàn thành kiểm tra maintenance due/overdue');
    } catch (error) {
      this.logger.error('Lỗi khi kiểm tra maintenance due/overdue', error);
    }
  }

  /**
   * Kiểm tra thiết bị cần bảo trì định kỳ
   */
  private async checkEquipmentMaintenanceSchedule() {
    const now = new Date();

    const equipment = await this.equipmentRepository.find({
      where: {
        status: EquipmentStatus.ACTIVE,
      },
    });

    for (const eq of equipment) {
      if (eq.maintenanceInterval && eq.lastMaintenanceDate) {
        const nextMaintenanceDate = new Date(eq.lastMaintenanceDate);
        nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + eq.maintenanceInterval);

        const daysUntilMaintenance = Math.ceil(
          (nextMaintenanceDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        // Cảnh báo nếu sắp đến kỳ bảo trì (trong 7 ngày)
        if (daysUntilMaintenance <= 7 && daysUntilMaintenance >= 0) {
          // Kiểm tra xem đã có maintenance record scheduled chưa
          const hasScheduled = await this.maintenanceRepository.findOne({
            where: {
              equipmentId: eq.id,
              status: MaintenanceStatus.SCHEDULED,
              scheduledDate: MoreThan(now),
            },
          });

          // Nếu chưa có maintenance record, tạo alert
          if (!hasScheduled) {
            const existingAlert = await this.alertRepository.findOne({
              where: {
                equipmentId: eq.id,
                type: AlertType.MAINTENANCE_DUE,
                status: AlertStatus.ACTIVE,
                maintenanceId: IsNull(),
              },
            });

            if (!existingAlert) {
              await this.alertsService.create({
                type: AlertType.MAINTENANCE_DUE,
                severity: daysUntilMaintenance <= 3 ? AlertSeverity.HIGH : AlertSeverity.MEDIUM,
                equipmentId: eq.id,
                branchId: eq.branchId,
                title: `Cần lập lịch bảo trì: ${eq.name}`,
                message: `Thiết bị "${eq.name}" cần được bảo trì trong ${daysUntilMaintenance} ngày tới (dự kiến: ${nextMaintenanceDate.toLocaleDateString('vi-VN')}). Vui lòng lập lịch bảo trì định kỳ.`,
              });

              this.logger.log(`Đã tạo alert cho equipment ${eq.id} cần lập lịch bảo trì`);
            }
          }
        }
      }
    }
  }

  /**
   * Chạy mỗi ngày lúc 2 giờ sáng để cleanup alerts cũ
   */
  @Cron('0 2 * * *')
  async cleanupOldAlerts() {
    this.logger.log('Đang cleanup alerts cũ...');
    try {
      await this.alertsService.deleteOldResolved(30);
      this.logger.log('Hoàn thành cleanup alerts cũ');
    } catch (error) {
      this.logger.error('Lỗi khi cleanup alerts cũ', error);
    }
  }
}
