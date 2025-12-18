import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Equipment } from '../../equipment/entities/equipment.entity';
import { User } from '../../users/entities/user.entity';

export enum MaintenanceType {
  PREVENTIVE = 'preventive',
  CORRECTIVE = 'corrective',
  EMERGENCY = 'emergency',
}

export enum MaintenancePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum MaintenanceStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

@Entity('maintenance_records')
export class MaintenanceRecord {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ name: 'equipment_id', length: 36 })
  equipmentId: string;

  @Column({
    type: 'enum',
    enum: MaintenanceType,
  })
  type: MaintenanceType;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: MaintenancePriority,
    default: MaintenancePriority.MEDIUM,
  })
  priority: MaintenancePriority;

  @Column({ name: 'scheduled_date', type: 'timestamp' })
  scheduledDate: Date;

  @Column({
    type: 'enum',
    enum: MaintenanceStatus,
    default: MaintenanceStatus.SCHEDULED,
  })
  status: MaintenanceStatus;

  @Column({ name: 'assigned_to', length: 36, nullable: true })
  assignedTo: string | null;

  @Column({ name: 'actual_date', type: 'timestamp', nullable: true })
  actualDate: Date | null;

  @Column({ name: 'completed_by', length: 36, nullable: true })
  completedBy: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  cost: number;

  // Phản hồi bảo trì từ kỹ thuật viên
  @Column({ name: 'work_performed', type: 'text', nullable: true })
  workPerformed: string | null;

  @Column({ name: 'issues_found', type: 'text', nullable: true })
  issuesFound: string | null;

  @Column({ name: 'parts_replaced', type: 'json', nullable: true })
  partsReplaced: Array<{ name: string; quantity: number; cost: number }> | null;

  @Column({ name: 'has_remaining_issues', type: 'boolean', default: false })
  hasRemainingIssues: boolean;

  @Column({ name: 'technician_notes', type: 'text', nullable: true })
  technicianNotes: string | null;

  @Column({ name: 'feedback_submitted_at', type: 'timestamp', nullable: true })
  feedbackSubmittedAt: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Equipment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'equipment_id' })
  equipment: Equipment;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'assigned_to' })
  assignedUser: User;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'completed_by' })
  completedByUser: User;
}
