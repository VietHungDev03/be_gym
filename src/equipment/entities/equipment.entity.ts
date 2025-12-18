import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum EquipmentStatus {
  ACTIVE = 'active',
  MAINTENANCE = 'maintenance',
  INACTIVE = 'inactive',
  PREPARING_LIQUIDATION = 'preparing_liquidation',
  PENDING_LIQUIDATION = 'pending_liquidation',
  DISPOSED = 'disposed',
}

@Entity('equipment')
export class Equipment {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ name: 'branch_id', length: 36, nullable: true })
  branchId: string | null;

  @Column({ length: 255 })
  name: string;

  @Column({ length: 100 })
  type: string;

  @Column({ type: 'text', nullable: true })
  description: string | null;

  @Column({ length: 255, nullable: true })
  location: string | null;

  @Column({ type: 'text', nullable: true })
  specifications: string | null;

  @Column({ name: 'qr_code', length: 100, unique: true, nullable: true })
  qrCode: string | null;

  @Column({ name: 'purchase_date', type: 'date', nullable: true })
  purchaseDate: Date | null;

  @Column({ name: 'warranty_expiry', type: 'date', nullable: true })
  warrantyExpiry: Date | null;

  @Column({ name: 'maintenance_interval', type: 'int', default: 30 })
  maintenanceInterval: number;

  @Column({ name: 'last_maintenance_date', type: 'date', nullable: true })
  lastMaintenanceDate: Date | null;

  @Column({
    type: 'enum',
    enum: EquipmentStatus,
    default: EquipmentStatus.ACTIVE,
  })
  status: EquipmentStatus;

  @Column({ name: 'disposal_date', type: 'date', nullable: true })
  disposalDate: Date | null;

  @Column({ name: 'disposal_reason', type: 'text', nullable: true })
  disposalReason: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
