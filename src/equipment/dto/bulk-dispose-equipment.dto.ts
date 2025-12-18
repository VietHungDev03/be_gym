import { IsArray, IsString, IsDateString, IsOptional, MinLength, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BulkDisposeEquipmentDto {
  @ApiProperty({
    description: 'Danh sách ID thiết bị cần thanh lý',
    example: ['uuid-1', 'uuid-2', 'uuid-3'],
  })
  @IsArray()
  @IsUUID('4', { each: true })
  equipmentIds: string[];

  @ApiProperty({
    description: 'Lý do thanh lý',
    example: 'Thiết bị hỏng không thể sửa chữa',
  })
  @IsString()
  @MinLength(10, { message: 'Lý do thanh lý phải có ít nhất 10 ký tự' })
  disposalReason: string;

  @ApiProperty({
    description: 'Ngày thanh lý (mặc định là ngày hiện tại)',
    example: '2024-01-15',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  disposalDate?: string;
}
