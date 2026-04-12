import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
} from 'typeorm';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
import { SensorReading } from 'src/sensor-reading/entities/sensor-reading.entity';

export enum UploadStatus {
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAILED = 'failed',
}
@Entity('uploads')
export class Upload {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Vehicle, { nullable: false, onDelete: 'CASCADE' })
  vehicle!: Vehicle;

  @Column({ type: 'varchar', length: 255 })
  filename!: string;

  @Column({ type: 'enum', enum: UploadStatus, default: UploadStatus.PROCESSING })
  status!: UploadStatus;

  @Column({ type: 'integer', nullable: true })
  row_count!: number;

  @Column({ type: 'jsonb', nullable: true })
  errors!: {
    message: string;
    stack?: string;
  };

  @Column({ type: 'varchar', nullable: true }) 
  filePath!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @OneToMany(() => SensorReading, (reading: SensorReading) => reading.upload)
  sensorReadings!: SensorReading[];
}