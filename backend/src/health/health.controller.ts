import { Controller, Get } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { SkipThrottle } from '@nestjs/throttler';
import { AppConfig } from '../config/app-config.js';
import { Public } from '../common/decorators/public.decorator.js';
import { PrismaService } from '../prisma/prisma.service.js';

@ApiTags('Health')
@Public()
@SkipThrottle()
@Controller()
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
  ) {}

  @Get('health')
  async health() {
    await this.prisma.$queryRaw`SELECT 1`;
    return { status: 'ok' };
  }

  /** Which optional integrations are configured, so the UI can explain disabled features. */
  @Get('features')
  features() {
    return {
      appleWallet: !!this.config.apple,
      googleWallet: !!this.config.google,
      uploads: !!this.config.cloudinary,
      email: !!this.config.resendApiKey,
    };
  }
}
