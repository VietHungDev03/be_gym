import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UsageService } from '../services/usage.service';
import { StartUsageDto } from '../dto/start-usage.dto';
import { EndUsageDto } from '../dto/end-usage.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Tracking - Usage')
@Controller('tracking/usage')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsageController {
  constructor(private readonly usageService: UsageService) {}

  @Post('start')
  @ApiOperation({ summary: 'Bắt đầu sử dụng thiết bị' })
  @ApiResponse({ status: 201, description: 'Thành công' })
  startUsage(@Body() startUsageDto: StartUsageDto) {
    return this.usageService.startUsage(startUsageDto);
  }

  @Patch(':id/end')
  @ApiOperation({ summary: 'Kết thúc sử dụng thiết bị' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  endUsage(@Param('id') id: string, @Body() endUsageDto: EndUsageDto) {
    return this.usageService.endUsage(id, endUsageDto);
  }

  @Get('equipment/:equipmentId')
  @ApiOperation({ summary: 'Lấy lịch sử sử dụng thiết bị' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Thành công' })
  findByEquipment(
    @Param('equipmentId') equipmentId: string,
    @Query('limit') limit?: number,
  ) {
    return this.usageService.findByEquipment(equipmentId, limit || 50);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Thống kê sử dụng thiết bị' })
  @ApiQuery({ name: 'equipmentId', required: true })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiResponse({ status: 200, description: 'Thành công' })
  getStats(
    @Query('equipmentId') equipmentId: string,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.usageService.getStats(
      equipmentId,
      new Date(startDate),
      new Date(endDate),
    );
  }
}
