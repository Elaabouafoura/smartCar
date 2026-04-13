import {
  Controller,
  Get,
  Param,
  Delete,
  Query,
  Res,
  DefaultValuePipe,
  ParseIntPipe,
} from '@nestjs/common';
import type { Response } from 'express';
import { UploadService } from './upload.service';

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get()
  findAll(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.uploadService.findAll(page, limit);
  }

  @Get('vehicle/:vehicleId')
  async findByVehicle(
    @Param('vehicleId') vehicleId: string,
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.uploadService.findByVehicle(vehicleId, page, limit);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const { csvContent, filename } = await this.uploadService.getDownloadFile(id);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.send(csvContent);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.uploadService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.uploadService.remove(id);
  }
}