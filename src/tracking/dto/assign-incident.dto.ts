import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class AssignIncidentDto {
  @ApiProperty({
    description: 'ID người được giao (technician)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsString()
  assignedTo: string;

  @ApiProperty({
    description: 'Ghi chú khi giao việc',
    example: 'Kiểm tra và sửa chữa ngay',
    required: false,
  })
  @IsString()
  @IsOptional()
  notes?: string;
}
