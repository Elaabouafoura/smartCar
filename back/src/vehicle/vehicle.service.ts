import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private repo: Repository<Vehicle>,
  ) {}

  create(userId: string, dto: CreateVehicleDto) {
    return this.repo.save({ ...dto, userId });
  }

  async findMine(userId: string, page = 1, limit = 20) {
    const [data, total] = await this.repo.findAndCount({
      where: { userId, isDeleted: false },
      relations: ['owner'],
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    return { data, total, page, limit };
  }

  async findOne(id: string, userId: string) {
    const vehicle = await this.repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!vehicle || vehicle.userId !== userId) {
      throw new ForbiddenException();
    }

    return vehicle;
  }

  async update(id: string, userId: string, dto: UpdateVehicleDto) {
    await this.findOne(id, userId);
    await this.repo.update(id, dto);
    return this.repo.findOne({ where: { id, isDeleted: false } });
  }

  async softDelete(id: string, userId: string) {
    await this.findOne(id, userId);

    await this.repo.update(id, {
      isDeleted: true,
      deletedAt: new Date(),
    });

    return {
      message: 'Vehicle deleted successfully',
    };
  }

  async findAllAdmin() {
    return this.repo.find({
      where: { isDeleted: false },
      relations: ['owner'], 
      order: { createdAt: 'DESC' },
    });
  }

  async findOneAdmin(id: string) {
    const vehicle = await this.repo.findOne({
      where: { id, isDeleted: false },
      relations: ['owner'],
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    return vehicle;
  }

  async deleteAdmin(id: string) {
    const vehicle = await this.repo.findOne({
      where: { id, isDeleted: false },
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    await this.repo.update(id, {
      isDeleted: true,
      deletedAt: new Date(),
    });

    return {
      message: 'Vehicle deleted successfully by admin',
    };
  }

  async getHealth(id: string, userId: string) {
    const v = await this.findOne(id, userId);
    return { healthScore: v.healthScore ?? 100 };
  }
}