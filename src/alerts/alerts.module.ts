import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Alert } from './entities/alert.entity';
import { AlertsService } from './alerts.service';
import { AlertsController } from './alerts.controller';
import { AlertsSchedulerService } from './alerts-scheduler.service';
import { AlertNotificationService } from './alert-notification.service';
import { MaintenanceRecord } from '../tracking/entities/maintenance-record.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { User } from '../users/entities/user.entity';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Alert,
      MaintenanceRecord,
      Equipment,
      User,
    ]),
    NotificationsModule,
  ],
  controllers: [AlertsController],
  providers: [AlertsService, AlertsSchedulerService, AlertNotificationService],
  exports: [AlertsService],
})
export class AlertsModule {}
