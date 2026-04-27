import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mechanic } from './entities/mechanic.entity';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';

@Injectable()
export class MechanicService {
  constructor(
    @InjectRepository(Mechanic)
    private mechanicRepo: Repository<Mechanic>,
  ) {}

  async create(dto: CreateMechanicDto) {
    const mechanic = this.mechanicRepo.create(dto);
    return this.mechanicRepo.save(mechanic);
  }

  async findAll() {
    return this.mechanicRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findActive() {
    return this.mechanicRepo.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const mechanic = await this.mechanicRepo.findOne({
      where: { id },
    });

    if (!mechanic) {
      throw new NotFoundException('Mécanicien introuvable');
    }

    return mechanic;
  }

  async update(id: string, dto: UpdateMechanicDto) {
    const mechanic = await this.findOne(id);

    Object.assign(mechanic, dto);

    return this.mechanicRepo.save(mechanic);
  }

  async remove(id: string) {
    const mechanic = await this.findOne(id);

    mechanic.isActive = false;

    return this.mechanicRepo.save(mechanic);
  }
}