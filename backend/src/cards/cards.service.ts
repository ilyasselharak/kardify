import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { AppConfig } from '../config/app-config.js';
import { CardDesignService } from '../card-design/card-design.service.js';
import type { DesignSettings, TemplateId } from '../card-design/design.types.js';
import { randomId } from '../common/utils/crypto.js';
import { buildCardSlug } from '../common/utils/slug.js';
import { Prisma, type BusinessCard } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CacheService } from '../redis/cache.service.js';
import { WalletSyncService } from '../wallet/wallet-sync.service.js';
import { publicCardUrl } from './card.mapper.js';
import type { CreateCardDto, ListCardsQueryDto, QrSettingsDto, UpdateCardDto } from './dto/card.dto.js';

const MAX_SLUG_ATTEMPTS = 5;
export const publicCardCacheKey = (slug: string) => `public-card:${slug}`;

@Injectable()
export class CardsService {
  private readonly logger = new Logger(CardsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly design: CardDesignService,
    private readonly cache: CacheService,
    private readonly walletSync: WalletSyncService,
    private readonly config: AppConfig,
  ) {}

  async list(userId: string, q: ListCardsQueryDto) {
    const page = q.page ?? 1;
    const pageSize = q.pageSize ?? 24;
    const where: Prisma.BusinessCardWhereInput = {
      userId,
      ...(q.status ? { status: q.status } : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: 'insensitive' } },
              { companyName: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.businessCard.findMany({
        where,
        orderBy: { createdAt: q.sort === 'oldest' ? 'asc' : 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        include: { _count: { select: { analytics: { where: { eventType: 'VIEW' } } } } },
      }),
      this.prisma.businessCard.count({ where }),
    ]);
    return {
      items: items.map(({ _count, ...card }) => ({ ...this.serialize(card), views: _count.analytics })),
      total,
      page,
      pageSize,
    };
  }

