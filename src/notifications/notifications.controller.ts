import { Controller, Get, Post, Body, Param, Delete, Patch, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/entities/user.entity';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Tạo thông báo mới (Admin, Manager)' })
  @ApiResponse({ status: 201, description: 'Thông báo đã được tạo' })
  create(@Body() createNotificationDto: CreateNotificationDto) {
    return this.notificationsService.create(createNotificationDto);
  }

  @Get('my')
  @ApiOperation({ summary: 'Lấy tất cả thông báo của tôi' })
  @ApiResponse({ status: 200, description: 'Danh sách thông báo' })
  findMyNotifications(@Request() req) {
    return this.notificationsService.findByUser(req.user.userId);
  }

  @Get('my/unread')
  @ApiOperation({ summary: 'Lấy thông báo chưa đọc của tôi' })
  @ApiResponse({ status: 200, description: 'Danh sách thông báo chưa đọc' })
  findMyUnreadNotifications(@Request() req) {
    return this.notificationsService.findUnreadByUser(req.user.userId);
  }

  @Get('my/unread/count')
  @ApiOperation({ summary: 'Đếm số thông báo chưa đọc' })
  @ApiResponse({ status: 200, description: 'Số thông báo chưa đọc' })
  async countMyUnread(@Request() req) {
    const count = await this.notificationsService.countUnreadByUser(req.user.userId);
    return { count };
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Đánh dấu thông báo đã đọc' })
  @ApiResponse({ status: 200, description: 'Thông báo đã được đánh dấu đã đọc' })
  markAsRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Patch('my/read-all')
  @ApiOperation({ summary: 'Đánh dấu tất cả thông báo đã đọc' })
  @ApiResponse({ status: 200, description: 'Tất cả thông báo đã được đánh dấu đã đọc' })
  async markAllAsRead(@Request() req) {
    await this.notificationsService.markAllAsRead(req.user.userId);
    return { message: 'All notifications marked as read' };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa thông báo' })
  @ApiResponse({ status: 200, description: 'Thông báo đã được xóa' })
  remove(@Param('id') id: string) {
    return this.notificationsService.remove(id);
  }

  @Delete('my/read-all')
  @ApiOperation({ summary: 'Xóa tất cả thông báo đã đọc' })
  @ApiResponse({ status: 200, description: 'Tất cả thông báo đã đọc đã được xóa' })
  async removeAllRead(@Request() req) {
    await this.notificationsService.removeAllRead(req.user.userId);
    return { message: 'All read notifications deleted' };
  }
}
