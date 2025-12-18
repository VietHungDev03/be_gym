import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, LessThan, MoreThan } from 'typeorm';
import { UsageLog } from '../tracking/entities/usage-log.entity';
import { MaintenanceRecord, MaintenanceStatus } from '../tracking/entities/maintenance-record.entity';
import { Equipment, EquipmentStatus } from '../equipment/entities/equipment.entity';
import { Incident } from '../tracking/entities/incident.entity';

export enum TimeFilter {
  WEEK = 'week',
  MONTH = 'month',
  QUARTER = 'quarter',
  YEAR = 'year',
  CUSTOM = 'custom',
}

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(UsageLog)
    private usageRepository: Repository<UsageLog>,
    @InjectRepository(MaintenanceRecord)
    private maintenanceRepository: Repository<MaintenanceRecord>,
    @InjectRepository(Equipment)
    private equipmentRepository: Repository<Equipment>,
    @InjectRepository(Incident)
    private incidentRepository: Repository<Incident>,
  ) {}

  /**
   * Helper: Đếm số lượng thiết bị theo trạng thái (gồm cả trạng thái thanh lý)
   */
  private aggregateEquipmentStatus(equipment: Equipment[]) {
    const byStatus = equipment.reduce<Record<string, number>>((acc, eq) => {
      const key = eq.status || EquipmentStatus.ACTIVE;
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    return {
      byStatus,
      active: byStatus[EquipmentStatus.ACTIVE] || 0,
      maintenance: byStatus[EquipmentStatus.MAINTENANCE] || 0,
      inactive: byStatus[EquipmentStatus.INACTIVE] || 0,
      disposed: byStatus[EquipmentStatus.DISPOSED] || 0,
      preparingLiquidation: byStatus[EquipmentStatus.PREPARING_LIQUIDATION] || 0,
      pendingLiquidation: byStatus[EquipmentStatus.PENDING_LIQUIDATION] || 0,
    };
  }

  /**
   * Helper: Tính toán khoảng thời gian dựa trên filter
   */
  private getDateRange(filter: TimeFilter, customStart?: Date, customEnd?: Date): { startDate: Date; endDate: Date } {
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;

    switch (filter) {
      case TimeFilter.WEEK:
        startDate = new Date(now);
        startDate.setDate(now.getDate() - 7);
        break;
      case TimeFilter.MONTH:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
        break;
      case TimeFilter.QUARTER:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 3);
        break;
      case TimeFilter.YEAR:
        startDate = new Date(now);
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case TimeFilter.CUSTOM:
        if (!customStart || !customEnd) {
          throw new Error('Custom filter requires start and end dates');
        }
        startDate = customStart;
        endDate = customEnd;
        break;
      default:
        startDate = new Date(now);
        startDate.setMonth(now.getMonth() - 1);
    }

    return { startDate, endDate };
  }

  async getUsageReport(startDate: Date, endDate: Date) {
    const logs = await this.usageRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const totalUsage = logs.length;
    const completedUsage = logs.filter(log => log.status === 'completed').length;
    const totalDuration = logs
      .filter(log => log.duration)
      .reduce((sum, log) => sum + log.duration, 0);

    // Group by equipment
    const byEquipment = logs.reduce((acc, log) => {
      if (!acc[log.equipmentId]) {
        acc[log.equipmentId] = {
          count: 0,
          totalDuration: 0,
        };
      }
      acc[log.equipmentId].count++;
      if (log.duration) {
        acc[log.equipmentId].totalDuration += log.duration;
      }
      return acc;
    }, {});

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      summary: {
        totalUsage,
        completedUsage,
        totalDuration,
        averageDuration: completedUsage > 0 ? totalDuration / completedUsage : 0,
      },
      byEquipment,
      logs,
    };
  }

  async getMaintenanceReport(startDate: Date, endDate: Date) {
    const records = await this.maintenanceRepository.find({
      where: {
        createdAt: Between(startDate, endDate),
      },
    });

    const total = records.length;
    const byStatus = records.reduce((acc, record) => {
      acc[record.status] = (acc[record.status] || 0) + 1;
      return acc;
    }, {});

    const byType = records.reduce((acc, record) => {
      acc[record.type] = (acc[record.type] || 0) + 1;
      return acc;
    }, {});

    const totalCost = records.reduce((sum, record) => sum + Number(record.cost), 0);

    return {
      period: {
        start: startDate,
        end: endDate,
      },
      summary: {
        total,
        byStatus,
        byType,
        totalCost,
      },
      records,
    };
  }

  async getEquipmentReport() {
    const equipment = await this.equipmentRepository.find();

    const statusStats = this.aggregateEquipmentStatus(equipment);

    const byType = equipment.reduce((acc, eq) => {
      acc[eq.type] = (acc[eq.type] || 0) + 1;
      return acc;
    }, {});

    return {
      total: equipment.length,
      byStatus: statusStats.byStatus,
      byType,
      equipment,
    };
  }

  /**
   * Thống kê tổng quan thiết bị với filter thời gian
   */
  async getEquipmentStatistics(filter: TimeFilter = TimeFilter.MONTH, startDate?: Date, endDate?: Date) {
    const dateRange = this.getDateRange(filter, startDate, endDate);

    // Lấy tất cả thiết bị
    const allEquipment = await this.equipmentRepository.find();

    // Thống kê theo trạng thái (bao gồm cả trạng thái thanh lý)
    const statusStats = this.aggregateEquipmentStatus(allEquipment);

    // Lấy số lượng sự cố trong khoảng thời gian
    const totalIncidents = await this.incidentRepository.count({
      where: {
        createdAt: Between(dateRange.startDate, dateRange.endDate),
      },
    });

    // Lấy tỉ lệ hoàn thành bảo trì
    const maintenanceStats = await this.getMaintenanceCompletionRate(dateRange.startDate, dateRange.endDate);

    // Số lần bảo trì trễ
    const lateMaintenanceCount = await this.getLateMaintenanceCount(dateRange.startDate, dateRange.endDate);

    return {
      period: {
        filter,
        start: dateRange.startDate,
        end: dateRange.endDate,
      },
      equipment: {
        total: allEquipment.length,
        active: statusStats.active,
        maintenance: statusStats.maintenance,
        inactive: statusStats.inactive,
        disposed: statusStats.disposed,
        preparingLiquidation: statusStats.preparingLiquidation,
        pendingLiquidation: statusStats.pendingLiquidation,
        byStatus: statusStats.byStatus,
      },
      maintenance: {
        completionRate: maintenanceStats.completionRate,
        total: maintenanceStats.total,
        completed: maintenanceStats.completed,
        lateCount: lateMaintenanceCount,
      },
      incidents: {
        total: totalIncidents,
      },
    };
  }

  /**
   * Tính tỉ lệ hoàn thành bảo trì
   */
  async getMaintenanceCompletionRate(startDate: Date, endDate: Date) {
    const maintenanceRecords = await this.maintenanceRepository.find({
      where: {
        scheduledDate: Between(startDate, endDate),
      },
    });

    const total = maintenanceRecords.length;
    const completed = maintenanceRecords.filter(
      record => record.status === 'completed'
    ).length;

    const completionRate = total > 0 ? (completed / total) * 100 : 0;

    return {
      total,
      completed,
      completionRate: parseFloat(completionRate.toFixed(2)),
    };
  }

  /**
   * Đếm số lần bảo trì trễ
   */
  async getLateMaintenanceCount(startDate: Date, endDate: Date) {
    const maintenanceRecords = await this.maintenanceRepository.find({
      where: {
        scheduledDate: Between(startDate, endDate),
        status: MaintenanceStatus.COMPLETED,
      },
    });

    // Bảo trì trễ = actual_date > scheduled_date
    const lateCount = maintenanceRecords.filter(
      record => record.actualDate && record.actualDate > record.scheduledDate
    ).length;

    return lateCount;
  }

  /**
   * Báo cáo chi tiết sự cố với filter
   */
  async getIncidentReport(filter: TimeFilter = TimeFilter.MONTH, startDate?: Date, endDate?: Date) {
    const dateRange = this.getDateRange(filter, startDate, endDate);

    const incidents = await this.incidentRepository.find({
      where: {
        createdAt: Between(dateRange.startDate, dateRange.endDate),
      },
      relations: ['equipment', 'reporter'],
    });

    const total = incidents.length;
    const byStatus = incidents.reduce((acc, inc) => {
      acc[inc.status] = (acc[inc.status] || 0) + 1;
      return acc;
    }, {});

    const bySeverity = incidents.reduce((acc, inc) => {
      acc[inc.severity] = (acc[inc.severity] || 0) + 1;
      return acc;
    }, {});

    const resolved = incidents.filter(inc => inc.status === 'resolved' || inc.status === 'closed').length;
    const resolutionRate = total > 0 ? (resolved / total) * 100 : 0;

    return {
      period: {
        filter,
        start: dateRange.startDate,
        end: dateRange.endDate,
      },
      summary: {
        total,
        resolved,
        resolutionRate: parseFloat(resolutionRate.toFixed(2)),
        byStatus,
        bySeverity,
      },
      incidents,
    };
  }
}
