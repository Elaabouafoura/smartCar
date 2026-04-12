import { IsDateString, IsOptional, IsNumber } from 'class-validator';

export class CreateSensorReadingDto {
  @IsDateString()
  timestamp!: string;

  @IsOptional()
  @IsNumber()
  engine_rpm?: number;

  @IsOptional()
  @IsNumber()
  vehicle_speed_kmh?: number;

  @IsOptional()
  @IsNumber()
  coolant_temp_c?: number;

  @IsOptional()
  @IsNumber()
  intake_air_temp_c?: number;

  @IsOptional()
  @IsNumber()
  maf_airflow_gs?: number;

  @IsOptional()
  @IsNumber()
  throttle_position_pct?: number;

  @IsOptional()
  @IsNumber()
  engine_load_pct?: number;

  @IsOptional()
  @IsNumber()
  short_fuel_trim_pct?: number;

  @IsOptional()
  @IsNumber()
  long_fuel_trim_pct?: number;

  @IsOptional()
  @IsNumber()
  ambient_temp_c?: number;

  @IsOptional()
  @IsNumber()
  barometric_pressure_kpa?: number;

  @IsOptional()
  @IsNumber()
  fuel_level_pct?: number;

  @IsOptional()
  @IsNumber()
  control_module_voltage_v?: number;
}