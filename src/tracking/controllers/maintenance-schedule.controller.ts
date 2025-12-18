import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { MaintenanceScheduleService } from '../services/maintenance-schedule.service';
import { CreateMaintenanceScheduleDto } from '../dto/create-maintenance-schedule.dto';
import { UpdateMaintenanceScheduleDto } from '../dto/update-maintenance-schedule.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';

/**
 * Controller: MaintenanceSchedule
 * Quản lý lịch bảo trì định kỳ
 *
 * Endpoints:
 * - POST /api/maintenance-schedules - Tạo lịch bảo trì
 * - GET /api/maintenance-schedules - Lấy danh sách
 * - GET /api/maintenance-schedules/:id - Lấy chi tiết
 * - PATCH /api/maintenance-schedules/:id - Cập nhật
 * - DELETE /api/maintenance-schedules/:id - Xóa
 * - GET /api/maintenance-schedules/:id/equipment - Xem thiết bị áp dụng
 * - POST /api/maintenance-schedules/:id/generate - Tạo maintenance records thủ công
 */
@Controller('maintenance-schedules')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MaintenanceScheduleController {
  constructor(private readonly scheduleService: MaintenanceScheduleService) {}

  /**
   * POST /api/maintenance-schedules
   * Tạo lịch bảo trì định kỳ mới
   * Quyền: admin, manager, technician
   */
  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  async create(
    @Body() createDto: CreateMaintenanceScheduleDto,
    @Request() req,
  ) {
    return this.scheduleService.create(createDto, req.user.userId);
  }

  /**
   * GET /api/maintenance-schedules
   * Lấy danh sách lịch bảo trì
   * Query params:
   * - isActive: boolean - Lọc theo trạng thái hoạt động
   * - branchId: string - Lọc theo chi nhánh
   */
  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  async findAll(
    @Query('isActive') isActive?: string,
    @Query('branchId') branchId?: string,
  ) {
    const isActiveBool = isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.scheduleService.findAll(isActiveBool, branchId);
  }

  /**
   * GET /api/maintenance-schedules/:id
   * Lấy chi tiết một lịch bảo trì
   */
  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  async findOne(@Param('id') id: string) {
    return this.scheduleService.findOne(id);
  }

  /**
   * PATCH /api/maintenance-schedules/:id
   * Cập nhật lịch bảo trì
   * Quyền: admin, manager, technician
   */
  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  async update(
    @Param('id') id: string,
    @Body() updateDto: UpdateMaintenanceScheduleDto,
  ) {
    return this.scheduleService.update(id, updateDto);
  }

  /**
   * DELETE /api/maintenance-schedules/:id
   * Xóa lịch bảo trì
   * Quyền: admin, manager
   */
  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async delete(@Param('id') id: string) {
    return this.scheduleService.delete(id);
  }

  /**
   * GET /api/maintenance-schedules/:id/equipment
   * Xem danh sách thiết bị áp dụng cho lịch bảo trì này
   */
  @Get(':id/equipment')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  async getMatchingEquipment(@Param('id') id: string) {
    return this.scheduleService.findMatchingEquipment(id);
  }

  /**
   * POST /api/maintenance-schedules/:id/generate
   * Tạo maintenance records thủ công (không cần chờ scheduler)
   * Quyền: admin, manager
   */
  @Post(':id/generate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  async generateRecords(@Param('id') id: string) {
    return this.scheduleService.generateMaintenanceRecords(id);
  }

  /**
   * POST /api/maintenance-schedules/process-all
   * Xử lý tất cả lịch bảo trì đến hạn (thường được gọi bởi cron)
   * Quyền: admin only
   */
  @Post('process/all')
  @Roles(UserRole.ADMIN)
  async processAll() {
    return this.scheduleService.processAllDueSchedules();
  }
}
