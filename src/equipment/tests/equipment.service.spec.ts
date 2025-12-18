import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { EquipmentService } from '../equipment.service';
import { Equipment, EquipmentStatus } from '../entities/equipment.entity';
import { EquipmentTransfer } from '../entities/equipment-transfer.entity';
import { User, UserRole, UserStatus } from '../../users/entities/user.entity';

describe('EquipmentService - Branch Management', () => {
  let service: EquipmentService;
  let equipmentRepository: Repository<Equipment>;
  let userRepository: Repository<User>;

  const mockEquipmentRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  const mockTransferRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
  };

  const mockUserRepository = {
    findOne: jest.fn(),
  };

  const mockEquipment: Partial<Equipment> = {
    id: 'equipment-123',
    name: 'Treadmill',
    type: 'Cardio',
    branchId: 'branch-123',
    status: EquipmentStatus.ACTIVE,
    createdAt: new Date(),
  };

  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'user@example.com',
    fullName: 'Test User',
    role: UserRole.TECHNICIAN,
    status: UserStatus.ACTIVE,
    assignedBranchId: 'branch-123',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EquipmentService,
        {
          provide: getRepositoryToken(Equipment),
          useValue: mockEquipmentRepository,
        },
        {
          provide: getRepositoryToken(EquipmentTransfer),
          useValue: mockTransferRepository,
        },
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<EquipmentService>(EquipmentService);
    equipmentRepository = module.get<Repository<Equipment>>(getRepositoryToken(Equipment));
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  describe('findByUserBranch', () => {
    const userId = 'user-123';

    it('should return equipment of user assigned branch', async () => {
      const equipmentList = [
        { ...mockEquipment, id: 'eq-1' },
        { ...mockEquipment, id: 'eq-2' },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([equipmentList, 2]),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEquipmentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByUserBranch(userId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(result.data).toHaveLength(2);
      expect(result.branchId).toBe('branch-123');
      expect(result.pagination).toBeDefined();
    });

    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.findByUserBranch(userId)).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if user has no assigned branch', async () => {
      const userWithoutBranch = { ...mockUser, assignedBranchId: null };
      mockUserRepository.findOne.mockResolvedValue(userWithoutBranch);

      await expect(service.findByUserBranch(userId)).rejects.toThrow(BadRequestException);
    });

    it('should return empty data if branch has no equipment', async () => {
      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[], 0]),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEquipmentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByUserBranch(userId);

      expect(result.data).toEqual([]);
      expect(result.pagination.total).toBe(0);
    });

    it('should support filtering by status', async () => {
      const activeEquipment = [
        { ...mockEquipment, id: 'eq-1', status: EquipmentStatus.ACTIVE },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([activeEquipment, 1]),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEquipmentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByUserBranch(userId, { status: EquipmentStatus.ACTIVE });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('equipment.status = :status', { status: EquipmentStatus.ACTIVE });
      expect(result.data).toHaveLength(1);
    });

    it('should support filtering by type', async () => {
      const cardioEquipment = [
        { ...mockEquipment, id: 'eq-1', type: 'Cardio' },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([cardioEquipment, 1]),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEquipmentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByUserBranch(userId, { type: 'Cardio' });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('equipment.type = :type', { type: 'Cardio' });
      expect(result.data).toHaveLength(1);
    });

    it('should support pagination', async () => {
      const equipmentList = [{ ...mockEquipment, id: 'eq-1' }];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([equipmentList, 25]),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEquipmentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByUserBranch(userId, { page: 2, limit: 10 });

      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(10); // (page - 1) * limit
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(result.pagination.page).toBe(2);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.totalPages).toBe(3);
    });

    it('should include equipment transferred to branch', async () => {
      const equipmentList = [
        { ...mockEquipment, id: 'eq-1', branchId: 'branch-123' },
        { ...mockEquipment, id: 'eq-2', branchId: 'branch-123' },
      ];

      const mockQueryBuilder = {
        where: jest.fn().mockReturnThis(),
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([equipmentList, 2]),
      };

      mockUserRepository.findOne.mockResolvedValue(mockUser);
      mockEquipmentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findByUserBranch(userId);

      // Verify the where clause includes both branch and transfer conditions
      expect(mockQueryBuilder.where).toHaveBeenCalled();
      expect(result.data).toHaveLength(2);
    });
  });

  describe('findAll with userBranchId filter', () => {
    it('should filter by userBranchId when provided', async () => {
      const branchId = 'branch-123';
      const equipmentList = [{ ...mockEquipment }];

      const mockQueryBuilder = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([equipmentList, 1]),
      };

      mockEquipmentRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

      const result = await service.findAll({ userBranchId: branchId });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('equipment.branch_id = :userBranchId', { userBranchId: branchId });
      expect(result.data).toHaveLength(1);
    });
  });
});
