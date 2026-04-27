import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
  Query,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Res,
} from '@nestjs/common'
import express from 'express'
import { VehicleService } from './vehicle.service'
import { VehicleReportService } from './vehicle-report.service'
import { CreateVehicleDto } from './dto/create-vehicle.dto'
import { UpdateVehicleDto } from './dto/update-vehicle.dto'
import { AuthGuard } from '@nestjs/passport'
import { RolesGuard } from 'src/auth/guards/roles.guard'
import { FileInterceptor } from '@nestjs/platform-express'
import { diskStorage } from 'multer'
import { extname } from 'path'

@Controller('vehicles')
@UseGuards(AuthGuard('jwt'))
export class VehicleController {
  constructor(
    private service: VehicleService,
    private vehicleReportService: VehicleReportService,
  ) {}

  @Post('upload-image')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/vehicles',
        filename: (_req, file, callback) => {
          const uniqueName =
            Date.now() + '-' + Math.round(Math.random() * 1e9)
          callback(null, `${uniqueName}${extname(file.originalname)}`)
        },
      }),
      fileFilter: (_req, file, callback) => {
        const allowedMimeTypes = [
          'image/jpeg',
          'image/png',
          'image/jpg',
          'image/webp',
        ]

        if (!allowedMimeTypes.includes(file.mimetype)) {
          return callback(
            new BadRequestException('Only jpg, jpeg, png, webp are allowed'),
            false,
          )
        }

        callback(null, true)
      },
      limits: {
        fileSize: 2 * 1024 * 1024,
      },
    }),
  )
  uploadImage(@UploadedFile() file: Express.Multer.File, @Req() req) {
    if (!file) {
      throw new BadRequestException('No file uploaded')
    }

    const baseUrl = `${req.protocol}://${req.get('host')}`
    return {
      message: 'Image uploaded successfully',
      photoUrl: `${baseUrl}/uploads/vehicles/${file.filename}`,
      filename: file.filename,
    }
  }

  @Post()
  create(@Req() req, @Body() dto: CreateVehicleDto) {
    return this.service.create(req.user.id, dto)
  }

  @Get()
  findMine(
    @Req() req,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.service.findMine(req.user.id, +page, +limit)
  }

  @Get('admin/all')
  @UseGuards(RolesGuard)
  findAllAdmin() {
    return this.service.findAllAdmin()
  }

  @Get('admin/:id')
  @UseGuards(RolesGuard)
  findOneAdmin(@Param('id') id: string) {
    return this.service.findOneAdmin(id)
  }

  @Delete('admin/:id')
  @UseGuards(RolesGuard)
  deleteAdmin(@Param('id') id: string) {
    return this.service.deleteAdmin(id)
  }

  @Get(':id/report/export')
  async exportVehicleReport(
    @Param('id') id: string,
    @Req() req,
    @Res() res: express.Response,
  ) {
    const { stream, fileName } =
      await this.vehicleReportService.generateVehicleReportPdf(
        id,
        req.user.id,
      )

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fileName}"`,
    )

    stream.pipe(res)
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Req() req) {
    return this.service.findOne(id, req.user.id)
  }

  @Patch(':id')
  update(@Param('id') id: string, @Req() req, @Body() dto: UpdateVehicleDto) {
    return this.service.update(id, req.user.id, dto)
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Req() req) {
    return this.service.softDelete(id, req.user.id)
  }

  @Get(':id/health')
  health(@Param('id') id: string, @Req() req) {
    return this.service.getHealth(id, req.user.id)
  }
}