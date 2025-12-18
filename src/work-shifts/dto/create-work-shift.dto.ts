import { IsString, IsNotEmpty, IsOptional, IsEnum, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftStatus } from '../entities/work-shift.entity';

export class CreateWorkShiftDto {
  @ApiProperty({ description: 'ID kỹ thuật viên' })
  @IsString()
  @IsNotEmpty()
  technicianId: string;

  @ApiPropertyOptional({ description: 'ID chi nhánh' })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ description: 'Tên ca làm việc', example: 'Ca sáng' })
  @IsString()
  @IsNotEmpty()
  shiftName: string;

  @ApiProperty({ description: 'Ngày làm việc', example: '2024-01-15' })
  @IsDateString()
  @IsNotEmpty()
  shiftDate: string;

  @ApiProperty({ description: 'Giờ bắt đầu', example: '08:00:00' })
  @IsString()
  @IsNotEmpty()
  startTime: string;

  @ApiProperty({ description: 'Giờ kết thúc', example: '12:00:00' })
  @IsString()
  @IsNotEmpty()
  endTime: string;

  @ApiPropertyOptional({ description: 'Ghi chú' })
  @IsString()
  @IsOptional()
  notes?: string;
}
