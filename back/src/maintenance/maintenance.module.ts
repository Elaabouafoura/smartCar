import { Module } from '@nestjs/common';
import { MaintenanceService } from './maintenance.service';
import { MaintenanceController } from './maintenance.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MaintenanceRecord } from './entities/maintenance.entity';
import { Vehicle } from 'src/vehicle/entities/vehicle.entity';
import { Upload } from 'src/upload/entities/upload.entity';
@Module({
  imports: [
    TypeOrmModule.forFeature([
      MaintenanceRecord,
      Vehicle,
      Upload,
    ]),
  ],
  controllers: [MaintenanceController],
  providers: [MaintenanceService],
})
export class MaintenanceModule {}