import { Body, Controller, Get, HttpCode, Post, Req, Res } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AppConfig } from '../config/app-config.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { AllowUnverified, Public } from '../common/decorators/public.decorator.js';
import type { AuthenticatedRequest, AuthUser } from '../common/types.js';
import { clientIp, userAgent } from '../common/utils/request.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { clearAuthCookie, setAuthCookie } from './auth-cookie.js';
import { AuthService } from './auth.service.js';
import { EmailDto, LoginDto, OptionalEmailDto, RegisterDto, ResetPasswordDto, TokenDto } from './dto/auth.dto.js';

const AUTH_LIMIT = { default: { limit: 10, ttl: 60_000 } };

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
  ) {}

  @Public()
  @Throttle(AUTH_LIMIT)
  @Post('register')
  @ApiOperation({ summary: 'Create an account and send a verification email' })
  async register(@Body() dto: RegisterDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const user = await this.auth.register(dto);
    // Sign the user in so they land on the "check your inbox" screen; protected features stay locked until verified.
    const { token, session } = await this.auth.issueSession(user.id, false, {
      userAgent: userAgent(req),
      ipAddress: clientIp(req),
    });
    setAuthCookie(res, this.config, token, false, session.expiresAt);
    return { user: AuthService.toPublicUser(user) };
  }

  @Public()
  @Throttle(AUTH_LIMIT)
  @Post('login')
  @HttpCode(200)
  async login(@Body() dto: LoginDto, @Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const { user, token, session } = await this.auth.login(dto, { userAgent: userAgent(req), ipAddress: clientIp(req) });
    setAuthCookie(res, this.config, token, !!dto.rememberMe, session.expiresAt);
    return { user: AuthService.toPublicUser(user) };
  }

  @Public()
  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: AuthenticatedRequest, @Res({ passthrough: true }) res: Response) {
    if (req.user) await this.auth.logout(req.user.sessionId, req.user.id);
    clearAuthCookie(res, this.config);
  }

  @AllowUnverified()
  @Get('me')
  async me(@CurrentUser() current: AuthUser) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: current.id } });
    return { user: AuthService.toPublicUser(user) };
  }

  @Public()
  @Throttle(AUTH_LIMIT)
  @Post('forgot-password')
  @HttpCode(202)
  async forgotPassword(@Body() dto: EmailDto) {
    await this.auth.forgotPassword(dto.email);
    return { ok: true };
  }

  @Public()
  @Throttle(AUTH_LIMIT)
  @Post('reset-password')
  @HttpCode(200)
  async resetPassword(@Body() dto: ResetPasswordDto, @Res({ passthrough: true }) res: Response) {
    await this.auth.resetPassword(dto);
    clearAuthCookie(res, this.config);
    return { ok: true };
  }

  @Public()
  @Throttle(AUTH_LIMIT)
  @Post('verify-email')
  @HttpCode(200)
  async verifyEmail(@Body() dto: TokenDto) {
    await this.auth.verifyEmail(dto.token);
    return { ok: true };
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @Post('resend-verification')
  @HttpCode(202)
  async resendVerification(@Body() dto: OptionalEmailDto, @Req() req: AuthenticatedRequest) {
    const email = req.user?.email ?? dto.email;
    if (email) await this.auth.resendVerification(email);
    return { ok: true };
  }
}
