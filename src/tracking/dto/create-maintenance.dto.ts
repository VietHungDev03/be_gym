import { IsString, IsUUID, IsEnum, IsDateString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { MaintenanceType, MaintenancePriority } from '../entities/maintenance-record.entity';

export class CreateMaintenanceDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  @IsUUID()
  equipmentId: string;

  @ApiProperty({ enum: MaintenanceType })
  @IsEnum(MaintenanceType)
  type: MaintenanceType;

  @ApiProperty({ example: 'Bảo trì định kỳ cho máy chạy bộ' })
  @IsString()
  description: string;

  @ApiProperty({ enum: MaintenancePriority, required: false })
  @IsEnum(MaintenancePriority)
  @IsOptional()
  priority?: MaintenancePriority;

  @ApiProperty({ example: '2025-12-31T10:00:00Z' })
  @IsDateString()
  scheduledDate: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  cost?: number;
}
