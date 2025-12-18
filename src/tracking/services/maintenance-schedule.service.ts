import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual, IsNull, Not } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { MaintenanceSchedule } from '../entities/maintenance-schedule.entity';
import { MaintenanceRecord, MaintenanceStatus } from '../entities/maintenance-record.entity';
import { Equipment } from '../../equipment/entities/equipment.entity';
import { CreateMaintenanceScheduleDto } from '../dto/create-maintenance-schedule.dto';
import { UpdateMaintenanceScheduleDto } from '../dto/update-maintenance-schedule.dto';

@Injectable()
export class MaintenanceScheduleService {
  constructor(
    @InjectRepository(MaintenanceSchedule)
    private scheduleRepository: Repository<MaintenanceSchedule>,
    @InjectRepository(MaintenanceRecord)
    private maintenanceRepository: Repository<MaintenanceRecord>,
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
  ) {}

  /**
   * Tạo lịch bảo trì định kỳ mới
   */
  async create(createDto: CreateMaintenanceScheduleDto, userId: string) {
    // Validate: Phải có ít nhất 1 trong 3 phạm vi
    if (!createDto.equipmentId && !createDto.equipmentType && !createDto.branchId) {
      throw new BadRequestException('Phải chọn ít nhất một trong: thiết bị, loại thiết bị, hoặc chi nhánh');
    }

    // Validate: Nếu chọn equipmentId, phải tồn tại
    if (createDto.equipmentId) {
      const equipment = await this.equipmentRepository.findOne({
        where: { id: createDto.equipmentId },
      });
      if (!equipment) {
        throw new NotFoundException('Không tìm thấy thiết bị');
      }
    }

    const schedule = this.scheduleRepository.create({
      id: uuidv4(),
      ...createDto,
      startDate: new Date(createDto.startDate),
      nextScheduledDate: new Date(createDto.startDate), // Ban đầu = startDate
      endDate: createDto.endDate ? new Date(createDto.endDate) : null,
      createdBy: userId,
    });

    return this.scheduleRepository.save(schedule);
  }

  /**
   * Lấy tất cả lịch bảo trì
   */
  async findAll(isActive?: boolean, branchId?: string) {
    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    return this.scheduleRepository.find({
      where,
      relations: ['equipment', 'assignedUser'],
      order: { nextScheduledDate: 'ASC' },
    });
  }

  /**
   * Lấy một lịch bảo trì theo ID
   */
  async findOne(id: string) {
    const schedule = await this.scheduleRepository.findOne({
      where: { id },
      relations: ['equipment', 'assignedUser', 'creator'],
    });

    if (!schedule) {
      throw new NotFoundException('Không tìm thấy lịch bảo trì');
    }

    return schedule;
  }

  /**
   * Cập nhật lịch bảo trì
   */
  async update(id: string, updateDto: UpdateMaintenanceScheduleDto) {
    const schedule = await this.findOne(id);

    const updateData: any = { ...updateDto };

    if (updateDto.startDate) {
      updateData.startDate = new Date(updateDto.startDate);
    }

    if (updateDto.nextScheduledDate) {
      updateData.nextScheduledDate = new Date(updateDto.nextScheduledDate);
    }

    if (updateDto.endDate) {
      updateData.endDate = new Date(updateDto.endDate);
    }

    await this.scheduleRepository.update(id, updateData);
    return this.findOne(id);
  }

  /**
   * Xóa lịch bảo trì
   */
  async delete(id: string) {
    const schedule = await this.findOne(id);
    await this.scheduleRepository.remove(schedule);
    return { message: 'Đã xóa lịch bảo trì thành công' };
  }

