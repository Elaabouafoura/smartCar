import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Repository } from 'typeorm/repository/Repository.js';
import { InjectRepository } from '@nestjs/typeorm';
import { User, UserRole } from './entities/user.entity';
import * as bcrypt from 'bcrypt';
@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private repo: Repository<User>,
  ) {}

async create(dto: CreateUserDto) {
 
  const existing = await this.repo.findOne({
    where: { email: dto.email },
  });

  if (existing) {
    throw new BadRequestException('Email already exists');
  }

 
  const hash = await bcrypt.hash(dto.password, 12);

 
  const user = this.repo.create({
    email: dto.email,
    passwordHash: hash,
    name: dto.name,
    avatarUrl: dto.avatarUrl ,

    
    role: UserRole.USER,
    emailVerified: false,
    language: dto.language ?? 'en',
    notificationPrefs: {},
  });

  const savedUser = await this.repo.save(user);
return savedUser;
}

  findByEmail(email: string) {
    return this.repo.findOne({ where: { email } });
  }

  findById(id: string) {
    return this.repo.findOne({ where: { id } });
  }

  async updatePassword(id: string, newHash: string) {
    await this.repo.update(id, { passwordHash: newHash });
  }

  findAll() {
  return this.repo.find({
    select: ['id', 'email', 'name', 'role', 'createdAt'],
  });
  }

  async remove(id: string) {
    return this.repo.delete(id);
  }

  async update(id: string, dto: UpdateUserDto) {
   await this.repo.update(id, dto);

   return this.findById(id);
 }

  async updateRole(id: string, role: UserRole) {
    const user = await this.repo.findOne({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.role === role) {
      return {
        message: 'Role unchanged',
        user,
      };
    }

    user.role = role;
    const updatedUser = await this.repo.save(user);

    return {
      message: 'User role updated successfully',
      user: updatedUser,
    };
  }


  async makeAdminByEmail(email: string) {
  const user = await this.repo.findOne({ where: { email } });

  if (!user) {
    throw new NotFoundException('User not found');
  }

  user.role = UserRole.ADMIN;
  await this.repo.save(user);

  return {
    message: 'User promoted to admin',
    user,
  };
}





}
