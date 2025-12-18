import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BranchesService } from './branches.service';
import { CreateBranchDto } from './dto/create-branch.dto';
import { UpdateBranchDto } from './dto/update-branch.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';
import { BranchStatus } from './entities/branch.entity';

@ApiTags('Branches')
@Controller('branches')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class BranchesController {
  constructor(private readonly branchesService: BranchesService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Tạo chi nhánh mới' })
  @ApiResponse({ status: 201, description: 'Chi nhánh đã được tạo' })
  create(@Body() createBranchDto: CreateBranchDto) {
    return this.branchesService.create(createBranchDto);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.RECEPTIONIST, UserRole.USER)
  @ApiOperation({ summary: 'Lấy danh sách chi nhánh' })
  @ApiQuery({ name: 'status', enum: BranchStatus, required: false })
  @ApiResponse({ status: 200, description: 'Danh sách chi nhánh' })
  findAll(@Query('status') status?: BranchStatus) {
    return this.branchesService.findAll(status);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.TECHNICIAN, UserRole.RECEPTIONIST, UserRole.USER)
  @ApiOperation({ summary: 'Lấy chi tiết chi nhánh' })
  @ApiResponse({ status: 200, description: 'Chi tiết chi nhánh' })
  findOne(@Param('id') id: string) {
    return this.branchesService.findOne(id);
  }

  @Get(':id/staff')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Lấy danh sách nhân viên được gán cho chi nhánh' })
  @ApiResponse({ status: 200, description: 'Danh sách nhân viên' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy chi nhánh' })
  getBranchStaff(@Param('id') id: string) {
    return this.branchesService.getBranchStaff(id);
  }

  @Get(':id/statistics')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Lấy thống kê chi nhánh (bao gồm số lượng nhân viên)' })
  @ApiResponse({ status: 200, description: 'Thống kê chi nhánh' })
  getStatistics(@Param('id') id: string) {
    return this.branchesService.getStatistics(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Cập nhật chi nhánh' })
  @ApiResponse({ status: 200, description: 'Chi nhánh đã được cập nhật' })
  update(@Param('id') id: string, @Body() updateBranchDto: UpdateBranchDto) {
    return this.branchesService.update(id, updateBranchDto);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Xóa chi nhánh' })
  @ApiResponse({ status: 200, description: 'Chi nhánh đã được xóa' })
  remove(@Param('id') id: string) {
    return this.branchesService.remove(id);
  }
}
