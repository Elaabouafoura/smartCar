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
  isRead?: boolean
}