import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
  CreateDateColumn,
} from 'typeorm';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
import { Upload } from 'src/upload/entities/upload.entity';

export enum DtcSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
}

export enum DtcStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  PERMANENT = 'permanent',
  CLEARED = 'cleared',
}

@Entity('dtc_entries')
@Index(['vehicle', 'timestamp'])
export class DtcEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.dtcEntries, {
    onDelete: 'CASCADE',
  })
  vehicle!: Vehicle;

  @Column({ type: 'timestamptz' })
  timestamp!: Date;

  @Column({ length: 10 })
  dtc_code!: string;

  @Column({ nullable: true })
  description!: string;

  @Column({
    type: 'enum',
    enum: DtcSeverity,
  })
  severity!: DtcSeverity;

  @Column()
  component_category!: string;

  @Column({
    type: 'enum',
    enum: DtcStatus,
  })
  status!: DtcStatus;

  @Column({ default: false })
  mil_active!: boolean;

  @Column({ type: 'jsonb', nullable: true })
  freeze_frame!: Record<string, any>;

  @CreateDateColumn()
  created_at!: Date;

  @ManyToOne(() => Upload, { nullable: true, onDelete: 'CASCADE' })
  upload?: Upload;
}