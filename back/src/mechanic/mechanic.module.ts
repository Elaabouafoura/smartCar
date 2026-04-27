import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { MechanicService } from './mechanic.service';
import { MechanicController } from './mechanic.controller';
import { Mechanic } from './entities/mechanic.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Mechanic]), 
  ],
  controllers: [MechanicController],
  providers: [MechanicService],
  exports: [
    TypeOrmModule, 
  ],
})
export class MechanicModule {}