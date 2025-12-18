import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AlertsService } from './alerts.service';
import { CreateAlertDto } from './dto/create-alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';
import { AcknowledgeAlertDto } from './dto/acknowledge-alert.dto';
import { ResolveAlertDto } from './dto/resolve-alert.dto';
import { AlertStatus, AlertType, AlertSeverity } from './entities/alert.entity';

@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  /**
   * Tạo cảnh báo mới (thường được gọi bởi system/scheduler)
   */
  @Post()
  create(@Body() createAlertDto: CreateAlertDto) {
    return this.alertsService.create(createAlertDto);
  }

  /**
   * Lấy tất cả cảnh báo với filter
   */
  @Get()
  findAll(
    @Query('status') status?: AlertStatus,
    @Query('type') type?: AlertType,
    @Query('severity') severity?: AlertSeverity,
    @Query('equipmentId') equipmentId?: string,
    @Query('branchId') branchId?: string,
    @Query('assignedTo') assignedTo?: string,
  ) {
    return this.alertsService.findAll({
      status,
      type,
      severity,
      equipmentId,
      branchId,
      assignedTo,
    });
  }

  /**
   * Lấy cảnh báo active (chưa resolved)
   */
  @Get('active')
  findActive() {
    return this.alertsService.findActive();
  }

  /**
   * Lấy cảnh báo critical
   */
  @Get('critical')
  findCritical() {
    return this.alertsService.findCritical();
  }

  /**
   * Lấy thống kê cảnh báo
   */
  @Get('stats')
  getStats() {
    return this.alertsService.getStats();
  }

  /**
   * Lấy cảnh báo theo equipment
   */
  @Get('equipment/:equipmentId')
  findByEquipment(@Param('equipmentId') equipmentId: string) {
    return this.alertsService.findByEquipment(equipmentId);
  }

  /**
   * Lấy chi tiết cảnh báo
   */
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.alertsService.findOne(id);
  }

  /**
   * Cập nhật cảnh báo
   */
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateAlertDto: UpdateAlertDto) {
    return this.alertsService.update(id, updateAlertDto);
  }

  /**
   * Xác nhận cảnh báo
   */
  @Post(':id/acknowledge')
  acknowledge(@Param('id') id: string, @Body() acknowledgeDto: AcknowledgeAlertDto) {
    return this.alertsService.acknowledge(id, acknowledgeDto);
  }

  /**
   * Giải quyết cảnh báo
   */
  @Post(':id/resolve')
  resolve(@Param('id') id: string, @Body() resolveDto: ResolveAlertDto) {
    return this.alertsService.resolve(id, resolveDto);
  }

  /**
   * Bỏ qua cảnh báo
   */
  @Post(':id/dismiss')
  dismiss(@Param('id') id: string, @Body('userId') userId: string) {
    return this.alertsService.dismiss(id, userId);
  }
}
