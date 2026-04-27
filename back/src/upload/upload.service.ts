import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Upload } from './entities/upload.entity';
import { SensorReading } from 'src/sensor-reading/entities/sensor-reading.entity';
import { MaintenanceRecord } from 'src/maintenance/entities/maintenance.entity';
import { DtcEntry } from 'src/dtc/entities/dtc.entity';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(Upload)
    private uploadRepo: Repository<Upload>,

    @InjectRepository(SensorReading)
    private sensorRepo: Repository<SensorReading>,

    @InjectRepository(MaintenanceRecord)
    private maintenanceRepo: Repository<MaintenanceRecord>,

    @InjectRepository(DtcEntry)
    private dtcRepo: Repository<DtcEntry>,
  ) {}

  async findAll(page: number = 1, limit: number = 10) {
    const [data, total] = await this.uploadRepo.findAndCount({
      relations: ['vehicle'],
      order: { created_at: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const upload = await this.uploadRepo.findOne({
      where: { id },
      relations: ['vehicle', 'sensorReadings'],
    });

    if (!upload) {
      throw new NotFoundException('Upload not found');
    }

    return upload;
  }

  async getDownloadFile(id: string): Promise<{ csvContent: string; filename: string }> {
    const upload = await this.uploadRepo.findOne({
      where: { id },
      relations: ['vehicle'],
    });

    if (!upload) {
      throw new NotFoundException('Upload not found');
    }

    const vehicleId    = upload.vehicle?.id    ?? 'unknown';
    const vehicleMake  = upload.vehicle?.make  ?? 'unknown';
    const vehicleModel = upload.vehicle?.model ?? 'unknown';
    const vehicleYear  = upload.vehicle?.year  ?? 'unknown';

    const sensorReadings = await this.sensorRepo.find({
      where: { upload: { id } },
      order: { timestamp: 'ASC' },
    });

    if (sensorReadings.length > 0) {
      return this.buildSensorCsv(
        sensorReadings,
        vehicleId,
        vehicleMake,
        vehicleModel,
        vehicleYear,
        id,
      );
    }

    const maintenanceRecords = await this.maintenanceRepo.find({
      where: { upload: { id } },
      order: { service_date: 'ASC' },
    });

    if (maintenanceRecords.length > 0) {
      return this.buildMaintenanceCsv(
        maintenanceRecords,
        vehicleId,
        vehicleMake,
        vehicleModel,
        vehicleYear,
        id,
      );
    }

    const dtcEntries = await this.dtcRepo.find({
      where: { upload: { id } },
      order: { timestamp: 'ASC' },
    });

    if (dtcEntries.length > 0) {
      return this.buildDtcCsv(
        dtcEntries,
        vehicleId,
        vehicleMake,
        vehicleModel,
        vehicleYear,
        id,
      );
    }

    throw new NotFoundException('No data found for this upload');
  }

  async remove(id: string) {
    const upload = await this.findOne(id);
    return this.uploadRepo.remove(upload);
  }

 
  private buildSensorCsv(
    readings: SensorReading[],
    vehicleId: string,
    vehicleMake: string,
    vehicleModel: string,
    vehicleYear: number | string,
    uploadId: string,
  ): { csvContent: string; filename: string } {
    const headers = [
      'vehicleId',
      'vehicleMake',
      'vehicleModel',
      'vehicleYear',
      'timestamp',
      'engine_rpm',
      'vehicle_speed_kmh',
      'coolant_temp_c',
      'intake_air_temp_c',
      'maf_airflow_gs',
      'throttle_position_pct',
      'fuel_level_pct',
      'engine_load_pct',
      'short_fuel_trim_pct',
      'long_fuel_trim_pct',
      'ambient_temp_c',
      'barometric_pressure_kpa',
      'control_module_voltage_v',
    ];

    const rows = readings.map((r) =>
      [
        vehicleId,
        vehicleMake,
        vehicleModel,
        vehicleYear,
        r.timestamp.toISOString(),
        r.engine_rpm,
        r.vehicle_speed_kmh,
        r.coolant_temp_c,
        r.intake_air_temp_c,
        r.maf_airflow_gs,
        r.throttle_position_pct,
        r.fuel_level_pct,
        r.engine_load_pct,
        r.short_fuel_trim_pct,
        r.long_fuel_trim_pct,
        r.ambient_temp_c,
        r.barometric_pressure_kpa,
        r.control_module_voltage_v,
      ].join(','),
    );

    return {
      csvContent: [headers.join(','), ...rows].join('\n'),
      filename: `sensor_${vehicleId}_${vehicleMake}_${vehicleModel}_upload_${uploadId}.csv`,
    };
  }

private formatDate(date?: Date | string | null): string {
  if (!date) {
    return '';
  }

  return new Date(date).toISOString().split('T')[0];
}

private buildMaintenanceCsv(
  records: MaintenanceRecord[],
  vehicleId: string,
  vehicleMake: string,
  vehicleModel: string,
  vehicleYear: number | string,
  uploadId: string,
): { csvContent: string; filename: string } {
  const headers = [
    'vehicleId',
    'vehicleMake',
    'vehicleModel',
    'vehicleYear',
    'service_date',
    'service_type',
    'mileage_at_service_km',
    'cost',
    'parts_replaced',
    'shop',
    'notes',
    'next_due_km',
    'next_due_date',
  ];

  const rows = records.map((r) =>
    [
      vehicleId,
      vehicleMake,
      vehicleModel,
      vehicleYear,
      this.formatDate(r.service_date),
      r.service_type,
      r.mileage_at_service_km,
      r.cost ?? '',
      r.parts_replaced ?? '',
      r.shop ?? '',
      r.notes ?? '',
      r.next_due_km ?? '',
      this.formatDate(r.next_due_date),
    ].join(','),
  );

  return {
    csvContent: [headers.join(','), ...rows].join('\n'),
    filename: `maintenance_${vehicleId}_${vehicleMake}_${vehicleModel}_upload_${uploadId}.csv`,
  };
}

  private buildDtcCsv(
    entries: DtcEntry[],
    vehicleId: string,
    vehicleMake: string,
    vehicleModel: string,
    vehicleYear: number | string,
    uploadId: string,
  ): { csvContent: string; filename: string } {
    const headers = [
      'vehicleId',
      'vehicleMake',
      'vehicleModel',
      'vehicleYear',
      'timestamp',
      'dtc_code',
      'description',
      'severity',
      'component_category',
      'status',
      'mil_active',
      'freeze_frame',
    ];

    const rows = entries.map((r) =>
      [
        vehicleId,
        vehicleMake,
        vehicleModel,
        vehicleYear,
        r.timestamp.toISOString(),
        r.dtc_code,
        r.description,
        r.severity,
        r.component_category,
        r.status,
        r.mil_active,
        `"${JSON.stringify(r.freeze_frame).replace(/"/g, '""')}"`,
      ].join(','),
    );

    return {
      csvContent: [headers.join(','), ...rows].join('\n'),
      filename: `dtc_${vehicleId}_${vehicleMake}_${vehicleModel}_upload_${uploadId}.csv`,
    };
  }




  async findByVehicle(vehicleId: string, page = 1, limit = 10) {
  const [data, total] = await this.uploadRepo.findAndCount({
    where: { vehicle: { id: vehicleId } },
    order: { created_at: 'DESC' },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    data: data.map((u) => ({
      ...u,
      downloadUrl: `/uploads/${u.id}/download`,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
}