  /**
   * Company-name suggestions: names from the user's own cards and from published cards (already
   * public), so drafts of other users never leak. Grouped case-insensitively, most used first.
   */
  async companySuggestions(userId: string, q = '') {
    const term = `%${q.trim().slice(0, 60).replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
    const rows = await this.prisma.$queryRaw<{ name: string }[]>`
      SELECT MODE() WITHIN GROUP (ORDER BY TRIM("companyName")) AS name
      FROM business_cards
      WHERE "companyName" IS NOT NULL AND TRIM("companyName") <> ''
        AND ("userId" = ${userId}::uuid OR status = 'ACTIVE')
        AND "companyName" ILIKE ${term}
      GROUP BY LOWER(TRIM("companyName"))
      ORDER BY COUNT(*) DESC, name ASC
      LIMIT 10`;
    return rows.map((r) => r.name);
  }

  async get(userId: string, id: string) {
    return this.serialize(await this.findOwned(userId, id));
  }

  async create(userId: string, dto: CreateCardDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { preferences: true } });
    const prefs = (user.preferences ?? {}) as Record<string, string | undefined>;
    const fallbackTemplate = (prefs.defaultTemplate as TemplateId | undefined) ?? 'classic';
    let designSettings = this.design.resolve(dto.designSettings, undefined, fallbackTemplate);
    if (!dto.designSettings) {
      designSettings = {
        ...designSettings,
        ...(prefs.defaultPrimaryColor ? { primaryColor: prefs.defaultPrimaryColor } : {}),
        ...(prefs.defaultBackgroundColor ? { backgroundColor: prefs.defaultBackgroundColor } : {}),
        ...(prefs.defaultTextColor ? { textColor: prefs.defaultTextColor } : {}),
      };
    }
    const { designSettings: _d, socialLinks, language, ...fields } = dto;
    const card = await this.withUniqueSlug(dto.name, (slug) =>
      this.prisma.businessCard.create({
        data: {
          ...fields,
          userId,
          slug,
          publicId: randomId(20),
          language: language ?? (prefs.defaultCardLanguage as 'en' | 'ar' | undefined) ?? 'en',
          socialLinks: (socialLinks ?? []) as unknown as Prisma.InputJsonValue,
          designSettings: designSettings as unknown as Prisma.InputJsonValue,
        },
      }),
    );
    return this.serialize(card);
  }

  async update(userId: string, id: string, dto: UpdateCardDto) {
    const existing = await this.findOwned(userId, id);
    const { designSettings, socialLinks, ...fields } = dto;
    const card = await this.prisma.businessCard.update({
      where: { id: existing.id },
      data: {
        ...fields,
        ...(socialLinks ? { socialLinks: socialLinks as unknown as Prisma.InputJsonValue } : {}),
        ...(designSettings
          ? {
              designSettings: this.design.resolve(
                designSettings,
                existing.designSettings as unknown as DesignSettings,
              ) as unknown as Prisma.InputJsonValue,
            }
          : {}),
      },
    });
    await this.afterChange(card);
    return this.serialize(card);
  }

  async remove(userId: string, id: string) {
    const card = await this.findOwned(userId, id);
    await this.walletSync.cardDeleted(card).catch((e: Error) => this.logger.warn(e.message));
    await this.prisma.businessCard.delete({ where: { id: card.id } });
    await this.cache.del(publicCardCacheKey(card.slug));
  }

  async duplicate(userId: string, id: string) {
    const src = await this.findOwned(userId, id);
    const name = `${src.name} (copy)`.slice(0, 120);
    const card = await this.withUniqueSlug(name, (slug) =>
      this.prisma.businessCard.create({
        data: {
          userId,
          name,
          slug,
          publicId: randomId(20),
          jobTitle: src.jobTitle,
          companyName: src.companyName,
          description: src.description,
          profileImage: src.profileImage,
          companyLogo: src.companyLogo,
          email: src.email,
          phone: src.phone,
          whatsapp: src.whatsapp,
          website: src.website,
          address: src.address,
          mapsUrl: src.mapsUrl,
          language: src.language,
          socialLinks: src.socialLinks as Prisma.InputJsonValue,
          designSettings: src.designSettings as Prisma.InputJsonValue,
          qrSettings: src.qrSettings as Prisma.InputJsonValue,
          status: 'DRAFT',
        },
      }),
    );
    return this.serialize(card);
  }

  async setStatus(userId: string, id: string, publish: boolean) {
    const existing = await this.findOwned(userId, id);
    const card = await this.prisma.businessCard.update({
      where: { id: existing.id },
      data: publish
        ? { status: 'ACTIVE', publishedAt: existing.publishedAt ?? new Date() }
        : { status: 'INACTIVE' },
    });
    await this.afterChange(card);
    return this.serialize(card);
  }

  async updateQrSettings(userId: string, id: string, dto: QrSettingsDto) {
    const existing = await this.findOwned(userId, id);
    const card = await this.prisma.businessCard.update({
      where: { id: existing.id },
      data: { qrSettings: { ...(existing.qrSettings as object), ...dto } },
    });
    return this.serialize(card);
  }

  /**
   * Issues a new public slug (and therefore a new QR code / URL). Old printed QR codes stop working,
   * which is the point when a link has leaked.
   */
  async regenerateSlug(userId: string, id: string) {
    const existing = await this.findOwned(userId, id);
    const card = await this.withUniqueSlug(existing.name, (slug) =>
      this.prisma.businessCard.update({ where: { id: existing.id }, data: { slug } }),
    );
    await this.cache.del(publicCardCacheKey(existing.slug));
    await this.afterChange(card);
    return this.serialize(card);
  }

  async findOwned(userId: string, id: string): Promise<BusinessCard> {
    const card = await this.prisma.businessCard.findFirst({ where: { id, userId } });
    if (!card) throw new NotFoundException({ code: 'CARD_NOT_FOUND', message: 'Card not found' });
    return card;
  }

  serialize(card: BusinessCard) {
    const { userId: _u, ...rest } = card;
    return { ...rest, publicUrl: publicCardUrl(this.config.frontendUrl, card.slug) };
  }

  private async afterChange(card: BusinessCard) {
    await this.cache.del(publicCardCacheKey(card.slug));
    // Push updates to Apple / Google Wallet in the background, batched across rapid autosaves.
    this.walletSync.scheduleCardChanged(card.id);
  }

  /** Retries with a fresh random suffix on unique-constraint collisions. */
  private async withUniqueSlug<T>(name: string, fn: (slug: string) => Promise<T>): Promise<T> {
    for (let attempt = 0; attempt < MAX_SLUG_ATTEMPTS; attempt++) {
      try {
        return await fn(buildCardSlug(name, 6 + attempt));
      } catch (err) {
        const collision =
          err instanceof Prisma.PrismaClientKnownRequestError &&
          err.code === 'P2002' &&
          JSON.stringify(err.meta ?? {}).match(/slug|public_?id/i);
        if (!collision) throw err;
      }
    }
    throw new Error('Could not generate a unique slug');
  }
}
