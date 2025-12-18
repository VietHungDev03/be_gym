import { IsString, IsNotEmpty, IsOptional, IsEnum, IsInt, Min, IsDateString, IsBoolean, ValidateIf } from 'class-validator';
import { MaintenanceType, MaintenancePriority } from '../entities/maintenance-record.entity';

export class CreateMaintenanceScheduleDto {
  @IsString()
  @IsNotEmpty({ message: 'Tên lịch bảo trì không được để trống' })
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  // ========================================
  // PHẠM VI ÁP DỤNG (ít nhất 1 trong 3)
  // ========================================
  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.equipmentType && !o.branchId)
  @IsNotEmpty({ message: 'Phải chọn ít nhất một trong: thiết bị, loại thiết bị, hoặc chi nhánh' })
  equipmentId?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.equipmentId && !o.branchId)
  @IsNotEmpty({ message: 'Phải chọn ít nhất một trong: thiết bị, loại thiết bị, hoặc chi nhánh' })
  equipmentType?: string;

  @IsString()
  @IsOptional()
  @ValidateIf((o) => !o.equipmentId && !o.equipmentType)
  @IsNotEmpty({ message: 'Phải chọn ít nhất một trong: thiết bị, loại thiết bị, hoặc chi nhánh' })
  branchId?: string;

  // ========================================
  // THÔNG TIN BẢO TRÌ
  // ========================================
  @IsEnum(MaintenanceType, { message: 'Loại bảo trì không hợp lệ' })
  maintenanceType: MaintenanceType;

  @IsEnum(MaintenancePriority, { message: 'Độ ưu tiên không hợp lệ' })
  @IsOptional()
  priority?: MaintenancePriority;

  @IsString()
  @IsOptional()
  assignedTo?: string; // ID người phụ trách

  // ========================================
  // LỊCH TRÌNH
  // ========================================
  @IsDateString({}, { message: 'Ngày bắt đầu không hợp lệ' })
  startDate: string; // Format: YYYY-MM-DD

  @IsInt({ message: 'Chu kỳ phải là số nguyên' })
  @Min(1, { message: 'Chu kỳ phải lớn hơn 0' })
  recurrenceInterval: number; // Số ngày

  @IsDateString({}, { message: 'Ngày kết thúc không hợp lệ' })
  @IsOptional()
  endDate?: string; // Format: YYYY-MM-DD

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
