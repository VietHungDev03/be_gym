import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Equipment, EquipmentStatus } from './entities/equipment.entity';
import { EquipmentTransfer } from './entities/equipment-transfer.entity';
import { User } from '../users/entities/user.entity';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { DisposeEquipmentDto } from './dto/dispose-equipment.dto';
import { BulkDisposeEquipmentDto } from './dto/bulk-dispose-equipment.dto';
import { UpdateLiquidationStatusDto } from './dto/update-liquidation-status.dto';

@Injectable()
export class EquipmentService {
  constructor(
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
    @InjectRepository(EquipmentTransfer)
    private equipmentTransferRepository: Repository<EquipmentTransfer>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createEquipmentDto: CreateEquipmentDto) {
    // Nếu có QR code, kiểm tra trùng
    if (createEquipmentDto.qrCode) {
      const existing = await this.equipmentRepository.findOne({
        where: { qrCode: createEquipmentDto.qrCode },
      });

      if (existing) {
        throw new ConflictException('Mã QR đã tồn tại');
      }
    }

    const equipment = this.equipmentRepository.create({
      id: uuidv4(),
      ...createEquipmentDto,
      // Tự động generate QR code nếu không có
      qrCode: createEquipmentDto.qrCode || this.generateQRCode(),
    });

    return this.equipmentRepository.save(equipment);
  }

