import { Injectable, UnauthorizedException, ConflictException, BadRequestException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { User, UserRole, UserStatus } from '../users/entities/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto) {
    // Kiểm tra email đã tồn tại
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new ConflictException('Email đã được sử dụng');
    }

    // Hash password
    const passwordHash = await bcrypt.hash(registerDto.password, 10);

    // Tạo user mới
    const user = this.userRepository.create({
      id: uuidv4(),
      email: registerDto.email,
      passwordHash,
      fullName: registerDto.fullName,
      role: registerDto.role || UserRole.USER,
      status: UserStatus.ACTIVE,
    });

    await this.userRepository.save(user);

    // Tạo JWT token
    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        assignedBranchId: user.assignedBranchId || null,
      },
      ...tokens,
    };
  }

  async login(loginDto: LoginDto) {
    // Tìm user theo email
    const user = await this.userRepository.findOne({
      where: { email: loginDto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Kiểm tra password
    const isPasswordValid = await bcrypt.compare(loginDto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Email hoặc mật khẩu không đúng');
    }

    // Kiểm tra status
    if (user.status !== 'active') {
      throw new UnauthorizedException('Tài khoản đã bị vô hiệu hóa');
    }

    // Cập nhật last login
    await this.userRepository.update(user.id, {
      lastLoginAt: new Date(),
    });

    // Tạo JWT tokens
    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        status: user.status,
        assignedBranchId: user.assignedBranchId,
      },
      ...tokens,
    };
  }

  async getProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('Người dùng không tồn tại');
    }

    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth,
      address: user.address,
      emergencyContact: user.emergencyContact,
      notes: user.notes,
      role: user.role,
      status: user.status,
      assignedBranchId: user.assignedBranchId,
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
    };
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    // Kiểm tra mật khẩu hiện tại
    const isCurrentPasswordValid = await bcrypt.compare(
      changePasswordDto.currentPassword,
      user.passwordHash,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Mật khẩu hiện tại không đúng');
    }

    // Hash mật khẩu mới
    const newPasswordHash = await bcrypt.hash(changePasswordDto.newPassword, 10);

    // Cập nhật mật khẩu
    await this.userRepository.update(userId, {
      passwordHash: newPasswordHash,
    });

    return {
      message: 'Đổi mật khẩu thành công',
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.userRepository.findOne({
      where: { email: forgotPasswordDto.email },
    });

    if (!user) {
      // Không tiết lộ email có tồn tại hay không (bảo mật)
      return {
        message: 'Nếu email tồn tại, link reset password đã được gửi',
      };
    }

    // Tạo reset token (expires trong 1 giờ)
    const resetToken = this.jwtService.sign(
      { sub: user.id, email: user.email, type: 'reset' },
      { expiresIn: '1h' },
    );

    // TODO: Gửi email với link reset password
    // const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
    // await emailService.sendResetPasswordEmail(user.email, resetLink);

    console.log('Reset token:', resetToken); // Dev only

    return {
      message: 'Nếu email tồn tại, link reset password đã được gửi',
      // Dev only - xóa trong production
      resetToken,
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    try {
      // Verify reset token
      const payload = this.jwtService.verify(resetPasswordDto.token);

      if (payload.type !== 'reset') {
        throw new BadRequestException('Token không hợp lệ');
      }

      const user = await this.userRepository.findOne({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      // Hash mật khẩu mới
      const newPasswordHash = await bcrypt.hash(resetPasswordDto.newPassword, 10);

      // Cập nhật mật khẩu
      await this.userRepository.update(user.id, {
        passwordHash: newPasswordHash,
      });

      return {
        message: 'Reset mật khẩu thành công',
      };
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        throw new BadRequestException('Token đã hết hạn');
      }
      if (error.name === 'JsonWebTokenError') {
        throw new BadRequestException('Token không hợp lệ');
      }
      throw error;
    }
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: process.env.JWT_EXPIRATION || '7d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
      expiresIn: process.env.JWT_REFRESH_EXPIRATION || '30d',
    });

    return {
      accessToken,
      refreshToken,
    };
  }
}
