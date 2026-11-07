import { Controller, Get, Param, ParseUUIDPipe, Query, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CardsService } from '../cards/cards.service.js';
import { QrQueryDto } from '../cards/dto/card.dto.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthUser } from '../common/types.js';
import { publicCardUrl } from '../cards/card.mapper.js';
import { AppConfig } from '../config/app-config.js';
import { QrCodeService, type QrOptions } from './qrcode.service.js';

@ApiTags('QR codes')
@Controller('cards/:id/qr')
export class QrCodeController {
  constructor(
    private readonly cards: CardsService,
    private readonly qr: QrCodeService,
    private readonly config: AppConfig,
  ) {}

  /** Owner QR preview/download. Query params override the saved QR settings. */
  @Get()
  async get(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Query() query: QrQueryDto,
    @Res() res: Response,
  ) {
    const card = await this.cards.findOwned(user.id, id);
    const saved = (card.qrSettings ?? {}) as QrOptions;
    const opts: QrOptions = {
      fgColor: query.fgColor ?? saved.fgColor,
      bgColor: query.bgColor ?? saved.bgColor,
      logo: query.logo ?? saved.logo,
      companyLogoUrl: card.companyLogo,
    };
    const text = this.qr.scanUrl(publicCardUrl(this.config.frontendUrl, card.slug));
    await sendQr(this.qr, res, text, card.slug, query, opts);
  }
}

export async function sendQr(
  qr: QrCodeService,
  res: Response,
  text: string,
  slug: string,
  query: QrQueryDto,
  opts: QrOptions,
) {
  const format = query.format ?? 'png';
  const disposition = query.download ? `attachment; filename="kardify-${slug}.${format}"` : 'inline';
  res.setHeader('Content-Disposition', disposition);
  res.setHeader('Cache-Control', 'private, max-age=300');
  if (format === 'svg') {
    res.type('image/svg+xml').send(await qr.svg(text, opts));
  } else {
    res.type('image/png').send(await qr.png(text, query.size ?? 1024, opts));
  }
}
