import { IsString, IsOptional, IsEnum, IsInt, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EquipmentStatus } from '../entities/equipment.entity';

export class CreateEquipmentDto {
  @ApiProperty({ example: 'Máy chạy bộ Life Fitness T3' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Máy chạy bộ' })
  @IsString()
  type: string;

  @ApiProperty({ example: 'uuid-of-branch', required: false })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ example: 'Máy chạy bộ cao cấp...', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'Khu vực Cardio - Tầng 1', required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ example: 'Động cơ 3.0HP, tốc độ tối đa 20km/h', required: false })
  @IsString()
  @IsOptional()
  specifications?: string;

  @ApiProperty({ example: 'EQ_1234567890_ABC123', required: false })
  @IsString()
  @IsOptional()
  qrCode?: string;

  @ApiProperty({ example: '2024-01-15', required: false })
  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @ApiProperty({ example: '2026-01-15', required: false })
  @IsDateString()
  @IsOptional()
  warrantyExpiry?: string;

  @ApiProperty({ example: 30, required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  maintenanceInterval?: number;

  @ApiProperty({ example: '2024-06-15', required: false })
  @IsDateString()
  @IsOptional()
  lastMaintenanceDate?: string;

  @ApiProperty({ example: 'active', enum: EquipmentStatus, required: false })
  @IsEnum(EquipmentStatus)
  @IsOptional()
  status?: EquipmentStatus;
}
