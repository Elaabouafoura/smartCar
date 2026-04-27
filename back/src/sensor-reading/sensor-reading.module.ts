import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { SensorReadingService } from './sensor-reading.service'
import { SensorReading } from './entities/sensor-reading.entity'
import { Upload } from 'src/upload/entities/upload.entity'
import { Vehicle } from '../vehicle/entities/vehicle.entity'
import { SensorReadingController } from './sensor-reading.controller'

@Module({
  imports: [
    TypeOrmModule.forFeature([SensorReading, Vehicle, Upload]),
  ],
  controllers: [SensorReadingController],
  providers: [SensorReadingService],
  exports: [SensorReadingService],
})
export class SensorReadingModule {}