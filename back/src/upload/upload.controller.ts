import {
  Controller,
  Get,
  Param,
  Delete,
  Query,
  Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { UploadService } from './upload.service';

@Controller('uploads')
export class UploadController {
  constructor(private readonly uploadService: UploadService) {}

  @Get()
  findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ) {
    return this.uploadService.findAll(Number(page), Number(limit));
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.uploadService.findOne(id);
  }

  @Get(':id/download')
  async download(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const upload = await this.uploadService.getDownloadFile(id);

    return res.download(upload.filePath, upload.filename);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.uploadService.remove(id);
  }
}