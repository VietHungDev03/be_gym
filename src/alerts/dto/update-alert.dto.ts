import { IsEnum, IsString, IsOptional, IsArray, IsUUID } from 'class-validator';
import { AlertStatus, AlertSeverity } from '../entities/alert.entity';

export class UpdateAlertDto {
  @IsEnum(AlertStatus)
  @IsOptional()
  status?: AlertStatus;

  @IsEnum(AlertSeverity)
  @IsOptional()
  severity?: AlertSeverity;

  @IsUUID()
  @IsOptional()
  assignedTo?: string;

  @IsString()
  @IsOptional()
  resolutionNotes?: string;
}
