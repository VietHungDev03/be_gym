import { IsString, IsBoolean, IsOptional, IsArray, ValidateNested, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class PartReplacedDto {
  @ApiProperty({ description: 'Tên linh kiện', example: 'Dây cáp' })
  @IsString()
  name: string;

  @ApiProperty({ description: 'Số lượng', example: 2 })
  @IsNumber()
  quantity: number;

  @ApiProperty({ description: 'Chi phí', example: 50000 })
  @IsNumber()
  cost: number;
}

export class MaintenanceFeedbackDto {
  @ApiProperty({
    description: 'Công việc đã thực hiện chi tiết',
    example: 'Bôi trơn băng tải, kiểm tra động cơ, vệ sinh bộ phận điều khiển',
    required: false
  })
  @IsString()
  @IsOptional()
  workPerformed?: string;

  @ApiProperty({
    description: 'Các vấn đề/lỗi phát hiện trong quá trình bảo trì',
    example: 'Phát hiện vết nứt nhỏ trên băng tải, cần thay thế trong 2 tuần',
    required: false
  })
  @IsString()
  @IsOptional()
  issuesFound?: string;

  @ApiProperty({
    description: 'Danh sách linh kiện đã thay thế',
    type: [PartReplacedDto],
    required: false,
    example: [
      { name: 'Dây cáp', quantity: 2, cost: 50000 },
      { name: 'Vít M8', quantity: 10, cost: 5000 }
    ]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PartReplacedDto)
  @IsOptional()
  partsReplaced?: PartReplacedDto[];

  @ApiProperty({
    description: 'Còn lỗi chưa khắc phục',
    example: false,
    default: false
  })
  @IsBoolean()
  @IsOptional()
  hasRemainingIssues?: boolean;

  @ApiProperty({
    description: 'Ghi chú của kỹ thuật viên sau bảo trì',
    example: 'Thiết bị hoạt động tốt, cần kiểm tra lại sau 1 tháng',
    required: false
  })
  @IsString()
  @IsOptional()
  technicianNotes?: string;
}
