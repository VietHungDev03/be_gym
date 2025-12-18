import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Equipment } from '../../equipment/entities/equipment.entity';
import { User } from '../../users/entities/user.entity';
import { MaintenanceType, MaintenancePriority } from './maintenance-record.entity';

/**
 * Entity: MaintenanceSchedule
 * Lưu trữ lịch bảo trì định kỳ tự động
 *
 * Hỗ trợ 3 phạm vi áp dụng:
 * 1. Thiết bị cụ thể: equipmentId có giá trị
 * 2. Nhóm thiết bị: equipmentType có giá trị
 * 3. Toàn chi nhánh: branchId có giá trị
 */
@Entity('maintenance_schedules')
export class MaintenanceSchedule {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ length: 255 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  // ========================================
  // PHẠM VI ÁP DỤNG
  // ========================================
  @Column({ name: 'equipment_id', length: 36, nullable: true })
  equipmentId: string | null;

  @Column({ name: 'equipment_type', length: 100, nullable: true })
  equipmentType: string | null;

  @Column({ name: 'branch_id', length: 36, nullable: true })
  branchId: string | null;

  // ========================================
  // THÔNG TIN BẢO TRÌ
  // ========================================
  @Column({
    name: 'maintenance_type',
    type: 'enum',
    enum: MaintenanceType,
    default: MaintenanceType.PREVENTIVE,
  })
  maintenanceType: MaintenanceType;

  @Column({
    type: 'enum',
    enum: MaintenancePriority,
    default: MaintenancePriority.MEDIUM,
  })
  priority: MaintenancePriority;

  @Column({ name: 'assigned_to', length: 36, nullable: true })
  assignedTo: string | null;

  // ========================================
  // LỊCH TRÌNH
  // ========================================
  @Column({ name: 'start_date', type: 'date' })
  startDate: Date;

  @Column({ name: 'recurrence_interval', type: 'int' })
  recurrenceInterval: number; // Số ngày

  @Column({ name: 'next_scheduled_date', type: 'date' })
  nextScheduledDate: Date;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate: Date | null;

  // ========================================
  // TRẠNG THÁI
  // ========================================
  @Column({ name: 'is_active', type: 'boolean', default: true })
  isActive: boolean;

  // ========================================
  // METADATA
  // ========================================
  @Column({ name: 'created_by', length: 36, nullable: true })
  createdBy: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // ========================================
  // RELATIONS
  // ========================================
  @ManyToOne(() => Equipment, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'equipment_id' })
  equipment: Equipment;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignedUser: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator: User;
}
