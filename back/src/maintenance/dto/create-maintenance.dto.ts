import {
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';

export class CreateMaintenanceDto {
  @IsDateString()
  service_date!: string;

  @IsString()
  service_type!: string;

  @IsNumber()
  mileage_at_service_km!: number;

  @IsOptional()
  @IsNumber()
  cost?: number;

  @IsOptional()
  @IsString()
  parts_replaced?: string;

  @IsOptional()
  @IsString()
  shop?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsNumber()
  next_due_km?: number;

  @IsOptional()
  @IsDateString()
  next_due_date?: string;

  @IsOptional()
  @IsUUID()
  mechanicId?: string;

  @IsOptional()
  @IsDateString()
  appointmentStart?: string;

  @IsOptional()
  @IsDateString()
  appointmentEnd?: string;
}