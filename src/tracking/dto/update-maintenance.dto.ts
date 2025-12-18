import { IsString, IsUUID, IsEnum, IsDateString, IsOptional, IsNumber, IsBoolean, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { MaintenanceStatus, MaintenancePriority } from '../entities/maintenance-record.entity';
import { PartReplacedDto } from './maintenance-feedback.dto';

export class UpdateMaintenanceDto {
  @ApiProperty({ enum: MaintenanceStatus, required: false })
  @IsEnum(MaintenanceStatus)
  @IsOptional()
  status?: MaintenanceStatus;

  @ApiProperty({ enum: MaintenancePriority, required: false })
  @IsEnum(MaintenancePriority)
  @IsOptional()
  priority?: MaintenancePriority;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  scheduledDate?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @ApiProperty({ required: false })
  @IsUUID()
  @IsOptional()
  completedBy?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  cost?: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  actualDate?: string;

  // Phản hồi bảo trì từ kỹ thuật viên
  @ApiProperty({ description: 'Công việc đã thực hiện chi tiết', required: false })
  @IsString()
  @IsOptional()
  workPerformed?: string;

  @ApiProperty({ description: 'Các vấn đề/lỗi phát hiện', required: false })
  @IsString()
  @IsOptional()
  issuesFound?: string;

  @ApiProperty({ description: 'Danh sách linh kiện đã thay thế', type: [PartReplacedDto], required: false })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartReplacedDto)
  @IsOptional()
  partsReplaced?: PartReplacedDto[];

  @ApiProperty({ description: 'Còn lỗi chưa khắc phục', required: false })
  @IsBoolean()
  @IsOptional()
  hasRemainingIssues?: boolean;

  @ApiProperty({ description: 'Ghi chú của kỹ thuật viên sau bảo trì', required: false })
  @IsString()
  @IsOptional()
  technicianNotes?: string;
}
