import {
  Injectable,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DtcEntry } from './entities/dtc.entity';
import { Vehicle } from '../vehicle/entities/vehicle.entity';
import { CreateDtcDto } from './dto/create-dtc.dto';
import { parse } from 'csv-parse/sync';
import { Upload, UploadStatus } from 'src/upload/entities/upload.entity';

import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DtcService {
  constructor(
    @InjectRepository(DtcEntry)
    private dtcRepo: Repository<DtcEntry>,

    @InjectRepository(Vehicle)
    private vehicleRepo: Repository<Vehicle>,

    @InjectRepository(Upload)
    private uploadRepo: Repository<Upload>,
  ) {}

  private readonly REQUIRED_COLUMNS = [
    'dtc_code',
    'description',
    'severity',
    'component_category',
    'status',
    'mil_active',
    'freeze_frame',
    'timestamp',
  ];

  private readonly ALLOWED_COLUMNS = [
    'dtc_code',
    'description',
    'severity',
    'component_category',
    'status',
    'mil_active',
    'freeze_frame',
    'timestamp',
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

  private validateColumnsAndValues(records: any[]) {
    if (!Array.isArray(records) || records.length === 0) {
      throw new BadRequestException('Fichier vide');
    }

    const firstRow = records[0];
    const fileColumns = Object.keys(firstRow);

    const missingColumns = this.REQUIRED_COLUMNS.filter(
      (col) => !fileColumns.includes(col),
    );

    if (missingColumns.length > 0) {
      throw new BadRequestException(
        `Colonnes obligatoires manquantes: ${missingColumns.join(', ')}`,
      );
    }

    const extraColumns = fileColumns.filter(
      (col) => !this.ALLOWED_COLUMNS.includes(col),
    );

    if (extraColumns.length > 0) {
      throw new BadRequestException(
        `Colonnes non autorisées: ${extraColumns.join(', ')}`,
      );
    }

    records.forEach((row, index) => {
      this.REQUIRED_COLUMNS.forEach((col) => {
        const value = row[col];

        if (
          value === null ||
          value === undefined ||
          value === '' ||
          (typeof value === 'string' && value.trim() === '')
        ) {
          throw new BadRequestException(
            `Ligne ${index + 1}: la colonne "${col}" est obligatoire et ne doit pas être vide`,
          );
        }
      });
    });
  }

  private validateRecord(row: any, index: number) {
    if (typeof row.dtc_code !== 'string' || row.dtc_code.trim() === '') {
      throw new BadRequestException(
        `Ligne ${index + 1}: "dtc_code" invalide`,
      );
    }

    if (
      typeof row.description !== 'string' ||
      row.description.trim() === ''
    ) {
      throw new BadRequestException(
        `Ligne ${index + 1}: "description" invalide`,
      );
    }

    if (typeof row.severity !== 'string' || row.severity.trim() === '') {
      throw new BadRequestException(
        `Ligne ${index + 1}: "severity" invalide`,
      );
    }

    if (
      typeof row.component_category !== 'string' ||
      row.component_category.trim() === ''
    ) {
      throw new BadRequestException(
        `Ligne ${index + 1}: "component_category" invalide`,
      );
    }

    if (typeof row.status !== 'string' || row.status.trim() === '') {
      throw new BadRequestException(
        `Ligne ${index + 1}: "status" invalide`,
      );
    }

    if (
      row.mil_active !== true &&
      row.mil_active !== false &&
      row.mil_active !== 'true' &&
      row.mil_active !== 'false'
    ) {
      throw new BadRequestException(
        `Ligne ${index + 1}: "mil_active" doit être true ou false`,
      );
    }

    try {
      if (typeof row.freeze_frame === 'string') {
        JSON.parse(row.freeze_frame);
      } else if (
        typeof row.freeze_frame !== 'object' ||
        row.freeze_frame === null
      ) {
        throw new Error();
      }
    } catch {
      throw new BadRequestException(
        `Ligne ${index + 1}: "freeze_frame" doit être un JSON valide`,
      );
    }

    const parsedDate = new Date(row.timestamp);
    if (isNaN(parsedDate.getTime())) {
      throw new BadRequestException(
        `Ligne ${index + 1}: "timestamp" invalide`,
      );
    }
  }

  async create(
    vehicleId: string,
    userId: string,
    dto: CreateDtcDto,
  ) {
    const vehicle = await this.checkOwnership(vehicleId, userId);

    const dtc = this.dtcRepo.create({
      ...dto,
      timestamp: new Date(dto.timestamp),
      vehicle,
    });

    return this.dtcRepo.save(dtc);
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

    const safeFileName = `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
    const filePath = path.join(uploadDir, safeFileName);

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

      const entities: DtcEntry[] = records.map((r, index) => {
        this.validateRecord(r, index);

        return this.dtcRepo.create({
          dtc_code: r.dtc_code,
          description: r.description,
          severity: r.severity,
          component_category: r.component_category,
          status: r.status,
          mil_active: r.mil_active === true || r.mil_active === 'true',
          freeze_frame:
            typeof r.freeze_frame === 'string'
              ? JSON.parse(r.freeze_frame)
              : r.freeze_frame,
          timestamp: new Date(r.timestamp),
          vehicle,
          upload,
        });
      });

      await this.dtcRepo.insert(entities);

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
    severity?: string,
    status?: string,
  ) {
    await this.checkOwnership(vehicleId, userId);

    const query = this.dtcRepo
      .createQueryBuilder('dtc')
      .leftJoin('dtc.vehicle', 'vehicle')
      .where('vehicle.id = :vehicleId', { vehicleId });

    if (severity) {
      query.andWhere('dtc.severity = :severity', { severity });
    }

    if (status) {
      query.andWhere('dtc.status = :status', { status });
    }

    query
      .orderBy('dtc.timestamp', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const [data, total] = await query.getManyAndCount();

    return {
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }
}