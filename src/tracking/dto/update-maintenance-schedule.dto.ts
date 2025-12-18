import { IsString, IsOptional, IsEnum, IsInt, Min, IsDateString, IsBoolean } from 'class-validator';
import { MaintenanceType, MaintenancePriority } from '../entities/maintenance-record.entity';

export class UpdateMaintenanceScheduleDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  // ========================================
  // PHẠM VI ÁP DỤNG
  // ========================================
  @IsString()
  @IsOptional()
  equipmentId?: string;

  @IsString()
  @IsOptional()
  equipmentType?: string;

  @IsString()
  @IsOptional()
  branchId?: string;

  // ========================================
  // THÔNG TIN BẢO TRÌ
  // ========================================
  @IsEnum(MaintenanceType, { message: 'Loại bảo trì không hợp lệ' })
  @IsOptional()
  maintenanceType?: MaintenanceType;

  @IsEnum(MaintenancePriority, { message: 'Độ ưu tiên không hợp lệ' })
  @IsOptional()
  priority?: MaintenancePriority;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  // ========================================
  // LỊCH TRÌNH
  // ========================================
  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  @IsOptional()
  startDate?: string;

  @IsInt({ message: 'Chu kỳ phải là số nguyên' })
  @Min(1, { message: 'Chu kỳ phải lớn hơn 0' })
  @IsOptional()
  recurrenceInterval?: number;

  @IsDateString({}, { message: 'Ngày bắt đầu bảo trì tiếp theo không hợp lệ' })
  @IsOptional()
  nextScheduledDate?: string;

  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  @IsOptional()
  endDate?: string;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