  async findAll(options?: {
    page?: number;
    limit?: number;
    branchId?: string;
    userBranchId?: string;
    location?: string;
    type?: string;
    status?: EquipmentStatus;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const {
      page = 1,
      limit = 10,
      branchId,
      userBranchId,
      location,
      type,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options || {};

    const queryBuilder = this.equipmentRepository.createQueryBuilder('equipment');

    // Apply filters
    if (branchId) {
      queryBuilder.andWhere('equipment.branch_id = :branchId', { branchId });
    }
    if (userBranchId) {
      queryBuilder.andWhere('equipment.branch_id = :userBranchId', { userBranchId });
    }
    if (location) {
      queryBuilder.andWhere('equipment.location = :location', { location });
    }
    if (type) {
      queryBuilder.andWhere('equipment.type = :type', { type });
    }
    if (status) {
      queryBuilder.andWhere('equipment.status = :status', { status });
    }

    // Apply sorting
    queryBuilder.orderBy(`equipment.${sortBy}`, sortOrder);

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

  async findOne(id: string) {
    const equipment = await this.equipmentRepository.findOne({
      where: { id },
    });

    if (!equipment) {
      throw new NotFoundException('Không tìm thấy thiết bị');
    }

    return equipment;
  }

  async findByQRCode(qrCode: string) {
    const equipment = await this.equipmentRepository.findOne({
      where: { qrCode },
    });

    if (!equipment) {
      throw new NotFoundException('Không tìm thấy thiết bị với mã QR này');
    }

    return equipment;
  }

  async findByStatus(status: EquipmentStatus) {
    return this.equipmentRepository.find({
      where: { status },
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserBranch(userId: string, options?: {
    page?: number;
    limit?: number;
    location?: string;
    type?: string;
    status?: EquipmentStatus;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    // Get user's assignedBranchId
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    if (!user.assignedBranchId) {
      throw new BadRequestException('Người dùng chưa được gán chi nhánh');
    }

    const {
      page = 1,
      limit = 10,
      location,
      type,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options || {};

    const queryBuilder = this.equipmentRepository.createQueryBuilder('equipment');

    // Get equipment where branch_id = assignedBranchId
    // Also include equipment that has been transferred TO user's branch
    queryBuilder.where(
      '(equipment.branch_id = :branchId OR EXISTS (SELECT 1 FROM equipment_transfers et WHERE et.equipment_id = equipment.id AND et.to_branch_id = :branchId AND et.status = :transferStatus))',
      { branchId: user.assignedBranchId, transferStatus: 'completed' }
    );

    // Apply additional filters
    if (location) {
      queryBuilder.andWhere('equipment.location = :location', { location });
    }
    if (type) {
      queryBuilder.andWhere('equipment.type = :type', { type });
    }
    if (status) {
      queryBuilder.andWhere('equipment.status = :status', { status });
    }

    // Apply sorting
    queryBuilder.orderBy(`equipment.${sortBy}`, sortOrder);

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
      branchId: user.assignedBranchId,
    };
  }

  async update(id: string, updateEquipmentDto: UpdateEquipmentDto) {
    const equipment = await this.findOne(id);

    // Nếu update QR code, kiểm tra trùng
    if (updateEquipmentDto.qrCode && updateEquipmentDto.qrCode !== equipment.qrCode) {
      const existing = await this.equipmentRepository.findOne({
        where: { qrCode: updateEquipmentDto.qrCode },
      });

      if (existing) {
        throw new ConflictException('Mã QR đã tồn tại');
      }
    }

    await this.equipmentRepository.update(id, updateEquipmentDto);

    return this.findOne(id);
  }

  async remove(id: string) {
    const equipment = await this.findOne(id);

    await this.equipmentRepository.delete(id);

    return { message: 'Xóa thiết bị thành công' };
  }

  // Generate QR code tương tự như Firebase
  generateQRCode(): string {
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `EQ_${timestamp}_${randomStr}`;
  }

  // Lấy danh sách options cho filter
  async getFilterOptions() {
    const branches = await this.equipmentRepository
      .createQueryBuilder('equipment')
      .select('DISTINCT equipment.branch_id', 'branchId')
      .where('equipment.branch_id IS NOT NULL')
      .getRawMany();

    const locations = await this.equipmentRepository
      .createQueryBuilder('equipment')
      .select('DISTINCT equipment.location', 'location')
      .where('equipment.location IS NOT NULL')
      .getRawMany();

    const types = await this.equipmentRepository
      .createQueryBuilder('equipment')
      .select('DISTINCT equipment.type', 'type')
      .getRawMany();

    return {
      branches: branches.map(b => b.branchId).filter(Boolean),
      locations: locations.map(l => l.location).filter(Boolean),
      types: types.map(t => t.type).filter(Boolean),
      statuses: Object.values(EquipmentStatus),
    };
  }

  // Thanh lý thiết bị
  async disposeEquipment(id: string, disposeDto: DisposeEquipmentDto) {
    const equipment = await this.findOne(id);

    // Kiểm tra thiết bị đã được thanh lý chưa
    if (equipment.status === EquipmentStatus.DISPOSED) {
      throw new BadRequestException('Thiết bị đã được thanh lý trước đó');
    }

    // Cập nhật trạng thái và thông tin thanh lý
    const disposalDate = disposeDto.disposalDate
      ? new Date(disposeDto.disposalDate)
      : new Date();

    await this.equipmentRepository.update(id, {
      status: EquipmentStatus.DISPOSED,
      disposalDate,
      disposalReason: disposeDto.disposalReason,
    });

    return this.findOne(id);
  }

  // Thanh lý nhiều thiết bị cùng lúc
  async bulkDisposeEquipment(bulkDisposeDto: BulkDisposeEquipmentDto) {
    const { equipmentIds, disposalReason, disposalDate } = bulkDisposeDto;

    // Kiểm tra tất cả thiết bị có tồn tại không
    const equipment = await this.equipmentRepository.find({
      where: { id: In(equipmentIds) },
    });

    if (equipment.length !== equipmentIds.length) {
      throw new NotFoundException('Một hoặc nhiều thiết bị không tồn tại');
    }

    // Kiểm tra xem có thiết bị nào đã được thanh lý chưa
    const alreadyDisposed = equipment.filter(eq => eq.status === EquipmentStatus.DISPOSED);
    if (alreadyDisposed.length > 0) {
      throw new BadRequestException(
        `${alreadyDisposed.length} thiết bị đã được thanh lý trước đó`,
      );
    }

    // Cập nhật trạng thái và thông tin thanh lý cho tất cả thiết bị
    const finalDisposalDate = disposalDate ? new Date(disposalDate) : new Date();

    await this.equipmentRepository.update(
      { id: In(equipmentIds) },
      {
        status: EquipmentStatus.DISPOSED,
        disposalDate: finalDisposalDate,
        disposalReason,
      },
    );

    // Trả về danh sách thiết bị đã thanh lý
    return this.equipmentRepository.find({
      where: { id: In(equipmentIds) },
    });
  }

  // Cập nhật trạng thái thanh lý của thiết bị
  async updateLiquidationStatus(id: string, updateDto: UpdateLiquidationStatusDto) {
    const equipment = await this.findOne(id);

    // Kiểm tra trạng thái hợp lệ
    const validLiquidationStatuses = [
      EquipmentStatus.PREPARING_LIQUIDATION,
      EquipmentStatus.PENDING_LIQUIDATION,
      EquipmentStatus.DISPOSED,
    ];

    if (!validLiquidationStatuses.includes(updateDto.status)) {
      throw new BadRequestException('Trạng thái thanh lý không hợp lệ');
    }

    // Nếu chuyển sang disposed, cần có thông tin thanh lý
    if (updateDto.status === EquipmentStatus.DISPOSED) {
      // Kiểm tra lý do thanh lý: từ request hoặc đã có sẵn
      if (!updateDto.disposalReason && !equipment.disposalReason) {
        throw new BadRequestException('Cần có lý do thanh lý trước khi chuyển sang trạng thái đã thanh lý');
      }
    }

    await this.equipmentRepository.update(id, {
      status: updateDto.status,
      // Lưu lý do thanh lý nếu được cung cấp
      ...(updateDto.disposalReason ? { disposalReason: updateDto.disposalReason } : {}),
      // Nếu chuyển sang disposed và chưa có disposal date, thêm vào
      ...(updateDto.status === EquipmentStatus.DISPOSED && !equipment.disposalDate
        ? { disposalDate: new Date() }
        : {}),
    });

    return this.findOne(id);
  }

  // Lấy lịch sử thiết bị đã thanh lý hoặc đang trong quá trình thanh lý
  async getDisposedHistory(options?: {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
    includeAll?: boolean; // Bao gồm cả preparing và pending
  }) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'disposalDate',
      sortOrder = 'DESC',
      includeAll = false,
    } = options || {};

    const queryBuilder = this.equipmentRepository.createQueryBuilder('equipment');

    if (includeAll) {
      // Bao gồm tất cả trạng thái thanh lý
      queryBuilder.where('equipment.status IN (:...statuses)', {
        statuses: [
          EquipmentStatus.PREPARING_LIQUIDATION,
          EquipmentStatus.PENDING_LIQUIDATION,
          EquipmentStatus.DISPOSED,
        ],
      });
    } else {
      // Chỉ lấy thiết bị đã thanh lý hoàn toàn
      queryBuilder.where('equipment.status = :status', { status: EquipmentStatus.DISPOSED });
    }

    // Apply sorting
    queryBuilder.orderBy(`equipment.${sortBy}`, sortOrder);

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
