import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Req, UseInterceptors, UploadedFile } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { AuthGuard } from '@nestjs/passport/dist/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserRole } from './entities/user.entity';

@Controller('users')
export class UsersController {
  constructor(private  usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  findAll() {
    return this.usersService.findAll();
  }

  @Delete(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  remove(@Param('id') id: string) {
    return this.usersService.remove(id);
  }

  @Patch('me')
  @UseGuards(AuthGuard('jwt'))
  updateMe(@Req() req, @Body() dto: UpdateUserDto) {
    return this.usersService.update(req.user.id, dto);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  updateUser(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(id, dto);
  }
  @Post('avatar')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads/avatars', 
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
        },
      }),
    }),
  )
  uploadAvatar(@UploadedFile() file, @Req() req) {
    return {
      url: `http://localhost:3000/uploads/avatars/${file.filename}`,
    };
  }



@Patch(':id/role')
@UseGuards(AuthGuard('jwt'), RolesGuard)

updateRole(
  @Param('id') id: string,
  @Body() body: UpdateUserRoleDto,
) {
  return this.usersService.updateRole(id, body.role);
}


@Patch('bootstrap/make-me-admin/:email')
async makeMeAdmin(@Param('email') email: string) {
  return this.usersService.makeAdminByEmail(email);
}


}
