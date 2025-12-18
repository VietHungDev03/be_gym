import { IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { IncidentStatus } from '../entities/incident.entity';

export class UpdateIncidentStatusDto {
  @ApiProperty({
    description: 'Trạng thái mới',
    enum: IncidentStatus,
    example: IncidentStatus.INVESTIGATING,
  })
  @IsEnum(IncidentStatus)
  status: IncidentStatus;

  @ApiProperty({
    description: 'Giải pháp xử lý (bắt buộc khi resolved/closed)',
    example: 'Đã sửa chữa xong',
    required: false,
  })
  @IsString()
  @IsOptional()
  resolution?: string;

  @ApiProperty({
    description: 'Ghi chú thêm',
    example: 'Cần theo dõi thêm',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
