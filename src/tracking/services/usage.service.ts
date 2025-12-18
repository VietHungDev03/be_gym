import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { UsageLog, UsageStatus } from '../entities/usage-log.entity';
import { StartUsageDto } from '../dto/start-usage.dto';
import { EndUsageDto } from '../dto/end-usage.dto';

@Injectable()
export class UsageService {
  constructor(
    @InjectRepository(UsageLog)
    private usageRepository: Repository<UsageLog>,
  ) {}

  async startUsage(startUsageDto: StartUsageDto) {
    const usage = this.usageRepository.create({
      id: uuidv4(),
      equipmentId: startUsageDto.equipmentId,
      userId: startUsageDto.userId || null,
      startTime: new Date(),
      status: UsageStatus.IN_USE,
      notes: startUsageDto.notes || null,
    });

    return this.usageRepository.save(usage);
  }

  async endUsage(id: string, endUsageDto: EndUsageDto) {
    const usage = await this.usageRepository.findOne({
      where: { id },
    });

    if (!usage) {
      throw new NotFoundException('Không tìm thấy log sử dụng');
    }

    if (usage.status === UsageStatus.COMPLETED) {
      throw new BadRequestException('Log sử dụng đã kết thúc trước đó');
    }

    const endTime = new Date();
    const duration = Math.floor((endTime.getTime() - usage.startTime.getTime()) / 60000); // Phút

    await this.usageRepository.update(id, {
      endTime,
      duration,
      status: UsageStatus.COMPLETED,
      notes: endUsageDto.notes || usage.notes,
    });

    return this.usageRepository.findOne({ where: { id } });
  }

  async findByEquipment(equipmentId: string, limit: number = 50) {
    return this.usageRepository.find({
      where: { equipmentId },
      order: { createdAt: 'DESC' },
      take: limit,
    });
  }

  async getStats(equipmentId: string, startDate: Date, endDate: Date) {
    const logs = await this.usageRepository.find({
      where: {
        equipmentId,
        createdAt: Between(startDate, endDate),
      },
      order: { createdAt: 'DESC' },
    });

    const totalUsage = logs.length;
    const completedUsage = logs.filter(log => log.status === UsageStatus.COMPLETED).length;
    const totalDuration = logs
      .filter(log => log.duration)
      .reduce((sum, log) => sum + log.duration, 0);

    return {
      totalUsage,
      completedUsage,
      totalDuration,
      averageDuration: completedUsage > 0 ? totalDuration / completedUsage : 0,
      usageLogs: logs,
    };
  }
}
