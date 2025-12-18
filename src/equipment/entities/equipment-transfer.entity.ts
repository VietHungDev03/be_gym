import { Entity, Column, PrimaryColumn, CreateDateColumn } from 'typeorm';

@Entity('equipment_transfers')
export class EquipmentTransfer {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ name: 'equipment_id', length: 36 })
  equipmentId: string;

  @Column({ name: 'from_branch_id', length: 36, nullable: true })
  fromBranchId: string | null;

  @Column({ name: 'to_branch_id', length: 36 })
  toBranchId: string;

  @Column({ name: 'transfer_date', type: 'date' })
  transferDate: Date;

  @Column({ name: 'requested_by', length: 36 })
  requestedBy: string; // User ID

  @Column({ name: 'approved_by', length: 36, nullable: true })
  approvedBy: string | null; // User ID

  @Column({ type: 'text', nullable: true })
  reason: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({
    type: 'enum',
    enum: ['pending', 'approved', 'rejected', 'completed'],
    default: 'pending',
  })
  status: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}
