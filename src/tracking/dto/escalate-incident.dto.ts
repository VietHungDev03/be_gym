import { IsString, IsNotEmpty, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EscalateIncidentDto {
  @ApiProperty({
    example: 'Sự cố quá phức tạp, cần sự can thiệp của admin để giải quyết',
    description: 'Lý do chuyển lên admin (tối thiểu 10 ký tự)'
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  reason: string;
}
