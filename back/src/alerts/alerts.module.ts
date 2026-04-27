import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AlertsController } from './alerts.controller'
import { AlertsService } from './alerts.service'
import { AlertsGateway } from './alerts.gateway'
import { AlertsRuleService } from './alerts-rule.service'
import { Vehicle } from 'src/vehicle/entities/vehicle.entity'
import { DtcEntry } from 'src/dtc/entities/dtc.entity'
import { MaintenanceRecord } from 'src/maintenance/entities/maintenance.entity'

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle, DtcEntry, MaintenanceRecord])],
  controllers: [AlertsController],
  providers: [AlertsService, AlertsGateway, AlertsRuleService],
  exports: [AlertsService, AlertsGateway, AlertsRuleService],
})
export class AlertsModule {}