import { Body, Controller, Delete, Get, Header, HttpCode, Patch, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Response } from 'express';
import { TokenDto } from '../auth/dto/auth.dto.js';
import { clearAuthCookie } from '../auth/auth-cookie.js';
import { AppConfig } from '../config/app-config.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { AllowUnverified, Public } from '../common/decorators/public.decorator.js';
import type { AuthUser } from '../common/types.js';
import {
  ChangeEmailDto,
  ChangePasswordDto,
  DeleteAccountDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
} from './dto/users.dto.js';
import { UsersService } from './users.service.js';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly users: UsersService,
    private readonly config: AppConfig,
  ) {}

  @AllowUnverified()
  @Patch('me')
  async updateProfile(@CurrentUser() user: AuthUser, @Body() dto: UpdateProfileDto) {
    return { user: await this.users.updateProfile(user.id, dto) };
  }

  @Patch('me/preferences')
  async updatePreferences(@CurrentUser() user: AuthUser, @Body() dto: UpdatePreferencesDto) {
    return { user: await this.users.updatePreferences(user.id, dto) };
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('me/password')
  @HttpCode(204)
  changePassword(@CurrentUser() user: AuthUser, @Body() dto: ChangePasswordDto) {
    return this.users.changePassword(user.id, user.sessionId, dto);
  }

  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('me/email')
  @HttpCode(202)
  async changeEmail(@CurrentUser() user: AuthUser, @Body() dto: ChangeEmailDto) {
    await this.users.requestEmailChange(user.id, dto);
    return { ok: true };
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post('email/confirm')
  @HttpCode(200)
  async confirmEmail(@Body() dto: TokenDto) {
    await this.users.confirmEmailChange(dto.token);
    return { ok: true };
  }

  @AllowUnverified()
  @Get('me/export')
  @Header('Content-Disposition', 'attachment; filename="kardify-export.json"')
  exportData(@CurrentUser() user: AuthUser) {
    return this.users.exportData(user.id);
  }

  @AllowUnverified()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Delete('me')
  @HttpCode(204)
  async deleteAccount(
    @CurrentUser() user: AuthUser,
    @Body() dto: DeleteAccountDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    await this.users.deleteAccount(user.id, dto.password);
    clearAuthCookie(res, this.config);
  }
}
