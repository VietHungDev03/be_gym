import { IsEnum, IsString, IsOptional, IsNumber, IsArray, IsUUID } from 'class-validator';
import { AlertType, AlertSeverity } from '../entities/alert.entity';

export class CreateAlertDto {
  @IsEnum(AlertType)
  type: AlertType;

  @IsEnum(AlertSeverity)
  @IsOptional()
  severity?: AlertSeverity;

  @IsUUID()
  equipmentId: string;

  @IsUUID()
  @IsOptional()
  branchId?: string;

  @IsUUID()
  @IsOptional()
  maintenanceId?: string;

  @IsUUID()
  @IsOptional()
  sensorId?: string;

  @IsString()
  title: string;

  @IsString()
  message: string;

  @IsNumber()
  @IsOptional()
  sensorValue?: number;

  @IsString()
  @IsOptional()
  thresholdViolated?: string;

  @IsUUID()
  @IsOptional()
  assignedTo?: string;
}