  /**
   * Tìm các thiết bị phù hợp với lịch bảo trì
   */
  async findMatchingEquipment(scheduleId: string): Promise<Equipment[]> {
    const schedule = await this.findOne(scheduleId);
    const where: any = {};

    // Trường hợp 1: Thiết bị cụ thể
    if (schedule.equipmentId) {
      where.id = schedule.equipmentId;
    }

    // Trường hợp 2: Theo loại thiết bị
    if (schedule.equipmentType) {
      where.type = schedule.equipmentType;
    }

    // Trường hợp 3: Theo chi nhánh
    if (schedule.branchId) {
      where.branchId = schedule.branchId;
    }

    const equipment = await this.equipmentRepository.find({ where });
    return equipment;
  }

  /**
   * Tạo maintenance records cho lịch bảo trì
   * Được gọi tự động bởi scheduler
   */
  async generateMaintenanceRecords(scheduleId: string) {
    const schedule = await this.findOne(scheduleId);

    // Kiểm tra lịch có active không
    if (!schedule.isActive) {
      return { message: 'Lịch bảo trì không còn hoạt động', created: 0 };
    }

    // Kiểm tra đã đến ngày bảo trì chưa
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const nextScheduled = new Date(schedule.nextScheduledDate);
    nextScheduled.setHours(0, 0, 0, 0);

    if (nextScheduled > today) {
      return { message: 'Chưa đến ngày bảo trì', created: 0 };
    }

    // Kiểm tra đã qua ngày kết thúc chưa
    if (schedule.endDate) {
      const endDate = new Date(schedule.endDate);
      endDate.setHours(0, 0, 0, 0);
      if (today > endDate) {
        // Tự động deactivate lịch
        await this.scheduleRepository.update(scheduleId, { isActive: false });
        return { message: 'Lịch bảo trì đã hết hạn', created: 0 };
      }
    }

    // Tìm các thiết bị phù hợp
    const equipment = await this.findMatchingEquipment(scheduleId);

    if (equipment.length === 0) {
      return { message: 'Không tìm thấy thiết bị phù hợp', created: 0 };
    }

    // Tạo maintenance records cho mỗi thiết bị
    const records = equipment.map((eq) => {
      return this.maintenanceRepository.create({
        id: uuidv4(),
        equipmentId: eq.id,
        type: schedule.maintenanceType,
        description: schedule.description || `Bảo trì định kỳ: ${schedule.name}`,
        priority: schedule.priority,
        scheduledDate: schedule.nextScheduledDate,
        status: MaintenanceStatus.SCHEDULED,
        assignedTo: schedule.assignedTo,
      });
    });

    // Lưu tất cả records
    const savedRecords = await this.maintenanceRepository.save(records);

    // Cập nhật nextScheduledDate
    const newNextDate = new Date(schedule.nextScheduledDate);
    newNextDate.setDate(newNextDate.getDate() + schedule.recurrenceInterval);

    await this.scheduleRepository.update(scheduleId, {
      nextScheduledDate: newNextDate,
    });

    return {
      message: `Đã tạo ${savedRecords.length} bản ghi bảo trì`,
      created: savedRecords.length,
      nextScheduledDate: newNextDate,
    };
  }

  /**
   * Lấy các lịch bảo trì cần xử lý (đã đến hoặc quá ngày)
   */
  async getSchedulesDueForProcessing(): Promise<MaintenanceSchedule[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return this.scheduleRepository.find({
      where: {
        isActive: true,
        nextScheduledDate: LessThanOrEqual(today),
      },
    });
  }

  /**
   * Xử lý tất cả lịch bảo trì đến hạn
   * Được gọi bởi cron job
   */
  async processAllDueSchedules() {
    const schedules = await this.getSchedulesDueForProcessing();

    const results = [];
    for (const schedule of schedules) {
      try {
        const result = await this.generateMaintenanceRecords(schedule.id);
        results.push({
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          ...result,
        });
      } catch (error) {
        results.push({
          scheduleId: schedule.id,
          scheduleName: schedule.name,
          error: error.message,
        });
      }
    }

    return {
      processed: schedules.length,
      results,
    };
  }
}
