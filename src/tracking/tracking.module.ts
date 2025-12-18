import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsageLog } from './entities/usage-log.entity';
import { MaintenanceRecord } from './entities/maintenance-record.entity';
import { MaintenanceSchedule } from './entities/maintenance-schedule.entity';
import { Incident } from './entities/incident.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { User } from '../users/entities/user.entity';
import { UsageService } from './services/usage.service';
import { MaintenanceService } from './services/maintenance.service';
import { MaintenanceScheduleService } from './services/maintenance-schedule.service';
import { IncidentsService } from './services/incidents.service';
import { AutoMaintenanceSchedulerService } from './services/auto-maintenance-scheduler.service';
import { UsageController } from './controllers/usage.controller';
import { MaintenanceController } from './controllers/maintenance.controller';
import { MaintenanceScheduleController } from './controllers/maintenance-schedule.controller';
import { IncidentsController } from './controllers/incidents.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      UsageLog,
      MaintenanceRecord,
      MaintenanceSchedule,
      Incident,
      Equipment,
      User,
    ]),
    NotificationsModule,
  ],
  controllers: [
    UsageController,
    MaintenanceController,
    MaintenanceScheduleController,
    IncidentsController,
  ],
  providers: [
    UsageService,
    MaintenanceService,
    MaintenanceScheduleService,
    IncidentsService,
    AutoMaintenanceSchedulerService,
  ],
  exports: [
    UsageService,
    MaintenanceService,
    MaintenanceScheduleService,
    IncidentsService,
    AutoMaintenanceSchedulerService,
  ],
})
export class TrackingModule {}
