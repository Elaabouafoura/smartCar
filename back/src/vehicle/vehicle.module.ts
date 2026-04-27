import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { VehicleService } from './vehicle.service'
import { VehicleController } from './vehicle.controller'
import { VehicleReportService } from './vehicle-report.service'
import { Vehicle } from './entities/vehicle.entity'

import { SensorReadingModule } from '../sensor-reading/sensor-reading.module'
import { MaintenanceModule } from '../maintenance/maintenance.module'
import { DtcModule } from '../dtc/dtc.module'

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle]),
    SensorReadingModule,
    MaintenanceModule,
    DtcModule,
  ],
  controllers: [VehicleController],
  providers: [VehicleService, VehicleReportService],
  exports: [VehicleService, VehicleReportService, TypeOrmModule],
})
export class VehicleModule {}