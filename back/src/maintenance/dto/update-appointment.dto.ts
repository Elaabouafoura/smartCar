

import { IsDateString, IsUUID } from 'class-validator';

export class UpdateAppointmentDto {
  @IsUUID()
  mechanicId!: string;

  @IsDateString()
  appointmentStart!: string;

  @IsDateString()
  appointmentEnd!: string;
}