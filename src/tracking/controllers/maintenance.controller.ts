import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { MaintenanceService } from '../services/maintenance.service';
import { AutoMaintenanceSchedulerService } from '../services/auto-maintenance-scheduler.service';
import { CreateMaintenanceDto } from '../dto/create-maintenance.dto';
import { UpdateMaintenanceDto } from '../dto/update-maintenance.dto';
import { MaintenanceFeedbackDto } from '../dto/maintenance-feedback.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { MaintenanceStatus } from '../entities/maintenance-record.entity';

@ApiTags('Tracking - Maintenance')
@Controller('tracking/maintenance')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MaintenanceController {
  constructor(
    private readonly maintenanceService: MaintenanceService,
    private readonly autoSchedulerService: AutoMaintenanceSchedulerService,
  ) {}

  @Post()  @ApiOperation({ summary: 'Tạo lịch bảo trì (Admin, Manager, Technician)' })
  @ApiResponse({ status: 201, description: 'Thành công' })
  create(@Body() createMaintenanceDto: CreateMaintenanceDto) {
    return this.maintenanceService.create(createMaintenanceDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách bảo trì' })
  @ApiQuery({ name: 'status', required: false, enum: MaintenanceStatus })
  @ApiQuery({ name: 'equipmentId', required: false })
  @ApiResponse({ status: 200, description: 'Thành công' })
  findAll(
    @Query('status') status?: MaintenanceStatus,
    @Query('equipmentId') equipmentId?: string,
  ) {
    return this.maintenanceService.findAll(status, equipmentId);
  }

  @Get('statistics')
  @ApiOperation({ summary: 'Lấy thống kê bảo trì với filter' })
  @ApiQuery({ name: 'equipmentId', required: false })
  @ApiQuery({ name: 'assignedTo', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Thành công' })
  getStatistics(
    @Query('equipmentId') equipmentId?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.maintenanceService.getMaintenanceStatistics({
      equipmentId,
      assignedTo,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  @Get('list/filtered')
  @ApiOperation({ summary: 'Lấy danh sách bảo trì với filter và phân trang' })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'equipmentId', required: false })
  @ApiQuery({ name: 'assignedTo', required: false })
  @ApiQuery({ name: 'status', required: false, enum: MaintenanceStatus })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'sortBy', required: false })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiResponse({ status: 200, description: 'Thành công' })
  getListFiltered(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('equipmentId') equipmentId?: string,
    @Query('assignedTo') assignedTo?: string,
    @Query('status') status?: MaintenanceStatus,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.maintenanceService.getMaintenanceList({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      equipmentId,
      assignedTo,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      sortBy: sortBy || 'scheduledDate',
      sortOrder: sortOrder || 'DESC',
    });
  }

  @Get('upcoming')
  @ApiOperation({ summary: 'Lấy lịch bảo trì sắp tới' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Thành công' })
  getUpcoming(@Query('days') days?: number) {
    return this.maintenanceService.getUpcoming(days ? Number(days) : 7);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết bảo trì' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string) {
    return this.maintenanceService.findOne(id);
  }

  @Patch(':id')  @ApiOperation({ summary: 'Cập nhật bảo trì (Admin, Manager, Technician)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  update(@Param('id') id: string, @Body() updateMaintenanceDto: UpdateMaintenanceDto) {
    return this.maintenanceService.update(id, updateMaintenanceDto);
  }

  @Post(':id/feedback')
  @ApiOperation({ summary: 'Submit phản hồi bảo trì (Technician)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 400, description: 'Lỗi validation hoặc không được phép' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy lịch bảo trì' })
  submitFeedback(
    @Param('id') id: string,
    @Body() feedbackDto: MaintenanceFeedbackDto,
    @Request() req: any,
  ) {
    return this.maintenanceService.submitFeedback(id, feedbackDto, req.user.id);
  }

  @Post('auto-schedule/trigger')
  @ApiOperation({ summary: 'Kích hoạt thủ công việc tạo lịch bảo trì tự động (Admin, Manager)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({
    status: 200,
    description: 'Trả về số lượng lịch bảo trì đã tạo',
    schema: {
      properties: {
        message: { type: 'string' },
        scheduledCount: { type: 'number' }
      }
    }
  })
  triggerAutoSchedule() {
    return this.autoSchedulerService.manualTrigger();
  }
}
