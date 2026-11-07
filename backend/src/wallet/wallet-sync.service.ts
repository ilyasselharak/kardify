import { Injectable, Logger } from '@nestjs/common';
import type { BusinessCard } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AppleWalletService } from './apple/apple-wallet.service.js';
import { GoogleWalletService } from './google/google-wallet.service.js';

/** Keeps passes already saved in Apple / Google Wallet in sync with the card. */
@Injectable()
export class WalletSyncService {
  private readonly logger = new Logger(WalletSyncService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly apple: AppleWalletService,
    private readonly google: GoogleWalletService,
  ) {}

  async cardChanged(card: BusinessCard) {
    const passes = await this.prisma.walletPass.findMany({ where: { cardId: card.id }, select: { platform: true } });
    const tasks: Promise<unknown>[] = [];
    if (passes.some((p) => p.platform === 'APPLE')) tasks.push(this.apple.notifyUpdated(card.id));
    if (passes.some((p) => p.platform === 'GOOGLE')) tasks.push(this.google.syncExisting(card));
    const results = await Promise.allSettled(tasks);
    for (const r of results) if (r.status === 'rejected') this.logger.warn(String(r.reason));
  }

  async cardDeleted(card: BusinessCard) {
    await this.google.syncExisting(card, true).catch((e: Error) => this.logger.warn(e.message));
  }
}
