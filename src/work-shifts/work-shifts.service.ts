import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { WorkShift, ShiftStatus } from './entities/work-shift.entity';
import { CreateWorkShiftDto } from './dto/create-work-shift.dto';
import { UpdateWorkShiftDto } from './dto/update-work-shift.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class WorkShiftsService {
  constructor(
    @InjectRepository(WorkShift)
    private workShiftRepository: Repository<WorkShift>,
  ) {}

  /**
   * Tạo ca làm việc mới
   */
  async create(createWorkShiftDto: CreateWorkShiftDto): Promise<WorkShift> {
    const shift = this.workShiftRepository.create({
      id: uuidv4(),
      ...createWorkShiftDto,
      status: ShiftStatus.SCHEDULED,
    });
    return this.workShiftRepository.save(shift);
  }

  /**
   * Lấy tất cả ca làm việc
   */
  async findAll(): Promise<WorkShift[]> {
    return this.workShiftRepository.find({
      relations: ['technician'],
      order: { shiftDate: 'ASC', startTime: 'ASC' },
    });
  }

  /**
   * Lấy ca làm việc theo kỹ thuật viên
   */
  async findByTechnician(technicianId: string): Promise<WorkShift[]> {
    return this.workShiftRepository.find({
      where: { technicianId },
      relations: ['technician'],
      order: { shiftDate: 'ASC', startTime: 'ASC' },
    });
  }

  /**
   * Lấy ca làm việc theo ngày
   */
  async findByDate(date: Date): Promise<WorkShift[]> {
    return this.workShiftRepository.find({
      where: { shiftDate: date },
      relations: ['technician'],
      order: { startTime: 'ASC' },
    });
  }

  /**
   * Lấy ca làm việc theo khoảng thời gian
   */
  async findByDateRange(startDate: Date, endDate: Date): Promise<WorkShift[]> {
    return this.workShiftRepository.find({
      where: {
        shiftDate: Between(startDate, endDate),
      },
      relations: ['technician'],
      order: { shiftDate: 'ASC', startTime: 'ASC' },
    });
  }

  /**
   * Lấy ca làm việc đang active của kỹ thuật viên
   */
  async findActiveTechnicians(): Promise<WorkShift[]> {
    return this.workShiftRepository.find({
      where: { status: ShiftStatus.ACTIVE },
      relations: ['technician'],
    });
  }

  /**
   * Tìm ca làm việc theo ID
   */
  async findOne(id: string): Promise<WorkShift> {
    const shift = await this.workShiftRepository.findOne({
      where: { id },
      relations: ['technician'],
    });

    if (!shift) {
      throw new NotFoundException(`Work shift with ID ${id} not found`);
    }

    return shift;
  }

  /**
   * Cập nhật ca làm việc
   */
  async update(id: string, updateWorkShiftDto: UpdateWorkShiftDto): Promise<WorkShift> {
    const shift = await this.findOne(id);
    Object.assign(shift, updateWorkShiftDto);
    return this.workShiftRepository.save(shift);
  }

  /**
   * Xóa ca làm việc
   */
  async remove(id: string): Promise<void> {
    const shift = await this.findOne(id);
    await this.workShiftRepository.remove(shift);
  }

  /**
   * Lấy kỹ thuật viên đang làm việc (status = active) tại thời điểm hiện tại
   */
  async getAvailableTechnicians(): Promise<WorkShift[]> {
    const now = new Date();
    const today = now.toISOString().split('T')[0]; // YYYY-MM-DD
    const currentTime = now.toTimeString().split(' ')[0]; // HH:MM:SS

    return this.workShiftRepository
      .createQueryBuilder('shift')
      .leftJoinAndSelect('shift.technician', 'technician')
      .where('shift.shiftDate = :today', { today })
      .andWhere('shift.startTime <= :currentTime', { currentTime })
      .andWhere('shift.endTime >= :currentTime', { currentTime })
      .andWhere('shift.status = :status', { status: ShiftStatus.ACTIVE })
      .getMany();
  }
}
