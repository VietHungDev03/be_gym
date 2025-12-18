import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, MoreThanOrEqual, LessThanOrEqual, Between } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { MaintenanceRecord, MaintenanceStatus } from '../entities/maintenance-record.entity';
import { CreateMaintenanceDto } from '../dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from '../dto/update-maintenance.dto';
import { MaintenanceFeedbackDto } from '../dto/maintenance-feedback.dto';
import { Equipment } from '../../equipment/entities/equipment.entity';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceRecord)
    private maintenanceRepository: Repository<MaintenanceRecord>,
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
  ) {}

  async create(createMaintenanceDto: CreateMaintenanceDto) {
    const maintenance = this.maintenanceRepository.create({
      id: uuidv4(),
      ...createMaintenanceDto,
      scheduledDate: new Date(createMaintenanceDto.scheduledDate),
      status: MaintenanceStatus.SCHEDULED,
    });

    return this.maintenanceRepository.save(maintenance);
  }

  async findAll(status?: MaintenanceStatus, equipmentId?: string) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (equipmentId) {
      where.equipmentId = equipmentId;
    }

    return this.maintenanceRepository.find({
      where,
      order: { scheduledDate: 'DESC' },
    });
  }

  async findOne(id: string) {
    const maintenance = await this.maintenanceRepository.findOne({
      where: { id },
    });

    if (!maintenance) {
      throw new NotFoundException('Không tìm thấy lịch bảo trì');
    }

    return maintenance;
  }

  async update(id: string, updateMaintenanceDto: UpdateMaintenanceDto) {
    const maintenance = await this.findOne(id);

    const updateData: any = { ...updateMaintenanceDto };

    // Nếu status chuyển sang completed, tự động set actualDate
    if (updateMaintenanceDto.status === MaintenanceStatus.COMPLETED && !updateMaintenanceDto.actualDate) {
      updateData.actualDate = new Date();
    }

    await this.maintenanceRepository.update(id, updateData);

    // Nếu bảo trì đã hoàn thành, cập nhật last_maintenance_date của thiết bị
    if (updateMaintenanceDto.status === MaintenanceStatus.COMPLETED) {
      await this.updateEquipmentLastMaintenanceDate(
        maintenance.equipmentId,
        updateData.actualDate || new Date(),
      );
    }

    return this.findOne(id);
  }

  /**
   * Cập nhật ngày bảo trì gần nhất của thiết bị
   */
  private async updateEquipmentLastMaintenanceDate(
    equipmentId: string,
    maintenanceDate: Date,
  ): Promise<void> {
    await this.equipmentRepository.update(equipmentId, {
      lastMaintenanceDate: maintenanceDate,
    });
  }

  async getUpcoming(daysAhead: number = 7) {
    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(now.getDate() + daysAhead);

    return this.maintenanceRepository.find({
      where: {
        status: MaintenanceStatus.SCHEDULED,
        scheduledDate: Between(now, futureDate),
      },
      order: { scheduledDate: 'ASC' },
    });
  }

  /**
   * Submit phản hồi bảo trì từ kỹ thuật viên
   */
  async submitFeedback(id: string, feedbackDto: MaintenanceFeedbackDto, technicianId: string) {
    const maintenance = await this.findOne(id);

    // Kiểm tra xem maintenance có đang in_progress hoặc completed không
    if (maintenance.status !== MaintenanceStatus.IN_PROGRESS && maintenance.status !== MaintenanceStatus.COMPLETED) {
      throw new BadRequestException('Chỉ có thể submit feedback khi bảo trì đang thực hiện hoặc đã hoàn thành');
    }

    // Kiểm tra xem technician có được assign không
    if (maintenance.assignedTo !== technicianId) {
      throw new BadRequestException('Bạn không được phép submit feedback cho bảo trì này');
    }

    // Cập nhật feedback
    const updateData: any = {
      ...feedbackDto,
      feedbackSubmittedAt: new Date(),
      status: MaintenanceStatus.COMPLETED,
      completedBy: technicianId,
    };

    // Nếu chưa có actualDate, set actualDate
    if (!maintenance.actualDate) {
      updateData.actualDate = new Date();
    }

    await this.maintenanceRepository.update(id, updateData);

    // Cập nhật last_maintenance_date của thiết bị
    await this.updateEquipmentLastMaintenanceDate(
      maintenance.equipmentId,
      updateData.actualDate || maintenance.actualDate || new Date(),
    );

    return this.findOne(id);
  }

  /**
   * Lấy thống kê bảo trì với filter
   */
  async getMaintenanceStatistics(options?: {
    equipmentId?: string;
    assignedTo?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { equipmentId, assignedTo, startDate, endDate } = options || {};

    const queryBuilder = this.maintenanceRepository.createQueryBuilder('maintenance');

    // Apply filters
    if (equipmentId) {
      queryBuilder.andWhere('maintenance.equipment_id = :equipmentId', { equipmentId });
    }
    if (assignedTo) {
      queryBuilder.andWhere('maintenance.assigned_to = :assignedTo', { assignedTo });
    }
    if (startDate) {
      queryBuilder.andWhere('maintenance.scheduled_date >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('maintenance.scheduled_date <= :endDate', { endDate });
    }

    // Get total count
    const total = await queryBuilder.getCount();

    // Get count by status
    const [scheduled, inProgress, completed, cancelled] = await Promise.all([
      queryBuilder.clone().andWhere('maintenance.status = :status', { status: MaintenanceStatus.SCHEDULED }).getCount(),
      queryBuilder.clone().andWhere('maintenance.status = :status', { status: MaintenanceStatus.IN_PROGRESS }).getCount(),
      queryBuilder.clone().andWhere('maintenance.status = :status', { status: MaintenanceStatus.COMPLETED }).getCount(),
      queryBuilder.clone().andWhere('maintenance.status = :status', { status: MaintenanceStatus.CANCELLED }).getCount(),
    ]);

    // Get count by type
    const typeQueryBuilder = queryBuilder.clone();
    const typeResults = await typeQueryBuilder
      .select('maintenance.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('maintenance.type')
      .getRawMany();

    const byType = typeResults.reduce((acc, row) => {
      acc[row.type] = parseInt(row.count);
      return acc;
    }, {});

    // Get count by priority
    const priorityQueryBuilder = queryBuilder.clone();
    const priorityResults = await priorityQueryBuilder
      .select('maintenance.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('maintenance.priority')
      .getRawMany();

    const byPriority = priorityResults.reduce((acc, row) => {
      acc[row.priority] = parseInt(row.count);
      return acc;
    }, {});

    // Calculate average completion time (in hours)
    const completedMaintenance = await queryBuilder
      .clone()
      .andWhere('maintenance.status = :status', { status: MaintenanceStatus.COMPLETED })
      .andWhere('maintenance.actual_date IS NOT NULL')
      .andWhere('maintenance.scheduled_date IS NOT NULL')
      .getMany();

    const totalCompletionTime = completedMaintenance.reduce((sum, m) => {
      if (m.actualDate && m.scheduledDate) {
        const diff = m.actualDate.getTime() - m.scheduledDate.getTime();
        return sum + diff;
      }
      return sum;
    }, 0);

    const avgCompletionTimeHours =
      completedMaintenance.length > 0
        ? Math.round((totalCompletionTime / completedMaintenance.length / (1000 * 60 * 60)) * 10) / 10
        : 0;

    // Count overdue maintenance
    const now = new Date();
    const overdue = await queryBuilder
      .clone()
      .andWhere('maintenance.status = :status', { status: MaintenanceStatus.SCHEDULED })
      .andWhere('maintenance.scheduled_date < :now', { now })
      .getCount();

    return {
      total,
      byStatus: {
        scheduled,
        inProgress,
        completed,
        cancelled,
        overdue,
      },
      byType,
      byPriority,
      avgCompletionTimeHours,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
    };
  }

  /**
   * Lấy danh sách bảo trì với filter và phân trang
   */
  async getMaintenanceList(options?: {
    page?: number;
    limit?: number;
    equipmentId?: string;
    assignedTo?: string;
    status?: MaintenanceStatus;
    startDate?: Date;
    endDate?: Date;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const {
      page = 1,
      limit = 10,
      equipmentId,
      assignedTo,
      status,
      startDate,
      endDate,
      sortBy = 'scheduledDate',
      sortOrder = 'DESC',
    } = options || {};

    const queryBuilder = this.maintenanceRepository.createQueryBuilder('maintenance');

    // Apply filters
    if (equipmentId) {
      queryBuilder.andWhere('maintenance.equipment_id = :equipmentId', { equipmentId });
    }
    if (assignedTo) {
      queryBuilder.andWhere('maintenance.assigned_to = :assignedTo', { assignedTo });
    }
    if (status) {
      queryBuilder.andWhere('maintenance.status = :status', { status });
    }
    if (startDate) {
      queryBuilder.andWhere('maintenance.scheduled_date >= :startDate', { startDate });
    }
    if (endDate) {
      queryBuilder.andWhere('maintenance.scheduled_date <= :endDate', { endDate });
    }

    // Apply sorting
    queryBuilder.orderBy(`maintenance.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    // Get results with count
    const [data, total] = await queryBuilder.getManyAndCount();

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}
