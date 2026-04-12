import { IsString, IsNumber, IsOptional } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  make!: string;

  @IsString()
  model!: string;

  @IsNumber()
  year!: number;

  @IsOptional()
  @IsString()
  vin?: string;

  @IsOptional()
  @IsString()
  plateNumber?: string;

  @IsNumber()
  currentMileageKm!: number;

  @IsOptional()
  @IsString()
  photoUrl?: string;
}
