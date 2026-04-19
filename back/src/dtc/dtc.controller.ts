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
  BadRequestException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { FileInterceptor } from '@nestjs/platform-express';
import { Request } from 'express';

import { DtcService } from './dtc.service';
import { CreateDtcDto } from './dto/create-dtc.dto';

@Controller('vehicles/:vehicleId/dtc')
@UseGuards(AuthGuard('jwt'))
export class DtcController {
  constructor(private readonly service: DtcService) {}

  @Post()
  async create(
    @Param('vehicleId') vehicleId: string,
    @Req() req: Request & { user: { id: string } },
    @Body() dto: CreateDtcDto,
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
    if (!file) {
      throw new BadRequestException('File required');
    }

    return this.service.upload(vehicleId, req.user.id, file);
  }

  @Get()
  async findAll(
    @Param('vehicleId') vehicleId: string,
    @Req() req: Request & { user: { id: string } },
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(50), ParseIntPipe) limit: number,
    @Query('severity') severity?: string,
    @Query('status') status?: string,
  ) {
    return this.service.findAll(
      vehicleId,
      req.user.id,
      page,
      limit,
      severity,
      status,
    );
  }


  @Get('analytics')
  getDtcAnalytics(@Param('vehicleId') vehicleId: string, @Req() req) {
    return this.service.getDtcAnalytics(vehicleId, req.user.id)
  }
}