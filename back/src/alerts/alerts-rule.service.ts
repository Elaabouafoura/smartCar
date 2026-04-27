import { Injectable } from '@nestjs/common'
import { DtcEntry, DtcSeverity, DtcStatus } from 'src/dtc/entities/dtc.entity'
import { Vehicle } from 'src/vehicle/entities/vehicle.entity'
import {
  NotificationLevel,
  NotificationType,
  VehicleNotification,
} from './types/vehicle-notification.type'

@Injectable()
export class AlertsRuleService {
  private getVehicleLabel(vehicle: Vehicle): string {
    const parts = [vehicle.make, vehicle.model].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : `Véhicule ${vehicle.id}`
  }

  buildDtcNotification(
    entry: DtcEntry,
    vehicle: Vehicle,
  ): VehicleNotification | null {
    if (entry.status === DtcStatus.CLEARED) {
      return null
    }

    let level: NotificationLevel | null = null
    const reasons: string[] = []

    if (entry.severity === DtcSeverity.HIGH) {
      level = NotificationLevel.CRITICAL
      reasons.push('severity high')
    }

    if (entry.mil_active === true) {
      level = NotificationLevel.CRITICAL
      reasons.push('MIL active')
    }

    if (entry.status === DtcStatus.PERMANENT) {
      level = NotificationLevel.CRITICAL
      reasons.push('status permanent')
    }

    if (!level && entry.severity === DtcSeverity.MEDIUM) {
      level = NotificationLevel.WARNING
      reasons.push('severity medium')
    }

    if (!level) {
      return null
    }

    return {
      id: `dtc-${entry.id}`,
      type: NotificationType.DTC,
      level,
      title:
        level === NotificationLevel.CRITICAL
          ? `Alerte critique DTC (${entry.dtc_code})`
          : `Alerte DTC (${entry.dtc_code})`,
      message: [
        entry.description || 'Défaut détecté',
        reasons.length ? `(${reasons.join(', ')})` : '',
      ]
        .filter(Boolean)
        .join(' '),
      vehicleId: vehicle.id,
      vehicleLabel: this.getVehicleLabel(vehicle),
      createdAt: new Date(entry.timestamp).toISOString(),
      metadata: {
        dtcId: entry.id,
        dtcCode: entry.dtc_code,
        severity: entry.severity,
        status: entry.status,
        milActive: entry.mil_active,
        componentCategory: entry.component_category,
      },
    }
  }
}