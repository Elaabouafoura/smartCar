import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SensorReadingService } from './sensor-reading.service';
import { SensorReading } from './entities/sensor-reading.entity';
import { Upload } from 'src/upload/entities/upload.entity';
import { VehicleModule } from '../vehicle/vehicle.module';
import { SensorReadingController } from './sensor-reading.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([SensorReading, Upload]),
    VehicleModule,
  ],
  controllers: [SensorReadingController], // ✅ AJOUTER CECI
  providers: [SensorReadingService],
})
export class SensorReadingModule {}