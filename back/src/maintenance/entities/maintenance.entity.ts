import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
} from 'typeorm';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';
import { Upload } from 'src/upload/entities/upload.entity';

@Entity()
export class MaintenanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.maintenanceRecords, {
    onDelete: 'CASCADE',
  })
  vehicle!: Vehicle;

  @ManyToOne(() => Upload, { nullable: true })
  upload!: Upload;

  @Column({ type: 'date' })
  service_date!: Date;

  @Column()
  service_type!: string;

  @Column()
  mileage_at_service_km!: number;

  @Column({ type: 'decimal', nullable: true })
  cost!: number;

  @Column({ nullable: true })
  parts_replaced!: string;

  @Column({ nullable: true })
  shop!: string;

  @Column({ nullable: true })
  notes!: string;

  @Column({ nullable: true })
  next_due_km!: number;

  @Column({ type: 'date' })
  next_due_date!: Date;

  
}