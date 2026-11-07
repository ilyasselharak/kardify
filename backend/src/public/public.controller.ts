import { Body, Controller, Get, HttpCode, Param, Post, Query, Req, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AnalyticsService } from '../analytics/analytics.service.js';
import { TrackEventDto } from '../analytics/dto/analytics.dto.js';
import { QrQueryDto } from '../cards/dto/card.dto.js';
import { AppConfig } from '../config/app-config.js';
import { Public } from '../common/decorators/public.decorator.js';
import { referrerOrigin } from '../common/utils/request.js';
import { ensureVisitorId } from '../common/utils/visitor.js';
import { QrCodeService, type QrOptions } from '../qrcode/qrcode.service.js';
import { sendQr } from '../qrcode/qrcode.controller.js';
import { PublicService } from './public.service.js';

@ApiTags('Public')
@Public()
@Controller('public/cards/:slug')
export class PublicController {
  constructor(
    private readonly pub: PublicService,
    private readonly analytics: AnalyticsService,
    private readonly qr: QrCodeService,
    private readonly config: AppConfig,
  ) {}

  @Get()
  async get(@Param('slug') slug: string, @Res({ passthrough: true }) res: Response) {
    const card = await this.pub.getBySlug(slug);
    res.setHeader('Cache-Control', 'public, max-age=30, stale-while-revalidate=120');
    return card;
  }

  @Get('vcard')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  async vcard(@Param('slug') slug: string, @Req() req: Request, @Res() res: Response) {
    const card = await this.pub.findActive({ slug });
    const visitorId = ensureVisitorId(req, res, this.config.isProduction);
    await this.analytics.record({ cardId: card.id, eventType: 'CONTACT_DOWNLOAD', visitorId });
    const body = await this.pub.vcard(card);
    res.setHeader('Content-Type', 'text/vcard; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${card.slug}.vcf"`);
    res.send(body);
  }

  @Get('qr')
  async qrCode(@Param('slug') slug: string, @Query() query: QrQueryDto, @Res() res: Response) {
    const card = await this.pub.findActive({ slug });
    const saved = (card.qrSettings ?? {}) as QrOptions;
    const text = this.qr.scanUrl(`${this.config.frontendUrl}/card/${card.slug}`);
    await sendQr(this.qr, res, text, card.slug, query, { ...saved, companyLogoUrl: card.companyLogo });
  }

  @Post('analytics')
  @HttpCode(202)
  @Throttle({ default: { limit: 60, ttl: 60_000 } })
  async track(
    @Param('slug') slug: string,
    @Body() dto: TrackEventDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const card = await this.pub.findActive({ slug });
    const visitorId = ensureVisitorId(req, res, this.config.isProduction);
    const recorded = await this.analytics.record({
      cardId: card.id,
      eventType: dto.eventType,
      visitorId,
      meta: dto.meta,
      referrer: referrerOrigin(dto.referrer),
    });
    return { recorded };
  }
}
