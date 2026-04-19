import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MaintenanceRecord } from './entities/maintenance.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { parse } from 'csv-parse/sync';
import { Upload, UploadStatus } from 'src/upload/entities/upload.entity';

import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class MaintenanceService {
  constructor(
    @InjectRepository(MaintenanceRecord)
    private maintenanceRepo: Repository<MaintenanceRecord>,

    @InjectRepository(Vehicle)
    private vehicleRepo: Repository<Vehicle>,

    @InjectRepository(Upload)
    private uploadRepo: Repository<Upload>,
  ) {}

  private readonly REQUIRED_COLUMNS = [
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
    if (!this.isValidDate(row.service_date)) {
      throw new BadRequestException(
        `Ligne ${index + 1}: "service_date" invalide`,
      );
    }

    if (
      typeof row.service_type !== 'string' ||
      row.service_type.trim() === ''
    ) {
      throw new BadRequestException(
        `Ligne ${index + 1}: "service_type" invalide`,
      );
    }

    if (!this.isValidNumber(row.mileage_at_service_km)) {
      throw new BadRequestException(
        `Ligne ${index + 1}: "mileage_at_service_km" invalide`,
      );
    }

    if (!this.isValidNumber(row.cost)) {
      throw new BadRequestException(
        `Ligne ${index + 1}: "cost" invalide`,
      );
    }

    if (
      typeof row.parts_replaced !== 'string' ||
      row.parts_replaced.trim() === ''
    ) {
      throw new BadRequestException(
        `Ligne ${index + 1}: "parts_replaced" invalide`,
      );
    }

    if (typeof row.shop !== 'string' || row.shop.trim() === '') {
      throw new BadRequestException(
        `Ligne ${index + 1}: "shop" invalide`,
      );
    }

    if (typeof row.notes !== 'string' || row.notes.trim() === '') {
      throw new BadRequestException(
        `Ligne ${index + 1}: "notes" invalide`,
      );
    }

    if (!this.isValidNumber(row.next_due_km)) {
      throw new BadRequestException(
        `Ligne ${index + 1}: "next_due_km" invalide`,
      );
    }

    if (!this.isValidDate(row.next_due_date)) {
      throw new BadRequestException(
        `Ligne ${index + 1}: "next_due_date" invalide`,
      );
    }
  }

  async create(
    vehicleId: string,
    userId: string,
    dto: CreateMaintenanceDto,
  ) {
    const vehicle = await this.checkOwnership(vehicleId, userId);

    const record = this.maintenanceRepo.create({
      ...dto,
      service_date: new Date(dto.service_date),
      next_due_date: new Date(dto.next_due_date),
      mileage_at_service_km: Number(dto.mileage_at_service_km),
      cost: Number(dto.cost),
      next_due_km: Number(dto.next_due_km),
      vehicle,
    });

    return this.maintenanceRepo.save(record);
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

    try {
      let records: any[] = [];

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

      const entities = records.map((r, index) => {
        this.validateRecord(r, index);

        return this.maintenanceRepo.create({
          service_date: new Date(r.service_date),
          service_type: r.service_type.trim(),
          mileage_at_service_km: Number(r.mileage_at_service_km),
          cost: Number(r.cost),
          parts_replaced: r.parts_replaced.trim(),
          shop: r.shop.trim(),
          notes: r.notes.trim(),
          next_due_km: Number(r.next_due_km),
          next_due_date: new Date(r.next_due_date),
          vehicle,
          upload,
        });
      });

      await this.maintenanceRepo.insert(entities);

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

    const [data, total] = await this.maintenanceRepo.findAndCount({
      where: { vehicle: { id: vehicleId } },
      order: { service_date: 'DESC' },
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


  async getAnalytics(vehicleId: string, userId: string) {
  await this.checkOwnership(vehicleId, userId);

  const records = await this.maintenanceRepo.find({
    where: { vehicle: { id: vehicleId } },
    order: { service_date: 'ASC' },
  });

  
  const totalCost = records.reduce(
    (sum, r) => sum + Number(r.cost || 0),
    0,
  );


  const costPerMonth: Record<string, number> = {};

  records.forEach((r) => {
    const date = new Date(r.service_date);
    const key = `${date.getFullYear()}-${date.getMonth() + 1}`;

    if (!costPerMonth[key]) {
      costPerMonth[key] = 0;
    }

    costPerMonth[key] += Number(r.cost || 0);
  });

  const costChart = Object.entries(costPerMonth).map(
    ([month, cost]) => ({
      month,
      cost,
    }),
  );

  const nextMaintenance = records
    .filter((r) => r.next_due_date)
    .sort(
      (a, b) =>
        new Date(a.next_due_date).getTime() -
        new Date(b.next_due_date).getTime(),
    )[0];

  const now = new Date();
  const overdue = records.filter(
    (r) => r.next_due_date && new Date(r.next_due_date) < now,
  );

  return {
    totalCost,
    totalRecords: records.length,
    costChart,
    nextMaintenance,
    overdueCount: overdue.length,
  };
}
}