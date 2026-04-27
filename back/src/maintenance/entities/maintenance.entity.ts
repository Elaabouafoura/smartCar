import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';
import { Upload } from 'src/upload/entities/upload.entity';
import { Mechanic } from 'src/mechanic/entities/mechanic.entity';

@Entity('maintenance_record')
export class MaintenanceRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.maintenanceRecords, {
    onDelete: 'CASCADE',
  })
  vehicle!: Vehicle;

  @ManyToOne(() => Upload, { nullable: true, onDelete: 'SET NULL' })
  upload?: Upload;

  @ManyToOne(() => Mechanic, { nullable: true })
  mechanic?: Mechanic;

  @Column({ name: 'mechanic_id', nullable: true })
  mechanicId?: string;

  @Column({ type: 'date' })
  service_date!: Date;

  @Column()
  service_type!: string;

  @Column()
  mileage_at_service_km!: number;

  @Column({ type: 'decimal', nullable: true })
  cost?: number;

  @Column({ nullable: true })
  parts_replaced?: string;

  @Column({ nullable: true })
  shop?: string;

  @Column({ nullable: true })
  notes?: string;

  @Column({ nullable: true })
  next_due_km?: number;

  @Column({ type: 'date', nullable: true })
  next_due_date?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  appointmentStart?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  appointmentEnd?: Date;
}