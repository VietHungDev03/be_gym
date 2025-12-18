import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { IncidentsService } from '../services/incidents.service';
import { Incident, IncidentStatus, IncidentSeverity, IncidentPriority } from '../entities/incident.entity';
import { MaintenanceRecord } from '../entities/maintenance-record.entity';
import { Equipment } from '../../equipment/entities/equipment.entity';
import { User, UserRole } from '../../users/entities/user.entity';
import { NotificationsService } from '../../notifications/notifications.service';

describe('IncidentsService - Branch Management', () => {
  let service: IncidentsService;
  let incidentRepository: Repository<Incident>;

  const mockIncidentRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockMaintenanceRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };

  const mockEquipmentRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockNotificationsService = {
    createIncidentNotification: jest.fn(),
  };

  const mockIncident: Partial<Incident> = {
    id: 'incident-123',
    equipmentId: 'equipment-123',
    description: 'Equipment malfunction',
    severity: IncidentSeverity.MEDIUM,
    status: IncidentStatus.REPORTED,
    priority: IncidentPriority.MEDIUM,
    reportedBy: 'user-123',
    reportedAt: new Date(),
    escalatedToAdmin: false,
  };

  const mockEquipment: Partial<Equipment> = {
    id: 'equipment-123',
    name: 'Treadmill',
    branchId: 'branch-123',
  };

  const mockAdmin: Partial<User> = {
    id: 'admin-123',
    email: 'admin@example.com',
    fullName: 'Admin User',
    role: UserRole.ADMIN,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IncidentsService,
        {
          provide: getRepositoryToken(Incident),
          useValue: mockIncidentRepository,
        },
        {
          provide: getRepositoryToken(MaintenanceRecord),
          useValue: mockMaintenanceRepository,
        },
        {
          provide: getRepositoryToken(Equipment),
          useValue: mockEquipmentRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: NotificationsService,
          useValue: mockNotificationsService,
        },
      ],
    }).compile();

    service = module.get<IncidentsService>(IncidentsService);
    incidentRepository = module.get<Repository<Incident>>(getRepositoryToken(Incident));

    jest.clearAllMocks();
  });

  describe('escalateToAdmin', () => {
    const incidentId = 'incident-123';
    const userId = 'user-456';
    const reason = 'Cannot fix, needs admin attention';

    it('should set escalation fields correctly', async () => {
      const escalatedIncident = {
        ...mockIncident,
        escalatedToAdmin: true,
        escalatedAt: expect.any(Date),
        escalationReason: reason,
        escalatedBy: userId,
      };

      mockIncidentRepository.findOne
        .mockResolvedValueOnce(mockIncident)
        .mockResolvedValueOnce(escalatedIncident);
      mockIncidentRepository.update.mockResolvedValue({ affected: 1 });
      mockEquipmentRepository.findOne.mockResolvedValue(mockEquipment);
      mockUserRepository.find.mockResolvedValue([mockAdmin]);

      const result = await service.escalateToAdmin(incidentId, userId, reason);

      expect(mockIncidentRepository.update).toHaveBeenCalledWith(incidentId, {
        escalatedToAdmin: true,
        escalatedAt: expect.any(Date),
        escalationReason: reason,
        escalatedBy: userId,
      });
      expect(result.escalatedToAdmin).toBe(true);
    });

    it('should throw NotFoundException if incident not found', async () => {
      mockIncidentRepository.findOne.mockResolvedValue(null);

      await expect(service.escalateToAdmin(incidentId, userId, reason)).rejects.toThrow(NotFoundException);
      expect(mockIncidentRepository.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException if already escalated', async () => {
      const escalatedIncident = {
        ...mockIncident,
        escalatedToAdmin: true,
        escalatedAt: new Date(),
      };

      mockIncidentRepository.findOne.mockResolvedValue(escalatedIncident);

      await expect(service.escalateToAdmin(incidentId, userId, reason)).rejects.toThrow(BadRequestException);
      expect(mockIncidentRepository.update).not.toHaveBeenCalled();
    });

    it('should create notifications for all admins', async () => {
      const admins = [
        { ...mockAdmin, id: 'admin-1' },
        { ...mockAdmin, id: 'admin-2' },
      ];

      mockIncidentRepository.findOne
        .mockResolvedValueOnce(mockIncident)
        .mockResolvedValueOnce({ ...mockIncident, escalatedToAdmin: true });
      mockIncidentRepository.update.mockResolvedValue({ affected: 1 });
      mockEquipmentRepository.findOne.mockResolvedValue(mockEquipment);
      mockUserRepository.find.mockResolvedValue(admins);

      await service.escalateToAdmin(incidentId, userId, reason);

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { role: UserRole.ADMIN },
      });
      expect(mockNotificationsService.createIncidentNotification).toHaveBeenCalledTimes(2);
    });
  });

  describe('findByBranch', () => {
    const branchId = 'branch-123';

    it('should return incidents of a specific branch', async () => {
      const equipmentList = [
        { id: 'eq-1' },
        { id: 'eq-2' },
      ];
      const incidents = [
        { ...mockIncident, id: 'incident-1', equipmentId: 'eq-1' },
        { ...mockIncident, id: 'incident-2', equipmentId: 'eq-2' },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        getMany: jest.fn().mockResolvedValue(incidents),
      };

      mockEquipmentRepository.find.mockResolvedValue(equipmentList);
      mockIncidentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByBranch(branchId);

      expect(mockEquipmentRepository.find).toHaveBeenCalledWith({
        where: { branchId },
        select: ['id'],
      });
      expect(result).toHaveLength(2);
    });

    it('should return empty array if no equipment in branch', async () => {
      mockEquipmentRepository.find.mockResolvedValue([]);

      const result = await service.findByBranch(branchId);

      expect(result).toEqual([]);
    });
  });

  describe('findEscalated', () => {
    it('should return only escalated incidents', async () => {
      const escalatedIncidents = [
        { ...mockIncident, id: 'incident-1', escalatedToAdmin: true, escalatedAt: new Date() },
        { ...mockIncident, id: 'incident-2', escalatedToAdmin: true, escalatedAt: new Date() },
      ];

      mockIncidentRepository.find.mockResolvedValue(escalatedIncidents);

      const result = await service.findEscalated();

      expect(mockIncidentRepository.find).toHaveBeenCalledWith({
        where: { escalatedToAdmin: true },
        order: { escalatedAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
      expect(result.every(i => i.escalatedToAdmin === true)).toBe(true);
    });

    it('should return empty array if no escalated incidents', async () => {
      mockIncidentRepository.find.mockResolvedValue([]);

      const result = await service.findEscalated();

      expect(result).toEqual([]);
    });

    it('should order by escalation date descending', async () => {
      await service.findEscalated();

      expect(mockIncidentRepository.find).toHaveBeenCalledWith({
        where: { escalatedToAdmin: true },
        order: { escalatedAt: 'DESC' },
      });
    });
  });
});
