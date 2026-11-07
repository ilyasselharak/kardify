import { Controller, Get, Param, Query, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AnalyticsService } from '../../analytics/analytics.service.js';
import { AppConfig } from '../../config/app-config.js';
import { Public } from '../../common/decorators/public.decorator.js';
import { ensureVisitorId } from '../../common/utils/visitor.js';
import { PublicService } from '../../public/public.service.js';
import { GoogleWalletService } from './google-wallet.service.js';

@ApiTags('Google Wallet')
@Public()
@Controller('wallet/google')
export class GoogleWalletController {
  constructor(
    private readonly google: GoogleWalletService,
    private readonly pub: PublicService,
    private readonly analytics: AnalyticsService,
    private readonly config: AppConfig,
  ) {}

  /**
   * Returns `{ saveUrl }` for a published card (by public id), or redirects to it with `?redirect=1`.
   */
  @Get(':cardId')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async save(
    @Param('cardId') publicId: string,
    @Query('redirect') redirect: string | undefined,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    const card = await this.pub.findActive({ publicId });
    const saveUrl = await this.google.saveUrl(card);
    const visitorId = ensureVisitorId(req, res, this.config.isProduction);
    await this.analytics.record({ cardId: card.id, eventType: 'GOOGLE_WALLET_ADD', visitorId });
    if (redirect === '1') return res.redirect(302, saveUrl);
    return res.json({ saveUrl });
  }
}
