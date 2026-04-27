import {
  Controller,
  Post,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  UploadedFile,
  UseInterceptors,
  Query,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';

import { MaintenanceService } from './maintenance.service';
import { CreateMaintenanceDto } from './dto/create-maintenance.dto';
import { UpdateNextMaintenanceDto } from './dto/update-next-maintenance.dto';
import { UpdateAppointmentDto } from './dto/update-appointment.dto';

@Controller('vehicles/:vehicleId/maintenance')
@UseGuards(AuthGuard('jwt'))
export class MaintenanceController {
  constructor(private readonly service: MaintenanceService) {}

  @Post()
  async create(
    @Param('vehicleId') vehicleId: string,
    @Req() req: Request & { user: { id: string } },
    @Body() dto: CreateMaintenanceDto,
  ) {
    return this.service.create(vehicleId, req.user.id, dto);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async upload(
    @Param('vehicleId') vehicleId: string,
    @UploadedFile() file: Express.Multer.File,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.service.upload(vehicleId, req.user.id, file);
  }

  @Get()
  async findAll(
    @Param('vehicleId') vehicleId: string,
    @Req() req: Request & { user: { id: string } },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number,
  ) {
    return this.service.findAll(vehicleId, req.user.id, page, limit);
  }

  @Get('analytics')
  getAnalytics(
    @Param('vehicleId') vehicleId: string,
    @Req() req: Request & { user: { id: string } },
  ) {
    return this.service.getAnalytics(vehicleId, req.user.id);
  }

  @Patch(':maintenanceId/next-maintenance')
  updateNextMaintenance(
    @Param('vehicleId') vehicleId: string,
    @Param('maintenanceId') maintenanceId: string,
    @Req() req: Request & { user: { id: string } },
    @Body() dto: UpdateNextMaintenanceDto,
  ) {
    return this.service.updateNextMaintenance(
      vehicleId,
      maintenanceId,
      req.user.id,
      dto,
    );
  }

  @Patch(':maintenanceId/appointment')
  updateAppointment(
    @Param('vehicleId') vehicleId: string,
    @Param('maintenanceId') maintenanceId: string,
    @Req() req: Request & { user: { id: string } },
    @Body() dto: UpdateAppointmentDto,
  ) {
    return this.service.updateAppointment(
      vehicleId,
      maintenanceId,
      req.user.id,
      dto,
    );
  }

  @Get('mechanics/:mechanicId/bookings')
  getMechanicBookings(
    @Param('mechanicId') mechanicId: string,
    @Query('date') date: string,
  ) {
    return this.service.getMechanicBookings(mechanicId, date);
  }
}