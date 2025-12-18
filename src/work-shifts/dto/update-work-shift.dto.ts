import { PartialType } from '@nestjs/swagger';
import { CreateWorkShiftDto } from './create-work-shift.dto';
import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ShiftStatus } from '../entities/work-shift.entity';

export class UpdateWorkShiftDto extends PartialType(CreateWorkShiftDto) {
  @ApiPropertyOptional({ enum: ShiftStatus, description: 'Trạng thái ca làm' })
  @IsEnum(ShiftStatus)
  @IsOptional()
  status?: ShiftStatus;
}
