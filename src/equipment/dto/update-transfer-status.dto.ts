import { IsEnum, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTransferStatusDto {
  @ApiProperty({
    description: 'Trạng thái mới của điều chuyển',
    enum: ['pending', 'approved', 'rejected', 'completed'],
    example: 'approved',
  })
  @IsEnum(['pending', 'approved', 'rejected', 'completed'], {
    message: 'Trạng thái phải là pending, approved, rejected, hoặc completed',
  })
  status: string;

  @ApiProperty({
    description: 'Ghi chú thêm (tùy chọn)',
    example: 'Đã kiểm tra và phê duyệt',
    required: false,
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
