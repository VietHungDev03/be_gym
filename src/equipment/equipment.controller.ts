import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EquipmentService } from './equipment.service';
import { CreateEquipmentDto } from './dto/create-equipment.dto';
import { UpdateEquipmentDto } from './dto/update-equipment.dto';
import { DisposeEquipmentDto } from './dto/dispose-equipment.dto';
import { BulkDisposeEquipmentDto } from './dto/bulk-dispose-equipment.dto';
import { UpdateLiquidationStatusDto } from './dto/update-liquidation-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions, Permission } from '../common/decorators/permissions.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { EquipmentStatus } from './entities/equipment.entity';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Equipment')
@Controller('equipment')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class EquipmentController {
  constructor(private readonly equipmentService: EquipmentService) {}

  @Post()
  @Permissions(Permission.EQUIPMENT_CREATE)
  @ApiOperation({ summary: 'Tạo thiết bị mới (Admin, Manager)' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  create(@Body() createEquipmentDto: CreateEquipmentDto) {
    return this.equipmentService.create(createEquipmentDto);
  }

  @Get()
  @Permissions(Permission.EQUIPMENT_READ)
  @ApiOperation({ summary: 'Lấy danh sách thiết bị với filter và phân trang (tất cả users)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  findAll(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('branchId') branchId?: string,
    @Query('location') location?: string,
    @Query('type') type?: string,
    @Query('status') status?: EquipmentStatus,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    // Auto-filter by branch for TECHNICIAN and RECEPTIONIST roles
    let effectiveBranchId = branchId;
    if ((user.role === UserRole.TECHNICIAN || user.role === UserRole.RECEPTIONIST) && user.assignedBranchId) {
      effectiveBranchId = user.assignedBranchId;
    }

    return this.equipmentService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      branchId: effectiveBranchId,
      location,
      type,
      status,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'DESC',
    });
  }

  @Get('filters/options')
  @Permissions(Permission.EQUIPMENT_READ)
  @ApiOperation({ summary: 'Lấy danh sách options cho filter (tất cả users)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  getFilterOptions() {
    return this.equipmentService.getFilterOptions();
  }

  @Get('my-branch')
  @Permissions(Permission.EQUIPMENT_READ)
  @ApiOperation({ summary: 'Lấy danh sách thiết bị của chi nhánh được gán cho user' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 400, description: 'Người dùng chưa được gán chi nhánh' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người dùng' })
  findByMyBranch(
    @CurrentUser() user: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('location') location?: string,
    @Query('type') type?: string,
    @Query('status') status?: EquipmentStatus,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.equipmentService.findByUserBranch(user.id, {
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      location,
      type,
      status,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'DESC',
    });
  }

  @Get('qr/:code')
  @Permissions(Permission.EQUIPMENT_READ)
  @ApiOperation({ summary: 'Tìm thiết bị theo mã QR (tất cả users, use case: quét RFID)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findByQRCode(@Param('code') code: string) {
    return this.equipmentService.findByQRCode(code);
  }

  @Get('status/:status')
  @Permissions(Permission.EQUIPMENT_READ)
  @ApiOperation({ summary: 'Lọc thiết bị theo trạng thái (tất cả users)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  findByStatus(@Param('status') status: EquipmentStatus) {
    return this.equipmentService.findByStatus(status);
  }

  @Get(':id')
  @Permissions(Permission.EQUIPMENT_READ)
  @ApiOperation({ summary: 'Lấy chi tiết thiết bị (tất cả users)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string) {
    return this.equipmentService.findOne(id);
  }

  @Patch(':id')
  @Permissions(Permission.EQUIPMENT_UPDATE)
  @ApiOperation({ summary: 'Cập nhật thiết bị (Admin, Manager)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  update(@Param('id') id: string, @Body() updateEquipmentDto: UpdateEquipmentDto) {
    return this.equipmentService.update(id, updateEquipmentDto);
  }

  @Delete(':id')
  @Permissions(Permission.EQUIPMENT_DELETE)
  @ApiOperation({ summary: 'Xóa thiết bị (chỉ Admin, Manager)' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  remove(@Param('id') id: string) {
    return this.equipmentService.remove(id);
  }

  @Post(':id/dispose')
  @Permissions(Permission.EQUIPMENT_DELETE)
  @ApiOperation({ summary: 'Thanh lý thiết bị (Admin, Manager)' })
  @ApiResponse({ status: 200, description: 'Thanh lý thành công' })
  @ApiResponse({ status: 400, description: 'Thiết bị đã được thanh lý trước đó' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thiết bị' })
  disposeEquipment(@Param('id') id: string, @Body() disposeDto: DisposeEquipmentDto) {
    return this.equipmentService.disposeEquipment(id, disposeDto);
  }

  @Post('bulk-dispose')
  @Permissions(Permission.EQUIPMENT_DELETE)
  @ApiOperation({ summary: 'Thanh lý nhiều thiết bị cùng lúc (Admin, Manager)' })
  @ApiResponse({ status: 200, description: 'Thanh lý thành công' })
  @ApiResponse({ status: 400, description: 'Một hoặc nhiều thiết bị đã được thanh lý trước đó' })
  @ApiResponse({ status: 404, description: 'Một hoặc nhiều thiết bị không tồn tại' })
  bulkDisposeEquipment(@Body() bulkDisposeDto: BulkDisposeEquipmentDto) {
    return this.equipmentService.bulkDisposeEquipment(bulkDisposeDto);
  }

  @Patch(':id/liquidation-status')
  @Permissions(Permission.EQUIPMENT_UPDATE)
  @ApiOperation({ summary: 'Cập nhật trạng thái thanh lý (Admin, Manager)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 400, description: 'Trạng thái không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy thiết bị' })
  updateLiquidationStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateLiquidationStatusDto,
  ) {
    return this.equipmentService.updateLiquidationStatus(id, updateDto);
  }

  @Get('disposed-history/list')
  @Permissions(Permission.EQUIPMENT_READ)
  @ApiOperation({ summary: 'Lấy lịch sử thiết bị đã thanh lý (Admin, Manager)' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  getDisposedHistory(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
    @Query('includeAll') includeAll?: string,
  ) {
    return this.equipmentService.getDisposedHistory({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      sortBy: sortBy || 'disposalDate',
      sortOrder: sortOrder || 'DESC',
      includeAll: includeAll === 'true',
    });
  }
}
