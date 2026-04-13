import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Upload } from './entities/upload.entity';
import { UploadService } from './upload.service';
import { UploadController } from './upload.controller';
import { SensorReading } from 'src/sensor-reading/entities/sensor-reading.entity';
import { DtcEntry } from 'src/dtc/entities/dtc.entity';
import { MaintenanceRecord } from 'src/maintenance/entities/maintenance.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Upload,SensorReading,DtcEntry,MaintenanceRecord])],
  controllers: [UploadController],
  providers: [UploadService],
  exports: [UploadService],
})
export class UploadModule {}