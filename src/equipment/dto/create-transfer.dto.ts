import { IsString, IsUUID, IsDateString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTransferDto {
  @ApiProperty({
    description: 'ID của thiết bị cần điều chuyển',
    example: 'equipment-uuid',
  })
  @IsUUID()
  equipmentId: string;

  @ApiProperty({
    description: 'ID chi nhánh đích',
    example: 'branch-uuid',
  })
  @IsUUID()
  toBranchId: string;

  @ApiProperty({
    description: 'Ngày điều chuyển',
    example: '2024-01-15',
  })
  @IsDateString()
  transferDate: string;

  @ApiProperty({
    description: 'Lý do điều chuyển',
    example: 'Chi nhánh mới cần thêm thiết bị',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MinLength(10, { message: 'Lý do điều chuyển phải có ít nhất 10 ký tự' })
  reason?: string;

  @ApiProperty({
    description: 'Ghi chú thêm',
    example: 'Kiểm tra kỹ trước khi vận chuyển',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
