import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateAuthDto } from './dto/create-auth.dto';
import { UpdateAuthDto } from './dto/update-auth.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { UsersService } from 'src/users/users.service';
import { RefreshToken } from './entities/refresh-token.entity';
import { Repository } from 'typeorm';
import { ResetToken } from './entities/reset-token.entity';
import { randomUUID } from 'crypto';
import * as bcrypt from 'bcrypt';
import * as nodemailer from 'nodemailer';

@Injectable()
export class AuthService {
  constructor(
    private users: UsersService,
    private jwt: JwtService,
    @InjectRepository(RefreshToken)
    private refreshRepo: Repository<RefreshToken>,
    @InjectRepository(ResetToken)
    private resetRepo: Repository<ResetToken>,
  ) {}

  async register(dto) {
    const user = await this.users.create(dto);
    return this.issueTokens(user.id, user.role, user.name);
  }

  async login(email: string, password: string) {
    const user = await this.users.findByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.passwordHash)))
      throw new UnauthorizedException();

    return this.issueTokens(user.id, user.role, user.name);
  }

  async issueTokens(userId: string, role: string, name: string) {
    const accessToken = this.jwt.sign({ sub: userId, role ,name}, { expiresIn: '30m' });

    const raw = randomUUID();
    const hash = await bcrypt.hash(raw, 10);

    await this.refreshRepo.save({
      userId,
      tokenHash: hash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });

    return { accessToken, refreshToken: raw };
  }
async refresh(token: string) {
  const tokens = await this.refreshRepo.find({
    where: { revoked: false },
  });

  for (const t of tokens) {
    const match = await bcrypt.compare(token, t.tokenHash);

    if (match) {
      if (t.expiresAt < new Date()) {
        throw new UnauthorizedException('Refresh token expired');
      }

      t.revoked = true;
      await this.refreshRepo.save(t);

      const user = await this.users.findById(t.userId);

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

        return this.issueTokens(user.id, user.role, user.name);
    }
  }

  throw new UnauthorizedException('Invalid refresh token');
}


async logout(token: string) {
  if (!token) {
    throw new UnauthorizedException('Refresh token missing');
  }

  const tokens = await this.refreshRepo.find({
    where: { revoked: false },
  });

  for (const t of tokens) {
    if (!t.tokenHash) continue;

    const match = await bcrypt.compare(token, t.tokenHash);

    if (match) {
      t.revoked = true;
      await this.refreshRepo.save(t);
      return { message: 'Logged out successfully' };
    }
  }

  throw new UnauthorizedException('Invalid refresh token');
}


  async forgotPassword(email: string) {
  const user = await this.users.findByEmail(email);

  if (!user) {
    return { message: 'If email exists, reset link sent.' };
  }

  // Générer token brut
  const raw = randomUUID();

  // Hasher pour stocker en DB
  const hash = await bcrypt.hash(raw, 10);

  await this.resetRepo.save({
    userId: user.id,
    tokenHash: hash,
    used: false,
    expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 min
  });

 
const resetLink = `${process.env.FRONTEND_URL}/auth/password-new?token=${encodeURIComponent(raw)}`;

  // Config transport mail
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  // Envoi mail
  await transporter.sendMail({
    from: `"Your App" <${process.env.EMAIL_USER}>`,
    to: user.email,
    subject: 'Password Reset',
    html: `
      <h2>Password Reset</h2>
      <p>Click the link below to reset your password:</p>
      <a href="${resetLink}">${resetLink}</a>
      <p>This link expires in 15 minutes.</p>
    `,
  });

  return { message: 'Reset link sent to your email' };
}



async resetPassword(token: string, newPass: string) {
  const tokens = await this.resetRepo.find({
    where: { used: false },
  });

  for (const t of tokens) {
    const match = await bcrypt.compare(token, t.tokenHash);

    if (match) {
      if (t.expiresAt < new Date()) {
        throw new UnauthorizedException('Token expired');
      }

      const hash = await bcrypt.hash(newPass, 12);
      await this.users.updatePassword(t.userId, hash);

      t.used = true;
      await this.resetRepo.save(t);

      return { message: 'Password updated' };
    }
  }

  throw new UnauthorizedException('Invalid token');
}



async changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await this.users.findById(userId);
  if (!user) throw new Error('User not found');

  const valid = await bcrypt.compare(currentPassword, user.passwordHash); 
  if (!valid) throw new Error('Current password is incorrect');

  const newHash = await bcrypt.hash(newPassword, 10);
  await this.users.updatePassword(userId, newHash); 

  return { message: 'Password updated successfully ✅' };
}
}
