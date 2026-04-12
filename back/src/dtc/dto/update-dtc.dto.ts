import { PartialType } from '@nestjs/mapped-types';
import { CreateDtcDto } from './create-dtc.dto';

export class UpdateDtcDto extends PartialType(CreateDtcDto) {}
