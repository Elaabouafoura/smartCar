import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { MaintenanceRecord } from './entities/maintenance.entity';

import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
import { Upload } from 'src/upload/entities/upload.entity';
import { Mechanic } from 'src/mechanic/entities/mechanic.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      MaintenanceRecord,
      Vehicle,
      Upload,
      Mechanic,
    ]),
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}