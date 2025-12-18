import { IsString, IsNotEmpty, IsOptional, IsEnum, IsEmail } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BranchStatus } from '../entities/branch.entity';

export class CreateBranchDto {
  @ApiProperty({ description: 'Tên chi nhánh', example: 'Chi nhánh Quận 1' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ description: 'Mã chi nhánh (unique)', example: 'CN-Q1' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiPropertyOptional({ description: 'Địa chỉ' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Số điện thoại' })
  @IsString()
  @IsOptional()
  phone?: string;

  @ApiPropertyOptional({ description: 'Email chi nhánh' })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: 'ID quản lý chi nhánh' })
  @IsString()
  @IsOptional()
  managerId?: string;

  @ApiPropertyOptional({ description: 'Giờ mở cửa', example: '06:00-22:00' })
  @IsString()
  @IsOptional()
  openingHours?: string;

  @ApiPropertyOptional({ enum: BranchStatus, description: 'Trạng thái' })
  @IsEnum(BranchStatus)
  @IsOptional()
  status?: BranchStatus;

  @ApiPropertyOptional({ description: 'Mô tả' })
  @IsString()
  @IsOptional()
  description?: string;
}
