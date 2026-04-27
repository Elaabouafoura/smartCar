import { Injectable, ForbiddenException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Vehicle } from 'src/vehicle/entities/vehicle.entity'
import { DtcEntry, DtcSeverity, DtcStatus } from 'src/dtc/entities/dtc.entity'
import { MaintenanceRecord } from 'src/maintenance/entities/maintenance.entity'

export enum NotificationType {
  DTC = 'dtc',
  MAINTENANCE = 'maintenance',
}

export enum NotificationLevel {
  CRITICAL = 'critical',
  WARNING = 'warning',
  INFO = 'info',
}

export type VehicleNotification = {
  id: string
  type: NotificationType
  level: NotificationLevel
  title: string
  message: string
  vehicleId: string
  vehicleLabel?: string
  createdAt: string
  metadata?: Record<string, any>
}

@Injectable()
export class AlertsService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,

    @InjectRepository(DtcEntry)
    private readonly dtcRepo: Repository<DtcEntry>,

    @InjectRepository(MaintenanceRecord)
    private readonly maintenanceRepo: Repository<MaintenanceRecord>,
  ) {}

  private async checkVehicleOwnership(vehicleId: string, userId: string) {
    const vehicle = await this.vehicleRepo.findOne({
      where: { id: vehicleId, userId },
    })

    if (!vehicle) {
      throw new ForbiddenException('Vehicle not found')
    }

    return vehicle
  }

  private getVehicleLabel(vehicle: Vehicle): string {
    const parts = [vehicle.make, vehicle.model].filter(Boolean)
    return parts.length > 0 ? parts.join(' ') : `Véhicule ${vehicle.id}`
  }

  private buildDtcNotification(
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

    if (entry.mil_active) {
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

  private buildMaintenanceNotification(
    record: MaintenanceRecord,
    vehicle: Vehicle,
  ): VehicleNotification | null {
    if (!record.next_due_date) {
      return null
    }

    const now = new Date()
    const nextDue = new Date(record.next_due_date)
    const diffMs = nextDue.getTime() - now.getTime()
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

    let level: NotificationLevel | null = null
    let title = ''

    if (diffDays < 0) {
      level = NotificationLevel.CRITICAL
      title = 'Maintenance en retard'
    } else if (diffDays <= 7) {
      level = NotificationLevel.CRITICAL
      title = 'Maintenance imminente'
    } else if (diffDays <= 30) {
      level = NotificationLevel.WARNING
      title = 'Maintenance à venir'
    }

    if (!level) {
      return null
    }

    return {
      id: `maintenance-${record.id}`,
      type: NotificationType.MAINTENANCE,
      level,
      title,
      message:
        diffDays < 0
          ? `${record.service_type} en retard depuis le ${nextDue.toISOString().split('T')[0]}`
          : `${record.service_type} prévue dans ${diffDays} jour(s)`,
      vehicleId: vehicle.id,
      vehicleLabel: this.getVehicleLabel(vehicle),
      createdAt: nextDue.toISOString(),
      metadata: {
        maintenanceId: record.id,
        serviceType: record.service_type,
        nextDueDate: record.next_due_date,
        nextDueKm: record.next_due_km,
        diffDays,
      },
    }
  }

  async getVehicleNotifications(
    vehicleId: string,
    userId: string,
  ): Promise<VehicleNotification[]> {
    const vehicle = await this.checkVehicleOwnership(vehicleId, userId)

    const [dtcEntries, maintenanceRecords] = await Promise.all([
      this.dtcRepo.find({
        where: { vehicle: { id: vehicleId } },
        order: { timestamp: 'DESC' },
        take: 20,
      }),
      this.maintenanceRepo.find({
        where: { vehicle: { id: vehicleId } },
        order: { next_due_date: 'ASC' },
      }),
    ])

    const dtcNotifications = dtcEntries
      .map((entry) => this.buildDtcNotification(entry, vehicle))
      .filter(Boolean) as VehicleNotification[]

    const nextMaintenanceRecord =
      maintenanceRecords.find((record) => !!record.next_due_date) || null

    const maintenanceNotifications = nextMaintenanceRecord
      ? [this.buildMaintenanceNotification(nextMaintenanceRecord, vehicle)].filter(
          (notification): notification is VehicleNotification =>
            notification !== null,
        )
      : []

    return [...dtcNotifications, ...maintenanceNotifications].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }

  async getMyNotifications(userId: string): Promise<VehicleNotification[]> {
    const vehicles = await this.vehicleRepo.find({
      where: { userId },
    })

    const all = await Promise.all(
      vehicles.map((vehicle) =>
        this.getVehicleNotifications(vehicle.id, userId),
      ),
    )

    return all
      .flat()
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
  }
}