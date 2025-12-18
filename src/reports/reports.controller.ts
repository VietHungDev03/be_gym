import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { ReportsService, TimeFilter } from './reports.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Reports')
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('usage')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Báo cáo sử dụng (Admin, Manager)' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiResponse({ status: 200, description: 'Thành công' })
  getUsageReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getUsageReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('maintenance')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Báo cáo bảo trì (Admin, Manager)' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiResponse({ status: 200, description: 'Thành công' })
  getMaintenanceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getMaintenanceReport(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('equipment')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Báo cáo thiết bị (Admin, Manager)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  getEquipmentReport() {
    return this.reportsService.getEquipmentReport();
  }

  @Get('statistics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Thống kê tổng quan thiết bị, bảo trì, sự cố với filter thời gian' })
  @ApiQuery({ name: 'filter', enum: TimeFilter, required: false, description: 'Lọc theo: week, month, quarter, year, custom' })
  @ApiQuery({ name: 'startDate', required: false, description: 'Ngày bắt đầu (dùng với filter=custom)' })
  @ApiQuery({ name: 'endDate', required: false, description: 'Ngày kết thúc (dùng với filter=custom)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  getEquipmentStatistics(
    @Query('filter') filter?: TimeFilter,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.reportsService.getEquipmentStatistics(
      filter || TimeFilter.MONTH,
      start,
      end,
    );
  }

  @Get('incidents')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Báo cáo sự cố chi tiết với filter thời gian' })
  @ApiQuery({ name: 'filter', enum: TimeFilter, required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Thành công' })
  getIncidentReport(
    @Query('filter') filter?: TimeFilter,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.reportsService.getIncidentReport(
      filter || TimeFilter.MONTH,
      start,
      end,
    );
  }
}
