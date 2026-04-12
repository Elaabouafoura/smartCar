import { Module } from '@nestjs/common';
import { VehicleService } from './vehicle.service';
import { VehicleController } from './vehicle.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Vehicle } from './entities/vehicle.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Vehicle]), // registers Vehicle repository
  ],
  controllers: [VehicleController],
  providers: [VehicleService],
  exports: [
    VehicleService, 
    TypeOrmModule, // ✅ export the repository so other modules can inject it
  ],
})
export class VehicleModule {}
