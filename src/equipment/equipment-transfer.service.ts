import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { EquipmentTransfer } from './entities/equipment-transfer.entity';
import { Equipment } from './entities/equipment.entity';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferStatusDto } from './dto/update-transfer-status.dto';

@Injectable()
export class EquipmentTransferService {
  constructor(
    @InjectRepository(EquipmentTransfer)
    private transferRepository: Repository<EquipmentTransfer>,
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
  ) {}

  // Tạo yêu cầu điều chuyển mới
  async createTransfer(createDto: CreateTransferDto, userId: string) {
    // Kiểm tra thiết bị có tồn tại
    const equipment = await this.equipmentRepository.findOne({
      where: { id: createDto.equipmentId },
    });

    if (!equipment) {
      throw new NotFoundException('Không tìm thấy thiết bị');
    }

    // Kiểm tra không điều chuyển về cùng chi nhánh
    if (equipment.branchId === createDto.toBranchId) {
      throw new BadRequestException('Không thể điều chuyển thiết bị về cùng chi nhánh');
    }

    // Tạo bản ghi điều chuyển
    const transfer = this.transferRepository.create({
      id: uuidv4(),
      equipmentId: createDto.equipmentId,
      fromBranchId: equipment.branchId,
      toBranchId: createDto.toBranchId,
      transferDate: new Date(createDto.transferDate),
      requestedBy: userId,
      reason: createDto.reason,
      notes: createDto.notes,
      status: 'pending',
    });

    return this.transferRepository.save(transfer);
  }

  // Lấy danh sách điều chuyển với filter và phân trang
  async findAll(options?: {
    page?: number;
    limit?: number;
    equipmentId?: string;
    fromBranchId?: string;
    toBranchId?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
  }) {
    const {
      page = 1,
      limit = 10,
      equipmentId,
      fromBranchId,
      toBranchId,
      status,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = options || {};

    const queryBuilder = this.transferRepository.createQueryBuilder('transfer');

    // Apply filters
    if (equipmentId) {
      queryBuilder.andWhere('transfer.equipment_id = :equipmentId', { equipmentId });
    }
    if (fromBranchId) {
      queryBuilder.andWhere('transfer.from_branch_id = :fromBranchId', { fromBranchId });
    }
    if (toBranchId) {
      queryBuilder.andWhere('transfer.to_branch_id = :toBranchId', { toBranchId });
    }
    if (status) {
      queryBuilder.andWhere('transfer.status = :status', { status });
    }

    // Apply sorting
    queryBuilder.orderBy(`transfer.${sortBy}`, sortOrder);

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

  // Lấy chi tiết một điều chuyển
  async findOne(id: string) {
    const transfer = await this.transferRepository.findOne({
      where: { id },
    });

    if (!transfer) {
      throw new NotFoundException('Không tìm thấy bản ghi điều chuyển');
    }

    return transfer;
  }

  // Lấy lịch sử điều chuyển của một thiết bị
  async getEquipmentTransferHistory(equipmentId: string) {
    return this.transferRepository.find({
      where: { equipmentId },
      order: { createdAt: 'DESC' },
    });
  }

  // Cập nhật trạng thái điều chuyển
  async updateStatus(id: string, updateDto: UpdateTransferStatusDto, userId: string) {
    const transfer = await this.findOne(id);

    // Cập nhật trạng thái
    const updateData: any = {
      status: updateDto.status,
    };

    // Nếu approved, lưu người phê duyệt
    if (updateDto.status === 'approved') {
      updateData.approvedBy = userId;
    }

    // Nếu có notes mới, cập nhật
    if (updateDto.notes) {
      updateData.notes = updateDto.notes;
    }

    await this.transferRepository.update(id, updateData);

    // Nếu completed, cập nhật branchId của thiết bị
    if (updateDto.status === 'completed') {
      await this.equipmentRepository.update(transfer.equipmentId, {
        branchId: transfer.toBranchId,
      });
    }

    return this.findOne(id);
  }

  // Xóa yêu cầu điều chuyển (chỉ khi pending)
  async remove(id: string) {
    const transfer = await this.findOne(id);

    if (transfer.status !== 'pending') {
      throw new BadRequestException('Chỉ có thể xóa yêu cầu điều chuyển đang chờ');
    }

    await this.transferRepository.delete(id);

    return { message: 'Xóa yêu cầu điều chuyển thành công' };
  }

  // Thống kê điều chuyển
  async getTransferStats(branchId?: string) {
    const queryBuilder = this.transferRepository.createQueryBuilder('transfer');

    if (branchId) {
      queryBuilder.where(
        '(transfer.from_branch_id = :branchId OR transfer.to_branch_id = :branchId)',
        { branchId },
      );
    }

    const [total, pending, approved, rejected, completed] = await Promise.all([
      queryBuilder.getCount(),
      queryBuilder.clone().andWhere('transfer.status = :status', { status: 'pending' }).getCount(),
      queryBuilder.clone().andWhere('transfer.status = :status', { status: 'approved' }).getCount(),
      queryBuilder.clone().andWhere('transfer.status = :status', { status: 'rejected' }).getCount(),
      queryBuilder.clone().andWhere('transfer.status = :status', { status: 'completed' }).getCount(),
    ]);

    return {
      total,
      byStatus: {
        pending,
        approved,
        rejected,
        completed,
      },
    };
  }
}
