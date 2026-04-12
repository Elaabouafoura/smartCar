import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Index,
} from 'typeorm';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
import { Upload } from 'src/upload/entities/upload.entity';
@Entity('sensor_readings')
@Index(['vehicle', 'timestamp'])
export class SensorReading {
  @PrimaryGeneratedColumn('increment')
  id!: number;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.sensorReadings, {
    onDelete: 'CASCADE',
  })
  vehicle!: Vehicle;

  @Column({ type: 'timestamptz' })
  timestamp!: Date;

  @Column({ type: 'float', nullable: true })
  engine_rpm!: number;

  @Column({ type: 'float', nullable: true })
  vehicle_speed_kmh!: number;

  @Column({ type: 'float', nullable: true })
  coolant_temp_c!: number;

  @Column({ type: 'float', nullable: true })
  intake_air_temp_c!: number;

  @Column({ type: 'float', nullable: true })
  maf_airflow_gs!: number;

  @Column({ type: 'float', nullable: true })
  throttle_position_pct!: number;

  @Column({ type: 'float', nullable: true })
  fuel_level_pct!: number;

  @Column({ type: 'float', nullable: true })
  engine_load_pct!: number;

  @Column({ type: 'float', nullable: true })
  short_fuel_trim_pct!: number;

  @Column({ type: 'float', nullable: true })
  long_fuel_trim_pct!: number;

  @Column({ type: 'float', nullable: true })
  ambient_temp_c!: number;

  @Column({ type: 'float', nullable: true })
  barometric_pressure_kpa!: number;

  @Column({ type: 'float', nullable: true })
  control_module_voltage_v!: number;

 @ManyToOne(() => Upload, (upload) => upload.sensorReadings, {
  nullable: true,
  onDelete: 'SET NULL',
})
upload!: Upload;


}
