import {
  IsString,
  IsEnum,
  IsBoolean,
  IsOptional,
  IsDateString,
  Matches,
} from 'class-validator';
import { DtcSeverity, DtcStatus } from '../entities/dtc.entity';

export class CreateDtcDto {
  @IsString()
  @Matches(/^[PCBU][0-9]{4}$/)
  dtc_code!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(DtcSeverity)
  severity!: DtcSeverity;

  @IsString()
  component_category!: string;

  @IsEnum(DtcStatus)
  status!: DtcStatus;

  @IsBoolean()
  mil_active!: boolean;

  @IsOptional()
  freeze_frame?: Record<string, any>;

  @IsDateString()
  timestamp!: string;
}