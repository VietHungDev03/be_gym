import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResolveIncidentDto {
  @ApiProperty({
    description: 'Mô tả giải pháp xử lý',
    example: 'Đã thay thế bộ phận bị hỏng',
  })
  @IsString()
  resolution: string;

  @ApiProperty({
    description: 'Ghi chú thêm',
    example: 'Đã test lại và hoạt động bình thường',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
