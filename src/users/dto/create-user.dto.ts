import { IsEmail, IsString, MinLength, IsEnum, IsOptional, IsDateString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, UserStatus } from '../entities/user.entity';

export class CreateUserDto {
  @ApiProperty({ example: 'user@igymcare.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Password@123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn A' })
  @IsString()
  @MinLength(2)
  fullName: string;

  @ApiProperty({ example: '0901234567', required: false })
  @IsString()
  @IsOptional()
  phoneNumber?: string;

  @ApiProperty({ example: '1990-01-01', required: false })
  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @ApiProperty({ example: '123 Nguyễn Văn Linh, Q7, TP.HCM', required: false })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiProperty({ example: 'Nguyễn Văn B - 0912345678', required: false })
  @IsString()
  @IsOptional()
  emergencyContact?: string;

  @ApiProperty({ example: 'Ghi chú về người dùng', required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ example: 'user', enum: UserRole, required: false })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;

  @ApiProperty({ example: 'active', enum: UserStatus, required: false })
  @IsEnum(UserStatus)
  @IsOptional()
  status?: UserStatus;

  @ApiProperty({ example: 'uuid-of-branch', required: false, description: 'Chi nhánh được phân công (dành cho technician và receptionist)' })
  @IsUUID()
  @IsOptional()
  assignedBranchId?: string;
}
