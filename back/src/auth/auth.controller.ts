import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req } from '@nestjs/common';
import { AuthService } from './auth.service';

import { AuthGuard } from '@nestjs/passport';
@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('register')
  register(@Body() dto) {
    return this.auth.register(dto);
  }

  @Post('login')
  login(@Body() b) {
    return this.auth.login(b.email, b.password);
  }

  @Post('refresh')
  refresh(@Body('refreshToken') t: string) {
    return this.auth.refresh(t);
  }

  @Post('logout')
  logout(@Body('refreshToken') t: string) {
    return this.auth.logout(t);
  }

  @Post('forgot-password')
  forgot(@Body('email') email: string) {
    return this.auth.forgotPassword(email);
  }

  @Post('reset-password')
  reset(@Body() b) {
    return this.auth.resetPassword(b.token, b.newPass);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me')
  me(@Req() req) {
    return req.user;
  }

 
  @UseGuards(AuthGuard('jwt'))
  @Patch('change-password')
  async changePassword(@Req() req, @Body() body: { currentPassword: string; newPassword: string }) {
    return this.auth.changePassword(req.user.id, body.currentPassword, body.newPassword);
  }
}
