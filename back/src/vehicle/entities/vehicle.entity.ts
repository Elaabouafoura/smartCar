import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { SensorReading } from 'src/sensor-reading/entities/sensor-reading.entity';
import { Upload } from 'src/upload/entities/upload.entity';
import { MaintenanceRecord } from '../../maintenance/entities/maintenance.entity';
@Entity('vehicle')
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  owner!: User;

  @Column({ length: 50 })
  make!: string;

  @Column({ length: 50 })
  model!: string;

  @Column()
  year!: number;

  @Column({ length: 17, nullable: true, unique: true })
  vin?: string;

  @Column({ name: 'plate_number', length: 20, nullable: true })
  plateNumber?: string;

  @Column({ name: 'current_mileage_km' })
  currentMileageKm!: number;

  @Column({ name: 'photo_url', nullable: true })
  photoUrl?: string;

  @Column({ name: 'health_score', type: 'decimal', precision: 5, scale: 2, nullable: true })
  healthScore?: number;

  
  @Column({ name: 'is_deleted', default: false })
  isDeleted!: boolean;

  @Column({ name: 'deleted_at', type: 'timestamptz', nullable: true })
  deletedAt?: Date;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
  
   @OneToMany(() => SensorReading, (reading) => reading.vehicle)
    sensorReadings!: SensorReading[];
    dtcEntries: any;
    @OneToMany(() => MaintenanceRecord, (maintenance) => maintenance.vehicle)
maintenanceRecords!: MaintenanceRecord[];

    @OneToMany(() => Upload, (upload) => upload.vehicle)
    uploads!: Upload[];
}
