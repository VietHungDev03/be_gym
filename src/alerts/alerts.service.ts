import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Alert, AlertType, AlertStatus, AlertSeverity } from './entities/alert.entity';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { AcknowledgeAlertDto } from './dto/acknowledge-alert.dto';
import { ResolveAlertDto } from './dto/resolve-alert.dto';

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Alert)
    private alertRepository: Repository<Alert>,
  ) {}

  /**
   * Tạo cảnh báo mới
   */
  async create(createAlertDto: CreateAlertDto): Promise<Alert> {
    const alert = this.alertRepository.create({
      id: uuidv4(),
      ...createAlertDto,
      status: AlertStatus.ACTIVE,
      notificationSent: false,
    });

    return this.alertRepository.save(alert);
  }

  /**
   * Lấy tất cả cảnh báo với filter
   */
  async findAll(filters?: {
    status?: AlertStatus;
    type?: AlertType;
    severity?: AlertSeverity;
    equipmentId?: string;
    branchId?: string;
    assignedTo?: string;
  }): Promise<Alert[]> {
    const where: any = {};

    if (filters) {
      if (filters.status) where.status = filters.status;
      if (filters.type) where.type = filters.type;
      if (filters.severity) where.severity = filters.severity;
      if (filters.equipmentId) where.equipmentId = filters.equipmentId;
      if (filters.branchId) where.branchId = filters.branchId;
      if (filters.assignedTo) where.assignedTo = filters.assignedTo;
    }

    return this.alertRepository.find({
      where,
      relations: ['equipment', 'maintenance', 'sensor', 'assignedToUser'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lấy cảnh báo active (chưa resolved/dismissed)
   */
  async findActive(): Promise<Alert[]> {
    return this.alertRepository.find({
      where: {
        status: In([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]),
      },
      relations: ['equipment', 'maintenance', 'sensor', 'assignedToUser'],
      order: { severity: 'DESC', createdAt: 'DESC' },
    });
  }

  /**
   * Lấy cảnh báo theo severity
   */
  async findBySeverity(severity: AlertSeverity): Promise<Alert[]> {
    return this.alertRepository.find({
      where: {
        severity,
        status: In([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]),
      },
      relations: ['equipment', 'maintenance', 'sensor'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lấy cảnh báo critical chưa xử lý
   */
  async findCritical(): Promise<Alert[]> {
    return this.findBySeverity(AlertSeverity.CRITICAL);
  }

  /**
   * Lấy cảnh báo theo equipment
   */
  async findByEquipment(equipmentId: string): Promise<Alert[]> {
    return this.alertRepository.find({
      where: { equipmentId },
      relations: ['maintenance', 'sensor'],
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * Lấy chi tiết cảnh báo
   */
  async findOne(id: string): Promise<Alert> {
    const alert = await this.alertRepository.findOne({
      where: { id },
      relations: [
        'equipment',
        'maintenance',
        'sensor',
        'assignedToUser',
        'acknowledgedByUser',
        'resolvedByUser',
      ],
    });

    if (!alert) {
      throw new NotFoundException('Không tìm thấy cảnh báo');
    }

    return alert;
  }

  /**
   * Cập nhật cảnh báo
   */
  async update(id: string, updateAlertDto: UpdateAlertDto): Promise<Alert> {
    const alert = await this.findOne(id);

    await this.alertRepository.update(id, updateAlertDto);

    return this.findOne(id);
  }

  /**
   * Xác nhận (acknowledge) cảnh báo
   */
  async acknowledge(id: string, acknowledgeDto: AcknowledgeAlertDto): Promise<Alert> {
    const alert = await this.findOne(id);

    if (alert.status !== AlertStatus.ACTIVE) {
      throw new Error('Chỉ có thể xác nhận cảnh báo đang active');
    }

    await this.alertRepository.update(id, {
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedBy: acknowledgeDto.userId,
      acknowledgedAt: new Date(),
    });

    return this.findOne(id);
  }

  /**
   * Giải quyết (resolve) cảnh báo
   */
  async resolve(id: string, resolveDto: ResolveAlertDto): Promise<Alert> {
    const alert = await this.findOne(id);

    if (alert.status === AlertStatus.RESOLVED || alert.status === AlertStatus.DISMISSED) {
      throw new Error('Cảnh báo đã được giải quyết hoặc bỏ qua');
    }

    await this.alertRepository.update(id, {
      status: AlertStatus.RESOLVED,
      resolvedBy: resolveDto.userId,
      resolvedAt: new Date(),
      resolutionNotes: resolveDto.resolutionNotes,
    });

    return this.findOne(id);
  }

  /**
   * Bỏ qua (dismiss) cảnh báo
   */
  async dismiss(id: string, userId: string): Promise<Alert> {
    const alert = await this.findOne(id);

    await this.alertRepository.update(id, {
      status: AlertStatus.DISMISSED,
      resolvedBy: userId,
      resolvedAt: new Date(),
    });

    return this.findOne(id);
  }

  /**
   * Đánh dấu đã gửi notification
   */
  async markNotificationSent(id: string, channels: string[]): Promise<void> {
    await this.alertRepository.update(id, {
      notificationSent: true,
      notificationChannels: channels,
    });
  }

  /**
   * Xóa cảnh báo cũ đã resolved (cleanup)
   */
  async deleteOldResolved(daysOld: number = 30): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    await this.alertRepository.delete({
      status: In([AlertStatus.RESOLVED, AlertStatus.DISMISSED]),
      resolvedAt: LessThan(cutoffDate),
    });
  }

  /**
   * Lấy thống kê cảnh báo
   */
  async getStats(): Promise<{
    total: number;
    active: number;
    acknowledged: number;
    resolved: number;
    critical: number;
    bySeverity: Record<string, number>;
    byType: Record<string, number>;
  }> {
    const [total, active, acknowledged, resolved] = await Promise.all([
      this.alertRepository.count(),
      this.alertRepository.count({ where: { status: AlertStatus.ACTIVE } }),
      this.alertRepository.count({ where: { status: AlertStatus.ACKNOWLEDGED } }),
      this.alertRepository.count({ where: { status: AlertStatus.RESOLVED } }),
    ]);

    const critical = await this.alertRepository.count({
      where: {
        severity: AlertSeverity.CRITICAL,
        status: In([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]),
      },
    });

    // Stats by severity
    const bySeverity: Record<string, number> = {};
    for (const severity of Object.values(AlertSeverity)) {
      bySeverity[severity] = await this.alertRepository.count({
        where: {
          severity,
          status: In([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]),
        },
      });
    }

    // Stats by type
    const byType: Record<string, number> = {};
    for (const type of Object.values(AlertType)) {
      byType[type] = await this.alertRepository.count({
        where: {
          type,
          status: In([AlertStatus.ACTIVE, AlertStatus.ACKNOWLEDGED]),
        },
      });
    }

    return {
      total,
      active,
      acknowledged,
      resolved,
      critical,
      bySeverity,
      byType,
    };
  }
}
