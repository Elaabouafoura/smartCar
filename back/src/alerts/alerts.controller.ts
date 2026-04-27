import { Controller, Get, Param, Req, UseGuards, UnauthorizedException } from '@nestjs/common'
import { AlertsService } from './alerts.service'
import { AuthGuard } from '@nestjs/passport'

@Controller('alerts')
@UseGuards(AuthGuard('jwt'))
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  private getUserId(req: any): string {
    const userId = req.user?.id ?? req.user?.sub ?? req.user?.userId

    if (!userId) {
      throw new UnauthorizedException('User ID not found in token payload')
    }

    return userId
  }

  @Get()
  async getMyAlerts(@Req() req: any) {
    const userId = this.getUserId(req)
    const data = await this.alertsService.getMyNotifications(userId)

    return {
      data,
      total: data.length,
    }
  }

  @Get('vehicle/:vehicleId')
  async getVehicleAlerts(
    @Param('vehicleId') vehicleId: string,
    @Req() req: any,
  ) {
    const userId = this.getUserId(req)

    const data = await this.alertsService.getVehicleNotifications(
      vehicleId,
      userId,
    )

    return {
      data,
      total: data.length,
    }
  }

  @Get('me')
getMe(@Req() req: any) {
  return req.user
}
}