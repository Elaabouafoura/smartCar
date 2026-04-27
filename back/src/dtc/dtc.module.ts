import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DtcService } from './dtc.service';
import { DtcController } from './dtc.controller';
import { DtcEntry } from './entities/dtc.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { Upload } from 'src/upload/entities/upload.entity';
import { AlertsModule } from 'src/alerts/alerts.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DtcEntry,
      Vehicle,
      Upload,
      
    ]),
    AlertsModule,
  ],
  controllers: [DtcController],
  providers: [DtcService],
  exports: [DtcService],
})
export class DtcModule {}

export { DtcService };
