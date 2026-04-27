import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

import { MechanicService } from './mechanic.service';
import { CreateMechanicDto } from './dto/create-mechanic.dto';
import { UpdateMechanicDto } from './dto/update-mechanic.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';

@Controller('mechanics')
export class MechanicController {
  constructor(private readonly mechanicService: MechanicService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  findActiveForUsers() {
    return this.mechanicService.findActive();
  }

  @Get('admin/all')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  findAllForAdmin() {
    return this.mechanicService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  create(@Body() dto: CreateMechanicDto) {
    return this.mechanicService.create(dto);
  }

 
  @Get('admin/:id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  findOne(@Param('id') id: string) {
    return this.mechanicService.findOne(id);
  }

  
  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMechanicDto,
  ) {
    return this.mechanicService.update(id, dto);
  }

  
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Param('id') id: string) {
    return this.mechanicService.remove(id);
  }
}