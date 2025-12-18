import { IsString, IsOptional, IsEnum, IsInt, IsDateString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { EquipmentStatus } from '../entities/equipment.entity';

export class UpdateEquipmentDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  type?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  branchId?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  specifications?: string;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  qrCode?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  purchaseDate?: string;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  warrantyExpiry?: string;

  @ApiProperty({ required: false })
  @IsInt()
  @Min(1)
  @IsOptional()
  maintenanceInterval?: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  lastMaintenanceDate?: string;

  @ApiProperty({ required: false, enum: EquipmentStatus })
  @IsEnum(EquipmentStatus)
  @IsOptional()
  status?: EquipmentStatus;
}
