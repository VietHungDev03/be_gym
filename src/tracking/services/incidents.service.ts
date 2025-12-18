import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Incident, IncidentStatus, IncidentSeverity, IncidentPriority } from '../entities/incident.entity';
import { MaintenanceRecord, MaintenanceType, MaintenancePriority, MaintenanceStatus } from '../entities/maintenance-record.entity';
import { CreateIncidentDto } from '../dto/create-incident.dto';
import { UpdateIncidentDto } from '../dto/update-incident.dto';
import { AssignIncidentDto } from '../dto/assign-incident.dto';
import { ResolveIncidentDto } from '../dto/resolve-incident.dto';
import { UpdateIncidentStatusDto } from '../dto/update-incident-status.dto';
import { User, UserRole } from '../../users/entities/user.entity';
import { NotificationsService } from '../../notifications/notifications.service';
import { NotificationPriority } from '../../notifications/entities/notification.entity';
import { Equipment } from '../../equipment/entities/equipment.entity';

@Injectable()
export class IncidentsService {
  constructor(
    @InjectRepository(Incident)
    private incidentRepository: Repository<Incident>,
    @InjectRepository(MaintenanceRecord)
    private maintenanceRepository: Repository<MaintenanceRecord>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
    private notificationsService: NotificationsService,
  ) {}

  async create(createIncidentDto: CreateIncidentDto) {
    const incident = this.incidentRepository.create({
      id: uuidv4(),
      ...createIncidentDto,
      status: IncidentStatus.REPORTED,
      priority: this.calculatePriority(createIncidentDto.severity || IncidentSeverity.MEDIUM),
      reportedAt: new Date(),
    });

    const savedIncident = await this.incidentRepository.save(incident);

    // Tự động tạo lịch bảo trì nếu critical hoặc high
    const severity = createIncidentDto.severity || IncidentSeverity.MEDIUM;
    if (severity === IncidentSeverity.CRITICAL || severity === IncidentSeverity.HIGH) {
      await this.createEmergencyMaintenance(savedIncident);
    }

    return savedIncident;
  }

  async findAll(status?: IncidentStatus, equipmentId?: string) {
    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (equipmentId) {
      where.equipmentId = equipmentId;
    }

    return this.incidentRepository.find({
      where,
      order: { reportedAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const incident = await this.incidentRepository.findOne({
      where: { id },
    });

    if (!incident) {
      throw new NotFoundException('Không tìm thấy sự cố');
    }

    return incident;
  }

  async update(id: string, updateIncidentDto: UpdateIncidentDto) {
    const incident = await this.findOne(id);

    const updateData: any = { ...updateIncidentDto };

    // Nếu status chuyển sang resolved, tự động set resolvedAt
    if (updateIncidentDto.status === IncidentStatus.RESOLVED && !incident.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    await this.incidentRepository.update(id, updateData);

    return this.findOne(id);
  }

  async updateStatus(id: string, updateStatusDto: UpdateIncidentStatusDto) {
    const incident = await this.findOne(id);

    const updateData: any = {
      status: updateStatusDto.status,
    };

    // Nếu status là resolved hoặc closed, cần có resolution
    if (
      (updateStatusDto.status === IncidentStatus.RESOLVED ||
        updateStatusDto.status === IncidentStatus.CLOSED) &&
      !updateStatusDto.resolution &&
      !incident.resolution
    ) {
      throw new BadRequestException('Cần nhập giải pháp xử lý khi đóng sự cố');
    }

    if (updateStatusDto.resolution) {
      updateData.resolution = updateStatusDto.resolution;
    }

    // Tự động set resolvedAt khi chuyển sang resolved
    if (updateStatusDto.status === IncidentStatus.RESOLVED && !incident.resolvedAt) {
      updateData.resolvedAt = new Date();
    }

    await this.incidentRepository.update(id, updateData);

    return this.findOne(id);
  }

  async assign(id: string, assignDto: AssignIncidentDto) {
    await this.findOne(id);

    await this.incidentRepository.update(id, {
      assignedTo: assignDto.assignedTo,
      status: IncidentStatus.INVESTIGATING,
    });

    return this.findOne(id);
  }

  async resolve(id: string, resolveDto: ResolveIncidentDto) {
    await this.findOne(id);

    await this.incidentRepository.update(id, {
      status: IncidentStatus.RESOLVED,
      resolution: resolveDto.resolution,
      resolvedAt: new Date(),
    });

    return this.findOne(id);
  }

  private calculatePriority(severity: IncidentSeverity): IncidentPriority {
    // Map severity to priority
    if (severity === IncidentSeverity.CRITICAL) return IncidentPriority.CRITICAL;
    if (severity === IncidentSeverity.HIGH) return IncidentPriority.HIGH;
    return IncidentPriority.MEDIUM;
  }

  private async createEmergencyMaintenance(incident: Incident) {
    // Map incident priority to maintenance priority
    let maintenancePriority: MaintenancePriority;
    if (incident.priority === IncidentPriority.CRITICAL) {
      maintenancePriority = MaintenancePriority.CRITICAL;
    } else if (incident.priority === IncidentPriority.HIGH) {
      maintenancePriority = MaintenancePriority.HIGH;
    } else {
      maintenancePriority = MaintenancePriority.MEDIUM;
    }

    const maintenance = this.maintenanceRepository.create({
      equipmentId: incident.equipmentId,
      type: MaintenanceType.EMERGENCY,
      description: `Khắc phục sự cố: ${incident.description}`,
      priority: maintenancePriority,
      scheduledDate: new Date(), // Ngay lập tức
      status: MaintenanceStatus.SCHEDULED,
    });

    // Set ID manually before saving
    maintenance.id = uuidv4();
    await this.maintenanceRepository.save(maintenance);
  }

  async escalateToAdmin(incidentId: string, userId: string, reason: string) {
    const incident = await this.findOne(incidentId);

    // Check if already escalated
    if (incident.escalatedToAdmin) {
      throw new BadRequestException('Sự cố đã được chuyển lên admin');
    }

    // Update incident
    await this.incidentRepository.update(incidentId, {
      escalatedToAdmin: true,
      escalatedAt: new Date(),
      escalationReason: reason,
      escalatedBy: userId,
    });

    // Get equipment details for notification
    const equipment = await this.equipmentRepository.findOne({
      where: { id: incident.equipmentId },
    });

    // Get all admin users
    const admins = await this.userRepository.find({
      where: { role: UserRole.ADMIN },
    });

    // Create notifications for all admins
    for (const admin of admins) {
      await this.notificationsService.createIncidentNotification(
        admin.id,
        incidentId,
        'Sự cố được chuyển lên',
        `Sự cố thiết bị "${equipment?.name || 'Unknown'}" đã được chuyển lên admin. Lý do: ${reason}`,
        NotificationPriority.HIGH,
      );
    }

    return this.findOne(incidentId);
  }

  async findByBranch(branchId: string) {
    // Find equipment IDs for this branch
    const equipmentList = await this.equipmentRepository.find({
      where: { branchId },
      select: ['id'],
    });

    const equipmentIds = equipmentList.map(e => e.id);

    if (equipmentIds.length === 0) {
      return [];
    }

    return this.incidentRepository
      .createQueryBuilder('incident')
      .where('incident.equipment_id IN (:...equipmentIds)', { equipmentIds })
      .orderBy('incident.reported_at', 'DESC')
      .getMany();
  }

  async findEscalated() {
    return this.incidentRepository.find({
      where: { escalatedToAdmin: true },
      order: { escalatedAt: 'DESC' },
    });
  }
}
