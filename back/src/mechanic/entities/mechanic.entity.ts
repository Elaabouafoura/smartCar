import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { MaintenanceRecord } from '../../maintenance/entities/maintenance.entity';

@Entity('mechanic')
export class Mechanic {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ length: 100, nullable: true })
  specialty?: string;

  @Column({ length: 20, nullable: true })
  phone?: string;
  @Column({ length: 100, nullable: true })
  location?: string;

  

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => MaintenanceRecord, (maintenance) => maintenance.mechanic)
  maintenanceRecords!: MaintenanceRecord[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}