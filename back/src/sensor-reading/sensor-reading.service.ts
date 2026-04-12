import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SensorReading } from './entities/sensor-reading.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { CreateSensorReadingDto } from './dto/create-sensor-reading.dto';
import { parse } from 'csv-parse/sync';
import { Upload, UploadStatus } from 'src/upload/entities/upload.entity';

import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class SensorReadingService {
  constructor(
    @InjectRepository(SensorReading)
    private sensorRepo: Repository<SensorReading>,

    @InjectRepository(Vehicle)
    private vehicleRepo: Repository<Vehicle>,

    @InjectRepository(Upload)
    private uploadRepo: Repository<Upload>,
  ) {}

  private readonly REQUIRED_COLUMNS = [
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

  private async checkOwnership(vehicleId: string, userId: string) {
    const vehicle = await this.vehicleRepo.findOne({
      where: { id: vehicleId, userId },
    });

    if (!vehicle) {
      throw new ForbiddenException('Vehicle not found');
    }

    return vehicle;
  }

  private isEmpty(value: any): boolean {
    return (
      value === null ||
      value === undefined ||
      value === '' ||
      (typeof value === 'string' && value.trim() === '')
    );
  }

  private isValidDate(value: any): boolean {
    if (this.isEmpty(value)) {
      return false;
    }

    const date = new Date(value);
    return !isNaN(date.getTime());
  }

  private isValidNumber(value: any): boolean {
    if (this.isEmpty(value)) {
      return false;
    }

    return !isNaN(Number(value));
  }

  private validateColumnsAndValues(records: any[]) {
    if (!Array.isArray(records) || records.length === 0) {
      throw new BadRequestException('Fichier vide');
    }

    const fileColumns = Object.keys(records[0]);

    const missingColumns = this.REQUIRED_COLUMNS.filter(
      (col) => !fileColumns.includes(col),
    );

    if (missingColumns.length > 0) {
      throw new BadRequestException(
        `Colonnes obligatoires manquantes: ${missingColumns.join(', ')}`,
      );
    }

    const extraColumns = fileColumns.filter(
      (col) => !this.REQUIRED_COLUMNS.includes(col),
    );

    if (extraColumns.length > 0) {
      throw new BadRequestException(
        `Colonnes non autorisées: ${extraColumns.join(', ')}`,
      );
    }

    records.forEach((row, index) => {
      const rowColumns = Object.keys(row);

      const rowMissingColumns = this.REQUIRED_COLUMNS.filter(
        (col) => !rowColumns.includes(col),
      );

      if (rowMissingColumns.length > 0) {
        throw new BadRequestException(
          `Ligne ${index + 1}: colonnes obligatoires manquantes: ${rowMissingColumns.join(', ')}`,
        );
      }

      const rowExtraColumns = rowColumns.filter(
        (col) => !this.REQUIRED_COLUMNS.includes(col),
      );

      if (rowExtraColumns.length > 0) {
        throw new BadRequestException(
          `Ligne ${index + 1}: colonnes non autorisées: ${rowExtraColumns.join(', ')}`,
        );
      }

      this.REQUIRED_COLUMNS.forEach((col) => {
        if (this.isEmpty(row[col])) {
          throw new BadRequestException(
            `Ligne ${index + 1}: "${col}" est obligatoire et ne doit pas être vide`,
          );
        }
      });
    });
  }

  private validateRecord(row: any, index: number) {
    if (!this.isValidDate(row.timestamp)) {
      throw new BadRequestException(
        `Ligne ${index + 1}: "timestamp" invalide`,
      );
    }

    const numericColumns = this.REQUIRED_COLUMNS.filter(
      (col) => col !== 'timestamp',
    );

    numericColumns.forEach((col) => {
      if (!this.isValidNumber(row[col])) {
        throw new BadRequestException(
          `Ligne ${index + 1}: "${col}" doit être un nombre valide`,
        );
      }
    });
  }

  async create(
    vehicleId: string,
    userId: string,
    dto: CreateSensorReadingDto,
  ) {
    const vehicle = await this.checkOwnership(vehicleId, userId);

    const reading = this.sensorRepo.create({
      ...dto,
      timestamp: new Date(dto.timestamp),
      engine_rpm: Number(dto.engine_rpm),
      vehicle_speed_kmh: Number(dto.vehicle_speed_kmh),
      coolant_temp_c: Number(dto.coolant_temp_c),
      intake_air_temp_c: Number(dto.intake_air_temp_c),
      maf_airflow_gs: Number(dto.maf_airflow_gs),
      throttle_position_pct: Number(dto.throttle_position_pct),
      fuel_level_pct: Number(dto.fuel_level_pct),
      engine_load_pct: Number(dto.engine_load_pct),
      short_fuel_trim_pct: Number(dto.short_fuel_trim_pct),
      long_fuel_trim_pct: Number(dto.long_fuel_trim_pct),
      ambient_temp_c: Number(dto.ambient_temp_c),
      barometric_pressure_kpa: Number(dto.barometric_pressure_kpa),
      control_module_voltage_v: Number(dto.control_module_voltage_v),
      vehicle,
    });

    return this.sensorRepo.save(reading);
  }

  async upload(
    vehicleId: string,
    userId: string,
    file: Express.Multer.File,
  ) {
    const vehicle = await this.checkOwnership(vehicleId, userId);

    if (!file) {
      throw new BadRequestException('File required');
    }

    const uploadDir = path.join(process.cwd(), 'uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const safeFilename = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, safeFilename);

    fs.writeFileSync(filePath, file.buffer);

    const upload = this.uploadRepo.create({
      vehicle,
      filename: file.originalname,
      status: UploadStatus.PROCESSING,
      filePath,
    });

    await this.uploadRepo.save(upload);

    let records: any[] = [];

    try {
      if (file.mimetype === 'application/json') {
        records = JSON.parse(file.buffer.toString());
      } else if (
        file.mimetype === 'text/csv' ||
        file.originalname.endsWith('.csv')
      ) {
        records = parse(file.buffer.toString(), {
          columns: true,
          skip_empty_lines: true,
          trim: true,
        });
      } else {
        throw new BadRequestException('Invalid file type');
      }

      if (!Array.isArray(records) || records.length === 0) {
        throw new BadRequestException('Empty file');
      }

      this.validateColumnsAndValues(records);

      const entities: SensorReading[] = records.map((r, index) => {
        this.validateRecord(r, index);

        return this.sensorRepo.create({
          timestamp: new Date(r.timestamp),
          engine_rpm: Number(r.engine_rpm),
          vehicle_speed_kmh: Number(r.vehicle_speed_kmh),
          coolant_temp_c: Number(r.coolant_temp_c),
          intake_air_temp_c: Number(r.intake_air_temp_c),
          maf_airflow_gs: Number(r.maf_airflow_gs),
          throttle_position_pct: Number(r.throttle_position_pct),
          fuel_level_pct: Number(r.fuel_level_pct),
          engine_load_pct: Number(r.engine_load_pct),
          short_fuel_trim_pct: Number(r.short_fuel_trim_pct),
          long_fuel_trim_pct: Number(r.long_fuel_trim_pct),
          ambient_temp_c: Number(r.ambient_temp_c),
          barometric_pressure_kpa: Number(r.barometric_pressure_kpa),
          control_module_voltage_v: Number(r.control_module_voltage_v),
          vehicle,
          upload,
        });
      });

      await this.sensorRepo.insert(entities);

      upload.row_count = entities.length;
      upload.status = UploadStatus.SUCCESS;
      await this.uploadRepo.save(upload);

      return {
        total: records.length,
        inserted: entities.length,
        uploadId: upload.id,
        downloadUrl: `/uploads/${upload.id}/download`,
      };
    } catch (error) {
      upload.status = UploadStatus.FAILED;

      if (error instanceof Error) {
        upload.errors = {
          message: error.message,
          stack: error.stack,
        };
      } else {
        upload.errors = { message: 'Unknown error' };
      }

      await this.uploadRepo.save(upload);
      throw error;
    }
  }

  async findAll(
    vehicleId: string,
    userId: string,
    page: number,
    limit: number,
  ) {
    await this.checkOwnership(vehicleId, userId);

    const [data, total] = await this.sensorRepo.findAndCount({
      where: { vehicle: { id: vehicleId } },
      order: { timestamp: 'DESC' },
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
}