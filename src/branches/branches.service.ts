import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Branch, BranchStatus } from './entities/branch.entity';
import { User, UserRole } from '../users/entities/user.entity';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class BranchesService {
  constructor(
    @InjectRepository(Branch)
    private branchRepository: Repository<Branch>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * Tạo chi nhánh mới
   */
  async create(createBranchDto: CreateBranchDto): Promise<Branch> {
    // Kiểm tra code đã tồn tại chưa
    const existingBranch = await this.branchRepository.findOne({
      where: { code: createBranchDto.code },
    });

    if (existingBranch) {
      throw new ConflictException(`Branch code "${createBranchDto.code}" already exists`);
    }

    const branch = this.branchRepository.create({
      id: uuidv4(),
      ...createBranchDto,
    });

    return this.branchRepository.save(branch);
  }

  /**
   * Lấy tất cả chi nhánh với thống kê số lượng thiết bị và nhân viên
   */
  async findAll(status?: BranchStatus): Promise<any[]> {
    const queryBuilder = this.branchRepository
      .createQueryBuilder('branch')
      .leftJoinAndSelect('branch.manager', 'manager')
      .leftJoin('equipment', 'equipment', 'equipment.branch_id = branch.id')
      .leftJoin('users', 'users', 'users.assigned_branch_id = branch.id AND (users.role = :technicianRole OR users.role = :receptionistRole)',
        { technicianRole: UserRole.TECHNICIAN, receptionistRole: UserRole.RECEPTIONIST })
      .addSelect('COUNT(DISTINCT equipment.id)', 'equipmentCount')
      .addSelect('COUNT(DISTINCT users.id)', 'staffCount')
      .groupBy('branch.id')
      .addGroupBy('manager.id')
      .orderBy('branch.name', 'ASC');

    if (status) {
      queryBuilder.where('branch.status = :status', { status });
    }

    const branches = await queryBuilder.getRawAndEntities();

    // Map kết quả để thêm equipmentCount và staffCount vào mỗi branch
    return branches.entities.map((branch, index) => ({
      ...branch,
      equipmentCount: parseInt(branches.raw[index].equipmentCount) || 0,
      staffCount: parseInt(branches.raw[index].staffCount) || 0,
    }));
  }

  /**
   * Lấy chi nhánh theo ID
   */
  async findOne(id: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { id },
      relations: ['manager'],
    });

    if (!branch) {
      throw new NotFoundException(`Branch with ID ${id} not found`);
    }

    return branch;
  }

  /**
   * Lấy chi nhánh theo code
   */
  async findByCode(code: string): Promise<Branch> {
    const branch = await this.branchRepository.findOne({
      where: { code },
      relations: ['manager'],
    });

    if (!branch) {
      throw new NotFoundException(`Branch with code ${code} not found`);
    }

    return branch;
  }

  /**
   * Cập nhật chi nhánh
   */
  async update(id: string, updateBranchDto: UpdateBranchDto): Promise<Branch> {
    const branch = await this.findOne(id);

    // Nếu cập nhật code, kiểm tra trùng
    if (updateBranchDto.code && updateBranchDto.code !== branch.code) {
      const existingBranch = await this.branchRepository.findOne({
        where: { code: updateBranchDto.code },
      });

      if (existingBranch) {
        throw new ConflictException(`Branch code "${updateBranchDto.code}" already exists`);
      }
    }

    Object.assign(branch, updateBranchDto);
    return this.branchRepository.save(branch);
  }

  /**
   * Xóa chi nhánh
   */
  async remove(id: string): Promise<void> {
    const branch = await this.findOne(id);
    await this.branchRepository.remove(branch);
  }

  /**
   * Lấy chi nhánh với số lượng nhân viên
   */
  async getBranchWithStaffCount(branchId: string) {
    const branch = await this.branchRepository
      .createQueryBuilder('branch')
      .leftJoinAndSelect('branch.manager', 'manager')
      .leftJoin('users', 'users', 'users.assigned_branch_id = branch.id AND (users.role = :technicianRole OR users.role = :receptionistRole)',
        { technicianRole: UserRole.TECHNICIAN, receptionistRole: UserRole.RECEPTIONIST })
      .addSelect('COUNT(DISTINCT users.id)', 'staffCount')
      .where('branch.id = :branchId', { branchId })
      .groupBy('branch.id')
      .addGroupBy('manager.id')
      .getRawAndEntities();

    if (!branch.entities || branch.entities.length === 0) {
      throw new NotFoundException(`Branch with ID ${branchId} not found`);
    }

    return {
      ...branch.entities[0],
      staffCount: parseInt(branch.raw[0].staffCount) || 0,
    };
  }

  /**
   * Lấy tất cả chi nhánh với số lượng nhân viên
   */
  async getAllBranchesWithStaffCount(): Promise<any[]> {
    const queryBuilder = this.branchRepository
      .createQueryBuilder('branch')
      .leftJoinAndSelect('branch.manager', 'manager')
      .leftJoin('users', 'users', 'users.assigned_branch_id = branch.id AND (users.role = :technicianRole OR users.role = :receptionistRole)',
        { technicianRole: UserRole.TECHNICIAN, receptionistRole: UserRole.RECEPTIONIST })
      .addSelect('COUNT(DISTINCT users.id)', 'staffCount')
      .groupBy('branch.id')
      .addGroupBy('manager.id')
      .orderBy('branch.name', 'ASC');

    const branches = await queryBuilder.getRawAndEntities();

    // Map kết quả để thêm staffCount vào mỗi branch
    return branches.entities.map((branch, index) => ({
      ...branch,
      staffCount: parseInt(branches.raw[index].staffCount) || 0,
    }));
  }

  /**
   * Lấy danh sách nhân viên được gán cho chi nhánh
   */
  async getBranchStaff(branchId: string) {
    // Verify branch exists
    await this.findOne(branchId);

    const staff = await this.userRepository.find({
      where: [
        { assignedBranchId: branchId, role: UserRole.TECHNICIAN },
        { assignedBranchId: branchId, role: UserRole.RECEPTIONIST },
      ],
      order: { fullName: 'ASC' },
    });

    return staff.map(({ passwordHash, ...user }) => user);
  }

  /**
   * Lấy thống kê chi nhánh
   */
  async getStatistics(branchId: string) {
    // Verify branch exists
    const branch = await this.findOne(branchId);

    // Get equipment count
    const equipmentCount = await this.branchRepository
      .createQueryBuilder('branch')
      .leftJoin('equipment', 'equipment', 'equipment.branch_id = branch.id')
      .select('COUNT(equipment.id)', 'count')
      .where('branch.id = :branchId', { branchId })
      .getRawOne();

    // Get staff count
    const staffCount = await this.userRepository.count({
      where: [
        { assignedBranchId: branchId, role: UserRole.TECHNICIAN },
        { assignedBranchId: branchId, role: UserRole.RECEPTIONIST },
      ],
    });

    // TODO: Implement additional statistics
    // - Số lượng sự cố
    // - Số lượng bảo trì
    return {
      branchId,
      equipmentCount: parseInt(equipmentCount?.count) || 0,
      staffCount,
      incidentCount: 0,
      maintenanceCount: 0,
    };
  }
}
