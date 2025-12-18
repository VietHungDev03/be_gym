import { Entity, Column, PrimaryColumn, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Equipment } from '../../equipment/entities/equipment.entity';
import { User } from '../../users/entities/user.entity';

export enum UsageStatus {
  IN_USE = 'in_use',
  COMPLETED = 'completed',
}

@Entity('usage_logs')
export class UsageLog {
  @PrimaryColumn('varchar', { length: 36 })
  id: string;

  @Column({ name: 'equipment_id', length: 36 })
  equipmentId: string;

  @Column({ name: 'user_id', length: 36, nullable: true })
  userId: string | null;

  @Column({ name: 'start_time', type: 'timestamp' })
  startTime: Date;

  @Column({ name: 'end_time', type: 'timestamp', nullable: true })
  endTime: Date | null;

  @Column({ type: 'int', nullable: true })
  duration: number | null; // Thời lượng tính bằng phút

  @Column({
    type: 'enum',
    enum: UsageStatus,
    default: UsageStatus.IN_USE,
  })
  status: UsageStatus;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations (optional, có thể dùng cho query nâng cao)
  @ManyToOne(() => Equipment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'equipment_id' })
  equipment: Equipment;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'user_id' })
  user: User;
}
