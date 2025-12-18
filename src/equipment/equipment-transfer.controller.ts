import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { EquipmentTransferService } from './equipment-transfer.service';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { UpdateTransferStatusDto } from './dto/update-transfer-status.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions, Permission } from '../common/decorators/permissions.decorator';

@ApiTags('Equipment Transfers')
@Controller('equipment-transfers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class EquipmentTransferController {
  constructor(private readonly transferService: EquipmentTransferService) {}

  @Post()
  @Permissions(Permission.EQUIPMENT_UPDATE)
  @ApiOperation({ summary: 'Tạo yêu cầu điều chuyển thiết bị (Admin, Manager)' })
  @ApiResponse({ status: 201, description: 'Tạo thành công' })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  create(@Body() createDto: CreateTransferDto, @Request() req) {
    return this.transferService.createTransfer(createDto, req.user.id);
  }

  @Get()
  @Permissions(Permission.EQUIPMENT_READ)
  @ApiOperation({ summary: 'Lấy danh sách điều chuyển với filter và phân trang' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('equipmentId') equipmentId?: string,
    @Query('fromBranchId') fromBranchId?: string,
    @Query('toBranchId') toBranchId?: string,
    @Query('status') status?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'ASC' | 'DESC',
  ) {
    return this.transferService.findAll({
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 10,
      equipmentId,
      fromBranchId,
      toBranchId,
      status,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'DESC',
    });
  }

  @Get('stats')
  @Permissions(Permission.EQUIPMENT_READ)
  @ApiOperation({ summary: 'Lấy thống kê điều chuyển' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  getStats(@Query('branchId') branchId?: string) {
    return this.transferService.getTransferStats(branchId);
  }

  @Get('equipment/:equipmentId/history')
  @Permissions(Permission.EQUIPMENT_READ)
  @ApiOperation({ summary: 'Lấy lịch sử điều chuyển của thiết bị' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  getEquipmentHistory(@Param('equipmentId') equipmentId: string) {
    return this.transferService.getEquipmentTransferHistory(equipmentId);
  }

  @Get(':id')
  @Permissions(Permission.EQUIPMENT_READ)
  @ApiOperation({ summary: 'Lấy chi tiết điều chuyển' })
  @ApiResponse({ status: 200, description: 'Thành công' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  findOne(@Param('id') id: string) {
    return this.transferService.findOne(id);
  }

  @Patch(':id/status')
  @Permissions(Permission.EQUIPMENT_UPDATE)
  @ApiOperation({ summary: 'Cập nhật trạng thái điều chuyển (Admin, Manager)' })
  @ApiResponse({ status: 200, description: 'Cập nhật thành công' })
  @ApiResponse({ status: 400, description: 'Trạng thái không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy' })
  updateStatus(
    @Param('id') id: string,
    @Body() updateDto: UpdateTransferStatusDto,
    @Request() req,
  ) {
    return this.transferService.updateStatus(id, updateDto, req.user.id);
  }

  @Delete(':id')
  @Permissions(Permission.EQUIPMENT_DELETE)
  @ApiOperation({ summary: 'Xóa yêu cầu điều chuyển (chỉ khi pending)' })
  @ApiResponse({ status: 200, description: 'Xóa thành công' })
  @ApiResponse({ status: 400, description: 'Không thể xóa' })
  remove(@Param('id') id: string) {
    return this.transferService.remove(id);
  }
}
