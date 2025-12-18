import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { User, UserRole, UserStatus } from '../entities/user.entity';

describe('UsersService - Branch Management', () => {
  let service: UsersService;
  let userRepository: Repository<User>;

  const mockUserRepository = {
    findOne: jest.fn(),
    find: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  };

  const mockUser: Partial<User> = {
    id: 'user-123',
    email: 'test@example.com',
    fullName: 'Test User',
    role: UserRole.TECHNICIAN,
    status: UserStatus.ACTIVE,
    assignedBranchId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));

    jest.clearAllMocks();
  });

  describe('assignBranch', () => {
    it('should assign a branch to a user', async () => {
      const userId = 'user-123';
      const branchId = 'branch-123';
      const userWithBranch = { ...mockUser, assignedBranchId: branchId };

      mockUserRepository.findOne
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce(userWithBranch);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.assignBranch(userId, branchId);

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, { assignedBranchId: branchId });
      expect(result.assignedBranchId).toBe(branchId);
    });

    it('should throw NotFoundException if user not found', async () => {
      const userId = 'invalid-user';
      const branchId = 'branch-123';

      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.assignBranch(userId, branchId)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should allow reassigning user to a different branch', async () => {
      const userId = 'user-123';
      const oldBranchId = 'branch-old';
      const newBranchId = 'branch-new';
      const userWithOldBranch = { ...mockUser, assignedBranchId: oldBranchId };
      const userWithNewBranch = { ...mockUser, assignedBranchId: newBranchId };

      mockUserRepository.findOne
        .mockResolvedValueOnce(userWithOldBranch)
        .mockResolvedValueOnce(userWithNewBranch);
      mockUserRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.assignBranch(userId, newBranchId);

      expect(mockUserRepository.update).toHaveBeenCalledWith(userId, { assignedBranchId: newBranchId });
      expect(result.assignedBranchId).toBe(newBranchId);
    });
  });

  describe('getUsersByBranch', () => {
    it('should return all users assigned to a branch', async () => {
      const branchId = 'branch-123';
      const users = [
        { ...mockUser, id: 'user-1', assignedBranchId: branchId },
        { ...mockUser, id: 'user-2', assignedBranchId: branchId },
        { ...mockUser, id: 'user-3', assignedBranchId: branchId, role: UserRole.RECEPTIONIST },
      ];

      mockUserRepository.find.mockResolvedValue(users);

      const result = await service.getUsersByBranch(branchId);

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { assignedBranchId: branchId },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(3);
    });

    it('should return empty array if no users assigned to branch', async () => {
      const branchId = 'branch-123';

      mockUserRepository.find.mockResolvedValue([]);

      const result = await service.getUsersByBranch(branchId);

      expect(result).toEqual([]);
      expect(result).toHaveLength(0);
    });

    it('should exclude passwordHash from results', async () => {
      const branchId = 'branch-123';
      const userWithHash = {
        ...mockUser,
        assignedBranchId: branchId,
        passwordHash: 'secret-hash'
      };

      mockUserRepository.find.mockResolvedValue([userWithHash]);

      const result = await service.getUsersByBranch(branchId);

      expect(result[0]).not.toHaveProperty('passwordHash');
    });
  });

  describe('getTechniciansByBranch', () => {
    it('should return only technicians of a specific branch', async () => {
      const branchId = 'branch-123';
      const technicians = [
        { ...mockUser, id: 'tech-1', assignedBranchId: branchId, role: UserRole.TECHNICIAN },
        { ...mockUser, id: 'tech-2', assignedBranchId: branchId, role: UserRole.TECHNICIAN },
      ];

      mockUserRepository.find.mockResolvedValue(technicians);

      const result = await service.getTechniciansByBranch(branchId);

      expect(mockUserRepository.find).toHaveBeenCalledWith({
        where: { assignedBranchId: branchId, role: UserRole.TECHNICIAN },
        order: { createdAt: 'DESC' },
      });
      expect(result).toHaveLength(2);
      expect(result.every(tech => tech.role === UserRole.TECHNICIAN)).toBe(true);
    });

    it('should not include other roles', async () => {
      const branchId = 'branch-123';
      const technicians = [
        { ...mockUser, id: 'tech-1', assignedBranchId: branchId, role: UserRole.TECHNICIAN },
      ];

      mockUserRepository.find.mockResolvedValue(technicians);

      const result = await service.getTechniciansByBranch(branchId);

      expect(result).toHaveLength(1);
      expect(result[0].role).toBe(UserRole.TECHNICIAN);
    });

    it('should return empty array if no technicians in branch', async () => {
      const branchId = 'branch-123';

      mockUserRepository.find.mockResolvedValue([]);

      const result = await service.getTechniciansByBranch(branchId);

      expect(result).toEqual([]);
    });
  });
});
