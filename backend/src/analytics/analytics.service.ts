import { Injectable } from '@nestjs/common';
import { sha256 } from '../common/utils/crypto.js';
import { Prisma, type AnalyticsEventType } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CacheService } from '../redis/cache.service.js';
import { CardsService } from '../cards/cards.service.js';
import { DEDUPE_WINDOW_SECONDS, DEFAULT_DEDUPE_SECONDS, rangeStart, type AnalyticsRange } from './analytics.types.js';

type Counts = Record<AnalyticsEventType, number>;

const EMPTY_COUNTS = (): Counts => ({
  VIEW: 0, QR_SCAN: 0, SHARE: 0, CONTACT_DOWNLOAD: 0, APPLE_WALLET_ADD: 0, GOOGLE_WALLET_ADD: 0,
  WHATSAPP_CLICK: 0, WEBSITE_CLICK: 0, EMAIL_CLICK: 0, PHONE_CLICK: 0, LOCATION_CLICK: 0, SOCIAL_CLICK: 0,
});

interface SeriesRow { day: Date; views: bigint; scans: bigint; visitors: bigint; interactions: bigint }

@Injectable()
export class AnalyticsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly cards: CardsService,
  ) {}

  /**
   * Records an event unless the same anonymous visitor already produced it for this card
   * within the dedupe window. Returns whether the event was stored.
   */
  async record(input: {
    cardId: string;
    eventType: AnalyticsEventType;
    visitorId?: string;
    referrer?: string;
    meta?: string;
  }): Promise<boolean> {
    const visitorHash = input.visitorId ? sha256(input.visitorId) : undefined;
    if (visitorHash) {
      const ttl = DEDUPE_WINDOW_SECONDS[input.eventType] ?? DEFAULT_DEDUPE_SECONDS;
      const key = `evt:${input.cardId}:${input.eventType}:${input.meta ?? ''}:${visitorHash}`;
      if (!(await this.cache.setIfAbsent(key, ttl))) return false;
    }
    await this.prisma.cardAnalytics.create({
      data: {
        cardId: input.cardId,
        eventType: input.eventType,
        visitorSessionId: visitorHash,
        referrer: input.referrer,
        meta: input.meta,
      },
    });
    return true;
  }

  async overview(userId: string, range: AnalyticsRange) {
    const since = rangeStart(range);
    const cardFilter: Prisma.CardAnalyticsWhereInput = { card: { userId }, ...(since ? { createdAt: { gte: since } } : {}) };

    const [totalCards, activeCards, grouped, visitors, series, top, recent] = await Promise.all([
      this.prisma.businessCard.count({ where: { userId } }),
      this.prisma.businessCard.count({ where: { userId, status: 'ACTIVE' } }),
      this.prisma.cardAnalytics.groupBy({ by: ['eventType'], where: cardFilter, _count: { _all: true } }),
      this.uniqueVisitors(Prisma.sql`c."userId" = ${userId}::uuid`, since),
      this.series(Prisma.sql`c."userId" = ${userId}::uuid`, range, since),
      this.topCards(userId, since),
      this.recentActivity({ card: { userId } }),
    ]);

    return {
      range,
      totals: { cards: totalCards, activeCards, uniqueVisitors: visitors, ...this.toCounts(grouped) },
      series,
      topCards: top,
      recentActivity: recent,
    };
  }

  async card(userId: string, cardId: string, range: AnalyticsRange) {
    const card = await this.cards.findOwned(userId, cardId);
    const since = rangeStart(range);
    const where: Prisma.CardAnalyticsWhereInput = { cardId: card.id, ...(since ? { createdAt: { gte: since } } : {}) };
    const [grouped, visitors, series, recent, social, referrers] = await Promise.all([
      this.prisma.cardAnalytics.groupBy({ by: ['eventType'], where, _count: { _all: true } }),
      this.uniqueVisitors(Prisma.sql`a."cardId" = ${card.id}::uuid`, since),
      this.series(Prisma.sql`a."cardId" = ${card.id}::uuid`, range, since),
      this.recentActivity({ cardId: card.id }),
      this.prisma.cardAnalytics.groupBy({
        by: ['meta'],
        where: { ...where, eventType: 'SOCIAL_CLICK' },
        _count: { _all: true },
      }),
      this.prisma.cardAnalytics.groupBy({
        by: ['referrer'],
        where: { ...where, eventType: 'VIEW', referrer: { not: null } },
        _count: { _all: true },
        orderBy: { _count: { referrer: 'desc' } },
        take: 5,
      }),
    ]);
    return {
      range,
      card: { id: card.id, name: card.name, slug: card.slug, status: card.status },
      totals: { uniqueVisitors: visitors, ...this.toCounts(grouped) },
      series,
      socialClicks: social.map((s) => ({ platform: s.meta ?? 'other', count: s._count._all })),
      topReferrers: referrers.map((r) => ({ referrer: r.referrer, count: r._count._all })),
      recentActivity: recent,
    };
  }

  private toCounts(grouped: { eventType: AnalyticsEventType; _count: { _all: number } }[]): Counts {
    const counts = EMPTY_COUNTS();
    for (const g of grouped) counts[g.eventType] = g._count._all;
    return counts;
  }

  private async uniqueVisitors(scope: Prisma.Sql, since?: Date) {
    const rows = await this.prisma.$queryRaw<{ count: bigint }[]>`
      SELECT COUNT(DISTINCT a."visitorSessionId") AS count
      FROM card_analytics a JOIN business_cards c ON c.id = a."cardId"
      WHERE ${scope} ${since ? Prisma.sql`AND a."createdAt" >= ${since}` : Prisma.empty}`;
    return Number(rows[0]?.count ?? 0);
  }

  private async series(scope: Prisma.Sql, range: AnalyticsRange, since?: Date) {
    const rows = await this.prisma.$queryRaw<SeriesRow[]>`
      SELECT date_trunc('day', a."createdAt") AS day,
        COUNT(*) FILTER (WHERE a."eventType" = 'VIEW') AS views,
        COUNT(*) FILTER (WHERE a."eventType" = 'QR_SCAN') AS scans,
        COUNT(DISTINCT a."visitorSessionId") FILTER (WHERE a."eventType" = 'VIEW') AS visitors,
        COUNT(*) FILTER (WHERE a."eventType" NOT IN ('VIEW', 'QR_SCAN')) AS interactions
      FROM card_analytics a JOIN business_cards c ON c.id = a."cardId"
      WHERE ${scope} ${since ? Prisma.sql`AND a."createdAt" >= ${since}` : Prisma.empty}
      GROUP BY 1 ORDER BY 1`;

    const byDay = new Map(rows.map((r) => [new Date(r.day).toISOString().slice(0, 10), r]));
    const start = since ?? (rows[0] ? new Date(rows[0].day) : rangeStart('30d')!);
    const points: { date: string; views: number; scans: number; visitors: number; interactions: number }[] = [];
    const cursor = new Date(start);
    cursor.setUTCHours(0, 0, 0, 0);
    const end = new Date();
    // Cap "all time" to 2 years of daily points.
    for (let i = 0; cursor <= end && i < 730; i++) {
      const key = cursor.toISOString().slice(0, 10);
      const r = byDay.get(key);
      points.push({
        date: key,
        views: Number(r?.views ?? 0),
        scans: Number(r?.scans ?? 0),
        visitors: Number(r?.visitors ?? 0),
        interactions: Number(r?.interactions ?? 0),
      });
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    void range;
    return points;
  }

  private async topCards(userId: string, since?: Date) {
    const grouped = await this.prisma.cardAnalytics.groupBy({
      by: ['cardId'],
      where: { card: { userId }, eventType: 'VIEW', ...(since ? { createdAt: { gte: since } } : {}) },
      _count: { _all: true },
      orderBy: { _count: { cardId: 'desc' } },
      take: 5,
    });
    const cards = await this.prisma.businessCard.findMany({
      where: { id: { in: grouped.map((g) => g.cardId) } },
      select: { id: true, name: true, jobTitle: true, companyName: true, profileImage: true, status: true },
    });
    return grouped
      .map((g) => ({ ...cards.find((c) => c.id === g.cardId)!, views: g._count._all }))
      .filter((c) => c.id);
  }

  private recentActivity(where: Prisma.CardAnalyticsWhereInput) {
    return this.prisma.cardAnalytics.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: {
        id: true,
        eventType: true,
        meta: true,
        createdAt: true,
        card: { select: { id: true, name: true } },
      },
    });
  }
}
