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
import { AiModule } from './ai/ai.module';
import { ScanModule } from './scan/scan.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // Railway dùng biến môi trường, file .env có cũng được không có cũng không sao
      envFilePath: '.env',
    }),

    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      useFactory: () => {
        const hasUrl = !!process.env.DATABASE_URL;
        const common = {
          type: 'mysql' as const,
          entities: [__dirname + '/**/*.entity{.ts,.js}'],
          synchronize: true,
          charset: 'utf8mb4',
        };

        if (hasUrl) {
          return {
            ...common,
            url: process.env.DATABASE_URL,
          };
        }

        return {
          ...common,
          host: process.env.DB_HOST || 'localhost',
          port: Number(process.env.DB_PORT) || 3306,
          username: process.env.DB_USERNAME || 'root',
          password: process.env.DB_PASSWORD || '',
          database: process.env.DB_DATABASE || 'igymcare',
        };
      },
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
    AiModule,
    ScanModule,
  ],
})
export class AppModule {}
