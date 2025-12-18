import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Equipment } from '../../equipment/entities/equipment.entity';
import { MaintenanceRecord } from '../../tracking/entities/maintenance-record.entity';
import { User } from '../../users/entities/user.entity';

export enum AlertType {
  MAINTENANCE_DUE = 'maintenance_due',
  MAINTENANCE_OVERDUE = 'maintenance_overdue',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
  DISMISSED = 'dismissed',
}

@Entity('alerts')
export class Alert {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({
    type: 'enum',
    enum: AlertType,
  })
  type: AlertType;

  @Column({
    type: 'enum',
    enum: AlertSeverity,
    default: AlertSeverity.MEDIUM,
  })
  severity: AlertSeverity;

  @Column({
    type: 'enum',
    enum: AlertStatus,
    default: AlertStatus.ACTIVE,
  })
  status: AlertStatus;

  @Column({ name: 'equipment_id', length: 36 })
  equipmentId: string;

  @Column({ name: 'branch_id', length: 36, nullable: true })
  branchId: string | null;

  @Column({ name: 'maintenance_id', length: 36, nullable: true })
  maintenanceId: string | null;

  @Column({ name: 'sensor_id', length: 36, nullable: true })
  sensorId: string | null;

  @Column({ length: 255 })
  title: string;

  @Column('text')
  message: string;

  @Column({
    name: 'sensor_value',
    type: 'decimal',
    precision: 10,
    scale: 2,
    nullable: true,
  })
  sensorValue: number | null;

  @Column({ name: 'threshold_violated', length: 50, nullable: true })
  thresholdViolated: string | null;

  @Column({ name: 'notification_sent', type: 'boolean', default: false })
  notificationSent: boolean;

  @Column({ name: 'notification_channels', type: 'json', nullable: true })
  notificationChannels: string[] | null;

  @Column({ name: 'assigned_to', length: 36, nullable: true })
  assignedTo: string | null;

  @Column({ name: 'acknowledged_by', length: 36, nullable: true })
  acknowledgedBy: string | null;

  @Column({ name: 'acknowledged_at', type: 'timestamp', nullable: true })
  acknowledgedAt: Date | null;

  @Column({ name: 'resolved_by', length: 36, nullable: true })
  resolvedBy: string | null;

  @Column({ name: 'resolved_at', type: 'timestamp', nullable: true })
  resolvedAt: Date | null;

  @Column({ name: 'resolution_notes', type: 'text', nullable: true })
  resolutionNotes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @ManyToOne(() => Equipment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'equipment_id' })
  equipment: Equipment;

  @ManyToOne(() => MaintenanceRecord, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'maintenance_id' })
  maintenance: MaintenanceRecord | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'assigned_to' })
  assignedToUser: User | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'acknowledged_by' })
  acknowledgedByUser: User | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'resolved_by' })
  resolvedByUser: User | null;
}
