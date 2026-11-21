import { Injectable, Logger, type OnModuleDestroy } from '@nestjs/common';
import type { BusinessCard } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AppleWalletService } from './apple/apple-wallet.service.js';
import { GoogleWalletService } from './google/google-wallet.service.js';

/** Wait this long after the last edit before pushing wallet updates (editor autosave sends many edits). */
export const WALLET_SYNC_DEBOUNCE_MS = 15_000;

/** Keeps passes already saved in Apple / Google Wallet in sync with the card. */
@Injectable()
export class WalletSyncService implements OnModuleDestroy {
  private readonly logger = new Logger(WalletSyncService.name);
  private readonly pending = new Map<string, NodeJS.Timeout>();

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

  /**
   * Coalesces bursts of edits into one wallet push per card. The latest card state is
   * re-read when the timer fires, so the pass always reflects the final edit.
   */
  scheduleCardChanged(cardId: string, delayMs = WALLET_SYNC_DEBOUNCE_MS) {
    clearTimeout(this.pending.get(cardId));
    const timer = setTimeout(() => {
      this.pending.delete(cardId);
      void this.prisma.businessCard
        .findUnique({ where: { id: cardId } })
        .then((card) => (card ? this.cardChanged(card) : undefined))
        .catch((e: Error) => this.logger.warn(`Wallet sync failed: ${e.message}`));
    }, delayMs);
    timer.unref?.();
    this.pending.set(cardId, timer);
  }

  cancelScheduled(cardId: string) {
    clearTimeout(this.pending.get(cardId));
    this.pending.delete(cardId);
  }

  onModuleDestroy() {
    for (const t of this.pending.values()) clearTimeout(t);
    this.pending.clear();
  }

  async cardDeleted(card: BusinessCard) {
    this.cancelScheduled(card.id);
    await this.google.syncExisting(card, true).catch((e: Error) => this.logger.warn(e.message));
  }
}
