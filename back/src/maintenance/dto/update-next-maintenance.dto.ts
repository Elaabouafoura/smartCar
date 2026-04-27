import { IsDateString, IsNumber, IsOptional } from 'class-validator';

export class UpdateNextMaintenanceDto {
  @IsOptional()
  @IsNumber()
  next_due_km?: number;

  @IsOptional()
  @IsDateString()
  next_due_date?: string;
}