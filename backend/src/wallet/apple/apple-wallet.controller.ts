import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  Logger,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiExcludeEndpoint, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AnalyticsService } from '../../analytics/analytics.service.js';
import { AppConfig } from '../../config/app-config.js';
import { Public, SkipCsrf } from '../../common/decorators/public.decorator.js';
import { ensureVisitorId } from '../../common/utils/visitor.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { PublicService } from '../../public/public.service.js';
import { safeEqual } from '../wallet.utils.js';
import { AppleWalletService } from './apple-wallet.service.js';

/**
 * Apple Wallet: pass download + the PassKit Web Service
 * (https://developer.apple.com/documentation/walletpasses/adding-a-web-service-to-update-passes).
 */
@ApiTags('Apple Wallet')
@Public()
@SkipCsrf()
@Controller('wallet/apple')
export class AppleWalletController {
  private readonly logger = new Logger(AppleWalletController.name);

  constructor(
    private readonly apple: AppleWalletService,
    private readonly pub: PublicService,
    private readonly prisma: PrismaService,
    private readonly analytics: AnalyticsService,
    private readonly config: AppConfig,
  ) {}

  /** Download a signed .pkpass for a published card. `cardId` is the card's public id. */
  @Get(':cardId')
  @Throttle({ default: { limit: 20, ttl: 60_000 } })
  async download(@Param('cardId') publicId: string, @Req() req: Request, @Res() res: Response) {
    const card = await this.pub.findActive({ publicId });
    const pass = await this.apple.ensurePass(card);
    const buffer = await this.apple.buildPass(card, pass);
    const visitorId = ensureVisitorId(req, res, this.config.isProduction);
    await this.analytics.record({ cardId: card.id, eventType: 'APPLE_WALLET_ADD', visitorId });
    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Content-Disposition', `attachment; filename="${card.slug}.pkpass"`);
    res.setHeader('Last-Modified', pass.lastUpdatedAt.toUTCString());
    res.send(buffer);
  }

  @ApiExcludeEndpoint()
  @Post('v1/devices/:deviceId/registrations/:passTypeId/:serial')
  async register(
    @Param('deviceId') deviceId: string,
    @Param('passTypeId') passTypeId: string,
    @Param('serial') serial: string,
    @Headers('authorization') auth: string | undefined,
    @Body() body: { pushToken?: string },
    @Res() res: Response,
  ) {
    const pass = await this.authorize(passTypeId, serial, auth);
    if (!body?.pushToken || typeof body.pushToken !== 'string') return res.status(400).send();
    const existing = await this.prisma.appleDeviceRegistration.findUnique({
      where: { deviceLibraryIdentifier_walletPassId: { deviceLibraryIdentifier: deviceId, walletPassId: pass.id } },
    });
    await this.prisma.appleDeviceRegistration.upsert({
      where: { deviceLibraryIdentifier_walletPassId: { deviceLibraryIdentifier: deviceId, walletPassId: pass.id } },
      create: { deviceLibraryIdentifier: deviceId.slice(0, 255), walletPassId: pass.id, pushToken: body.pushToken.slice(0, 255) },
      update: { pushToken: body.pushToken.slice(0, 255) },
    });
    return res.status(existing ? 200 : 201).send();
  }

  @ApiExcludeEndpoint()
  @Get('v1/devices/:deviceId/registrations/:passTypeId')
  async serials(
    @Param('deviceId') deviceId: string,
    @Param('passTypeId') passTypeId: string,
    @Query('passesUpdatedSince') since: string | undefined,
    @Res() res: Response,
  ) {
    if (passTypeId !== this.config.apple?.passTypeIdentifier) return res.status(404).send();
    const sinceDate = since && /^\d+$/.test(since) ? new Date(Number(since) * 1000) : undefined;
    const regs = await this.prisma.appleDeviceRegistration.findMany({
      where: {
        deviceLibraryIdentifier: deviceId,
        walletPass: sinceDate ? { lastUpdatedAt: { gt: sinceDate } } : {},
      },
      include: { walletPass: { select: { serialNumber: true, lastUpdatedAt: true } } },
    });
    if (regs.length === 0) return res.status(204).send();
    const latest = Math.max(...regs.map((r) => r.walletPass.lastUpdatedAt.getTime()));
    return res.status(200).json({
      serialNumbers: regs.map((r) => r.walletPass.serialNumber),
      lastUpdated: String(Math.floor(latest / 1000)),
    });
  }

  @ApiExcludeEndpoint()
  @Get('v1/passes/:passTypeId/:serial')
  async latest(
    @Param('passTypeId') passTypeId: string,
    @Param('serial') serial: string,
    @Headers('authorization') auth: string | undefined,
    @Headers('if-modified-since') ifModifiedSince: string | undefined,
    @Res() res: Response,
  ) {
    const pass = await this.authorize(passTypeId, serial, auth);
    const updatedAt = Math.floor(pass.lastUpdatedAt.getTime() / 1000) * 1000;
    if (ifModifiedSince && new Date(ifModifiedSince).getTime() >= updatedAt) return res.status(304).send();
    const card = await this.prisma.businessCard.findUniqueOrThrow({ where: { id: pass.cardId } });
    const buffer = await this.apple.buildPass(card, pass);
    res.setHeader('Content-Type', 'application/vnd.apple.pkpass');
    res.setHeader('Last-Modified', new Date(updatedAt).toUTCString());
    return res.status(200).send(buffer);
  }

  @ApiExcludeEndpoint()
  @Delete('v1/devices/:deviceId/registrations/:passTypeId/:serial')
  @HttpCode(200)
  async unregister(
    @Param('deviceId') deviceId: string,
    @Param('passTypeId') passTypeId: string,
    @Param('serial') serial: string,
    @Headers('authorization') auth: string | undefined,
  ) {
    const pass = await this.authorize(passTypeId, serial, auth);
    await this.prisma.appleDeviceRegistration.deleteMany({
      where: { deviceLibraryIdentifier: deviceId, walletPassId: pass.id },
    });
  }

  @ApiExcludeEndpoint()
  @Post('v1/log')
  @HttpCode(200)
  log(@Body() body: { logs?: string[] }) {
    for (const line of (body?.logs ?? []).slice(0, 20)) this.logger.warn(`Wallet device log: ${String(line).slice(0, 500)}`);
  }

  private async authorize(passTypeId: string, serial: string, header: string | undefined) {
    if (passTypeId !== this.config.apple?.passTypeIdentifier) throw new NotFoundException();
    const token = header?.startsWith('ApplePass ') ? header.slice('ApplePass '.length) : '';
    if (!token || !safeEqual(token, this.apple.authToken(serial))) throw new UnauthorizedException();
    const pass = await this.prisma.walletPass.findUnique({ where: { serialNumber: serial } });
    if (!pass || pass.platform !== 'APPLE') throw new NotFoundException();
    return pass;
  }
}
