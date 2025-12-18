import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EndUsageDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  notes?: string;
}
