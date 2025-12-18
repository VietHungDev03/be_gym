import { IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { EquipmentStatus } from '../entities/equipment.entity';

export class UpdateLiquidationStatusDto {
  @ApiProperty({
    description: 'Trạng thái thanh lý mới',
    enum: [EquipmentStatus.PREPARING_LIQUIDATION, EquipmentStatus.PENDING_LIQUIDATION, EquipmentStatus.DISPOSED],
    example: EquipmentStatus.PREPARING_LIQUIDATION,
  })
  @IsEnum(EquipmentStatus, {
    message: 'Trạng thái phải là preparing_liquidation, pending_liquidation, hoặc disposed',
  })
  status: EquipmentStatus;

  @ApiPropertyOptional({
    description: 'Lý do thanh lý thiết bị',
    example: 'Thiết bị hỏng không thể sửa chữa',
    minLength: 10,
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Lý do thanh lý phải có ít nhất 10 ký tự' })
  disposalReason?: string;
}
