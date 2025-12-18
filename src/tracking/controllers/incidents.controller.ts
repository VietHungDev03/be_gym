import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { IncidentsService } from '../services/incidents.service';
import { CreateIncidentDto } from '../dto/create-incident.dto';
import { UpdateIncidentDto } from '../dto/update-incident.dto';
import { AssignIncidentDto } from '../dto/assign-incident.dto';
import { ResolveIncidentDto } from '../dto/resolve-incident.dto';
import { UpdateIncidentStatusDto } from '../dto/update-incident-status.dto';
import { EscalateIncidentDto } from '../dto/escalate-incident.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../users/entities/user.entity';
import { IncidentStatus } from '../entities/incident.entity';

@ApiTags('Tracking - Incidents')
@Controller('tracking/incidents')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class IncidentsController {
  constructor(private readonly incidentsService: IncidentsService) {}

  @Post()
  @ApiOperation({ summary: 'Báo cáo sự cố (tất cả users)' })
  @ApiResponse({ status: 201, description: 'Thành công' })
  create(@Body() createIncidentDto: CreateIncidentDto) {
    return this.incidentsService.create(createIncidentDto);
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách sự cố' })
  @ApiQuery({ name: 'status', required: false, enum: IncidentStatus })
  @ApiQuery({ name: 'equipmentId', required: false })
  @ApiResponse({ status: 200, description: 'Thành công' })
  findAll(
    @Query('status') status?: IncidentStatus,
    @Query('equipmentId') equipmentId?: string,
  ) {
    return this.incidentsService.findAll(status, equipmentId);
  }

  @Get('escalated')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Lấy danh sách sự cố đã được chuyển lên (Admin only)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 403, description: 'Không có quyền truy cập' })
  findEscalated() {
    return this.incidentsService.findEscalated();
  }

  @Get('my-branch')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TECHNICIAN, UserRole.RECEPTIONIST, UserRole.MANAGER)
  @ApiOperation({ summary: 'Lấy sự cố theo chi nhánh của user' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 400, description: 'User không được gán chi nhánh' })
  async findByMyBranch(@Request() req: any) {
    const userId = req.user.id;

    // Get user to find their assigned branch
    const userRepository = this.incidentsService['userRepository'];
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user || !user.assignedBranchId) {
      throw new Error('User không được gán chi nhánh');
    }

    return this.incidentsService.findByBranch(user.assignedBranchId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết sự cố' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string) {
    return this.incidentsService.findOne(id);
  }

  @Patch(':id')  @ApiOperation({ summary: 'Cập nhật sự cố (Admin, Manager, Technician)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  update(@Param('id') id: string, @Body() updateIncidentDto: UpdateIncidentDto) {
    return this.incidentsService.update(id, updateIncidentDto);
  }

  @Patch(':id/status')  @ApiOperation({ summary: 'Cập nhật trạng thái sự cố' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  updateStatus(@Param('id') id: string, @Body() updateStatusDto: UpdateIncidentStatusDto) {
    return this.incidentsService.updateStatus(id, updateStatusDto);
  }

  @Patch(':id/assign')  @ApiOperation({ summary: 'Giao sự cố cho technician (Admin, Manager)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  assign(@Param('id') id: string, @Body() assignDto: AssignIncidentDto) {
    return this.incidentsService.assign(id, assignDto);
  }

  @Patch(':id/resolve')  @ApiOperation({ summary: 'Đánh dấu sự cố đã giải quyết' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  resolve(@Param('id') id: string, @Body() resolveDto: ResolveIncidentDto) {
    return this.incidentsService.resolve(id, resolveDto);
  }

  @Post(':id/escalate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.TECHNICIAN, UserRole.MANAGER, UserRole.ADMIN)
  @ApiOperation({ summary: 'Chuyển sự cố lên admin (Technician có thể escalate)' })
  @ApiResponse({ status: 200, description: 'Chuyển lên admin thành công' })
  @ApiResponse({ status: 400, description: 'Sự cố đã được chuyển lên admin' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy sự cố' })
  escalate(
    @Param('id') id: string,
    @Body() escalateDto: EscalateIncidentDto,
    @Request() req: any,
  ) {
    return this.incidentsService.escalateToAdmin(id, req.user.id, escalateDto.reason);
  }
}
