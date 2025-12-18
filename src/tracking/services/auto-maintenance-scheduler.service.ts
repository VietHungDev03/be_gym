import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, IsNull, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Equipment, EquipmentStatus } from '../../equipment/entities/equipment.entity';
import { MaintenanceRecord, MaintenanceType, MaintenanceStatus, MaintenancePriority } from '../entities/maintenance-record.entity';
import { MaintenanceScheduleService } from './maintenance-schedule.service';

@Injectable()
export class AutoMaintenanceSchedulerService {
  private readonly logger = new Logger(AutoMaintenanceSchedulerService.name);

  constructor(
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
    @InjectRepository(MaintenanceRecord)
    private maintenanceRepository: Repository<MaintenanceRecord>,
    private maintenanceScheduleService: MaintenanceScheduleService,
  ) {}

  /**
   * Chạy tự động mỗi ngày lúc 2:00 sáng để kiểm tra và tạo lịch bảo trì
   * Có thể thay đổi thời gian bằng cách sửa CronExpression
   */
  @Cron(CronExpression.EVERY_DAY_AT_2AM)
  async handleAutoMaintenanceScheduling() {
    this.logger.log('Bắt đầu kiểm tra lịch bảo trì tự động...');

    try {
      // Lấy tất cả thiết bị đang hoạt động
      const activeEquipment = await this.equipmentRepository.find({
        where: {
          status: In([EquipmentStatus.ACTIVE, EquipmentStatus.MAINTENANCE]),
        },
      });

      this.logger.log(`Tìm thấy ${activeEquipment.length} thiết bị cần kiểm tra`);

      let scheduledCount = 0;

      for (const equipment of activeEquipment) {
        const isDue = await this.isMaintenanceDue(equipment);

        if (isDue) {
          // Kiểm tra xem đã có lịch bảo trì trong tương lai chưa
          const existingSchedule = await this.maintenanceRepository.findOne({
            where: {
              equipmentId: equipment.id,
              status: In([MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS]),
              scheduledDate: LessThan(this.getFutureDate(7)), // Trong vòng 7 ngày tới
            },
          });

          if (!existingSchedule) {
            await this.createAutoMaintenanceRecord(equipment);
            scheduledCount++;
            this.logger.log(`Đã tạo lịch bảo trì tự động cho thiết bị: ${equipment.name} (ID: ${equipment.id})`);
          }
        }
      }

      this.logger.log(`Hoàn thành: Đã tạo ${scheduledCount} lịch bảo trì tự động`);
    } catch (error) {
      this.logger.error('Lỗi khi tạo lịch bảo trì tự động:', error);
    }
  }

  /**
   * Xử lý các Maintenance Schedules định kỳ
   * Chạy mỗi ngày lúc 1:00 sáng (trước khi chạy auto maintenance)
   */
  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async handleScheduledMaintenance() {
    this.logger.log('Bắt đầu xử lý các lịch bảo trì định kỳ...');

    try {
      const result = await this.maintenanceScheduleService.processAllDueSchedules();

      this.logger.log(
        `Hoàn thành xử lý lịch bảo trì định kỳ: ${result.processed} lịch được xử lý`,
      );

      // Log chi tiết
      for (const item of result.results) {
        if (item.error) {
          this.logger.error(`Lỗi khi xử lý lịch "${item.scheduleName}": ${item.error}`);
        } else {
          this.logger.log(`Lịch "${item.scheduleName}": ${item.message}`);
        }
      }
    } catch (error) {
      this.logger.error('Lỗi khi xử lý lịch bảo trì định kỳ:', error);
    }
  }

  /**
   * Kiểm tra xem thiết bị có cần bảo trì không
   * Dựa trên: last_maintenance_date + maintenance_interval
   */
  private isMaintenanceDue(equipment: Equipment): boolean {
    const today = new Date();
    const intervalDays = equipment.maintenanceInterval || 30;

    // Nếu chưa bao giờ bảo trì, tính từ ngày tạo thiết bị
    const baseDate = equipment.lastMaintenanceDate || equipment.createdAt;

    if (!baseDate) {
      return true; // Nếu không có thông tin, tạo lịch bảo trì ngay
    }

    // Tính ngày bảo trì tiếp theo
    const nextMaintenanceDate = new Date(baseDate);
    nextMaintenanceDate.setDate(nextMaintenanceDate.getDate() + intervalDays);

    // Kiểm tra xem đã đến hoặc quá hạn bảo trì chưa
    return today >= nextMaintenanceDate;
  }

  /**
   * Tạo bản ghi bảo trì tự động
   */
  private async createAutoMaintenanceRecord(equipment: Equipment): Promise<MaintenanceRecord> {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + 1); // Lên lịch cho ngày mai

    const maintenance = this.maintenanceRepository.create({
      id: uuidv4(),
      equipmentId: equipment.id,
      type: MaintenanceType.PREVENTIVE,
      description: `Bảo trì định kỳ tự động cho ${equipment.name}. Chu kỳ: ${equipment.maintenanceInterval} ngày.`,
      priority: MaintenancePriority.MEDIUM,
      scheduledDate: scheduledDate,
      status: MaintenanceStatus.SCHEDULED,
      assignedTo: null,
      notes: 'Lịch bảo trì được tạo tự động bởi hệ thống',
      cost: 0,
    });

    return this.maintenanceRepository.save(maintenance);
  }

  /**
   * Lấy ngày trong tương lai (days ngày kể từ hôm nay)
   */
  private getFutureDate(days: number): Date {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  }

  /**
   * API thủ công để trigger việc tạo lịch bảo trì
   * Có thể gọi từ controller nếu cần
   */
  async manualTrigger(): Promise<{ message: string; scheduledCount: number }> {
    this.logger.log('Kích hoạt thủ công tạo lịch bảo trì tự động...');

    const activeEquipment = await this.equipmentRepository.find({
      where: {
        status: In([EquipmentStatus.ACTIVE, EquipmentStatus.MAINTENANCE]),
      },
    });

    let scheduledCount = 0;

    for (const equipment of activeEquipment) {
      const isDue = await this.isMaintenanceDue(equipment);

      if (isDue) {
        const existingSchedule = await this.maintenanceRepository.findOne({
          where: {
            equipmentId: equipment.id,
            status: In([MaintenanceStatus.SCHEDULED, MaintenanceStatus.IN_PROGRESS]),
          },
        });

        if (!existingSchedule) {
          await this.createAutoMaintenanceRecord(equipment);
          scheduledCount++;
        }
      }
    }

    return {
      message: `Đã kiểm tra ${activeEquipment.length} thiết bị và tạo ${scheduledCount} lịch bảo trì`,
      scheduledCount,
    };
  }
}
