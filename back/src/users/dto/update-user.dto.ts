

import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name?: string;

 @IsOptional()
  @IsUrl({
    require_tld: false,
  })
  avatarUrl?: string;

  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  notificationPrefs?: Record<string, any>;
}

