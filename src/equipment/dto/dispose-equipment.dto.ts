import { IsNotEmpty, IsString, IsOptional, IsDateString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class DisposeEquipmentDto {
  @ApiProperty({
    description: 'Lý do thanh lý thiết bị',
    example: 'Thiết bị hỏng nặng không thể sửa chữa',
  })
  @IsNotEmpty({ message: 'Lý do thanh lý không được để trống' })
  @IsString({ message: 'Lý do thanh lý phải là chuỗi' })
  disposalReason: string;

  @ApiPropertyOptional({
    description: 'Ngày thanh lý (nếu không truyền sẽ lấy ngày hiện tại)',
    example: '2025-10-14',
  })
  @IsOptional()
  @IsDateString({}, { message: 'Ngày thanh lý phải đúng định dạng YYYY-MM-DD' })
  disposalDate?: string;
}
