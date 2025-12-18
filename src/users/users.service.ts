import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole, UserStatus } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto) {
    // Kiểm tra email đã tồn tại
    const existingUser = await this.userRepository.findOne({
      where: { email: createUserDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(createUserDto.password, 10);

    const user = this.userRepository.create({
      id: uuidv4(),
      email: createUserDto.email,
      passwordHash,
      fullName: createUserDto.fullName,
      phoneNumber: createUserDto.phoneNumber,
      dateOfBirth: createUserDto.dateOfBirth ? new Date(createUserDto.dateOfBirth) : null,
      address: createUserDto.address,
      emergencyContact: createUserDto.emergencyContact,
      notes: createUserDto.notes,
      role: createUserDto.role || UserRole.USER,
      status: createUserDto.status || UserStatus.ACTIVE,
      assignedBranchId: createUserDto.assignedBranchId || null,
    });

    const savedUser = await this.userRepository.save(user);

    // Không trả về password hash
    const { passwordHash: _, ...result } = savedUser;
    return result;
  }

  async findAll() {
    const users = await this.userRepository.find({
      order: { createdAt: 'DESC' },
    });

    // Loại bỏ password hash
    return users.map(({ passwordHash, ...user }) => user);
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const { passwordHash, ...result } = user;
    return result;
  }

  async findByRole(role: UserRole) {
    const users = await this.userRepository.find({
      where: { role },
      order: { createdAt: 'DESC' },
    });

    return users.map(({ passwordHash, ...user }) => user);
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    // Nếu update email, kiểm tra trùng
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.userRepository.findOne({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new ConflictException('Email đã được sử dụng');
      }
    }

    // Nếu update password, hash mới
    if (updateUserDto.password) {
      const passwordHash = await bcrypt.hash(updateUserDto.password, 10);
      await this.userRepository.update(id, { passwordHash });
    }

    // Update các field khác
    const { password, dateOfBirth, ...updateData } = updateUserDto;

    // Chuyển đổi dateOfBirth từ string sang Date nếu có
    const finalUpdateData: Partial<User> = { ...updateData };
    if (dateOfBirth !== undefined) {
      finalUpdateData.dateOfBirth = dateOfBirth ? new Date(dateOfBirth) : null;
    }

    await this.userRepository.update(id, finalUpdateData);

    return this.findOne(id);
  }

  async resetPassword(id: string, newPassword = '123456') {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(id, { passwordHash });

    return {
      message: 'Đặt lại mật khẩu thành công',
      defaultPassword: newPassword,
    };
  }

  async remove(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    await this.userRepository.delete(id);

    return { message: 'Xóa người dùng thành công' };
  }

  async getStats() {
    const total = await this.userRepository.count();
    const active = await this.userRepository.count({ where: { status: UserStatus.ACTIVE } });
    const inactive = await this.userRepository.count({ where: { status: UserStatus.INACTIVE } });

    const adminCount = await this.userRepository.count({ where: { role: UserRole.ADMIN } });
    const managerCount = await this.userRepository.count({ where: { role: UserRole.MANAGER } });
    const technicianCount = await this.userRepository.count({ where: { role: UserRole.TECHNICIAN } });
    const userCount = await this.userRepository.count({ where: { role: UserRole.USER } });

    return {
      total,
      active,
      inactive,
      roles: {
        admin: adminCount,
        manager: managerCount,
        technician: technicianCount,
        user: userCount,
      },
    };
  }

  async assignBranch(userId: string, branchId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Không tìm thấy người dùng');
    }

    await this.userRepository.update(userId, { assignedBranchId: branchId });

    return this.findOne(userId);
  }

  async getUsersByBranch(branchId: string) {
    const users = await this.userRepository.find({
      where: { assignedBranchId: branchId },
      order: { createdAt: 'DESC' },
    });

    return users.map(({ passwordHash, ...user }) => user);
  }

  async getTechniciansByBranch(branchId: string) {
    const users = await this.userRepository.find({
      where: {
        assignedBranchId: branchId,
        role: UserRole.TECHNICIAN,
      },
      order: { createdAt: 'DESC' },
    });

    return users.map(({ passwordHash, ...user }) => user);
  }
}
