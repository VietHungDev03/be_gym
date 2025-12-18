import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { WorkShiftsService } from './work-shifts.service';
import { CreateWorkShiftDto } from './dto/create-work-shift.dto';
import { UpdateWorkShiftDto } from './dto/update-work-shift.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Work Shifts')
@Controller('work-shifts')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class WorkShiftsController {
  constructor(private readonly workShiftsService: WorkShiftsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Tạo ca làm việc mới' })
  @ApiResponse({ status: 201, description: 'Ca làm việc đã được tạo' })
  create(@Body() createWorkShiftDto: CreateWorkShiftDto) {
    return this.workShiftsService.create(createWorkShiftDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Lấy tất cả ca làm việc' })
  @ApiResponse({ status: 200, description: 'Danh sách ca làm việc' })
  findAll() {
    return this.workShiftsService.findAll();
  }

  @Get('technician/:technicianId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Lấy ca làm việc của kỹ thuật viên' })
  @ApiResponse({ status: 200, description: 'Danh sách ca làm việc' })
  findByTechnician(@Param('technicianId') technicianId: string) {
    return this.workShiftsService.findByTechnician(technicianId);
  }

  @Get('date')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Lấy ca làm việc theo ngày' })
  @ApiQuery({ name: 'date', required: true, example: '2024-01-15' })
  @ApiResponse({ status: 200, description: 'Danh sách ca làm việc' })
  findByDate(@Query('date') date: string) {
    return this.workShiftsService.findByDate(new Date(date));
  }

  @Get('range')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Lấy ca làm việc theo khoảng thời gian' })
  @ApiQuery({ name: 'startDate', required: true })
  @ApiQuery({ name: 'endDate', required: true })
  @ApiResponse({ status: 200, description: 'Danh sách ca làm việc' })
  findByDateRange(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.workShiftsService.findByDateRange(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Get('available-technicians')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Lấy danh sách kỹ thuật viên đang trong ca làm việc' })
  @ApiResponse({ status: 200, description: 'Danh sách kỹ thuật viên' })
  getAvailableTechnicians() {
    return this.workShiftsService.getAvailableTechnicians();
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN)
  @ApiOperation({ summary: 'Lấy chi tiết ca làm việc' })
  @ApiResponse({ status: 200, description: 'Chi tiết ca làm việc' })
  findOne(@Param('id') id: string) {
    return this.workShiftsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Cập nhật ca làm việc' })
  @ApiResponse({ status: 200, description: 'Ca làm việc đã được cập nhật' })
  update(@Param('id') id: string, @Body() updateWorkShiftDto: UpdateWorkShiftDto) {
    return this.workShiftsService.update(id, updateWorkShiftDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Xóa ca làm việc' })
  @ApiResponse({ status: 200, description: 'Ca làm việc đã được xóa' })
  remove(@Param('id') id: string) {
    return this.workShiftsService.remove(id);
  }
}
