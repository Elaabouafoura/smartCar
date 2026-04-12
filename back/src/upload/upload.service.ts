import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Upload } from './entities/upload.entity';
import * as fs from 'fs';

@Injectable()
export class UploadService {
  constructor(
    @InjectRepository(Upload)
    private uploadRepo: Repository<Upload>,
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

  async getDownloadFile(id: string) {
    const upload = await this.findOne(id);

    if (!upload.filePath) {
      throw new NotFoundException('No file path found for this upload');
    }

    if (!fs.existsSync(upload.filePath)) {
      throw new NotFoundException('File not found on server');
    }

    return upload;
  }

  async remove(id: string) {
    const upload = await this.findOne(id);
    return this.uploadRepo.remove(upload);
  }
}