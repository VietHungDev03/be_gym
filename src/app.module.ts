import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ScheduleModule } from '@nestjs/schedule';
import { CommonModule } from './common/common.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { EquipmentModule } from './equipment/equipment.module';
import { TrackingModule } from './tracking/tracking.module';
import { ReportsModule } from './reports/reports.module';
import { AlertsModule } from './alerts/alerts.module';
import { WorkShiftsModule } from './work-shifts/work-shifts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { BranchesModule } from './branches/branches.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT) || 3306,
      username: process.env.DB_USERNAME || 'igymcare',
      password: process.env.DB_PASSWORD || 'igymcare',
      database: process.env.DB_DATABASE || 'igymcare',
      entities: [__dirname + '/**/*.entity{.ts,.js}'],
      synchronize: true, // Auto sync schema trong dev (TẮT khi production!)
      logging: false,
      charset: 'utf8mb4',
    }),
    CommonModule,
    AuthModule,
    UsersModule,
    BranchesModule,
    EquipmentModule,
    TrackingModule,
    ReportsModule,
    AlertsModule,
    WorkShiftsModule,
    NotificationsModule,
  ],
})
export class AppModule {}
