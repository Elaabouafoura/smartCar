import {
  Controller,
  Post,
  Get,
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

import { SensorReadingService } from './sensor-reading.service';
import { CreateSensorReadingDto } from './dto/create-sensor-reading.dto';

@Controller('vehicles/:vehicleId/sensor-data')
@UseGuards(AuthGuard('jwt'))
export class SensorReadingController {
  constructor(private readonly service: SensorReadingService) {}

  @Post()
  async create(
    @Param('vehicleId') vehicleId: string,
    @Req() req: Request & { user: { id: string } },
    @Body() dto: CreateSensorReadingDto,
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
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
  ) {
    return this.service.findAll(vehicleId, req.user.id, page, limit);
  }

  @Get('dashboard')
  getVehicleDashboard(
    @Param('vehicleId') vehicleId: string,
    @Req() req: Request & { user: { id: string } },
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('uploadId') uploadId?: string,
  ) {
    return this.service.getVehicleDashboard(
      vehicleId,
      req.user.id,
      from,
      to,
      uploadId,
    );
  }
}