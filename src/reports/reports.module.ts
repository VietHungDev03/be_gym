import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsService } from './reports.service';
import { ReportsController } from './reports.controller';
import { UsageLog } from '../tracking/entities/usage-log.entity';
import { MaintenanceRecord } from '../tracking/entities/maintenance-record.entity';
import { Equipment } from '../equipment/entities/equipment.entity';
import { Incident } from '../tracking/entities/incident.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([UsageLog, MaintenanceRecord, Equipment, Incident]),
  ],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
