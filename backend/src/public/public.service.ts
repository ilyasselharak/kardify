import { Injectable, NotFoundException } from '@nestjs/common';
import { AppConfig } from '../config/app-config.js';
import { toPublicCard, type PublicCard, type SocialLink } from '../cards/card.mapper.js';
import { publicCardCacheKey } from '../cards/cards.service.js';
import { fetchImageAsPng } from '../common/utils/remote-image.js';
import type { BusinessCard } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CacheService } from '../redis/cache.service.js';
import { buildShareLinks } from '../sharing/share-links.js';
import { buildVCard } from './vcard.js';
import sharp from 'sharp';

const PUBLIC_CACHE_TTL = 120;

@Injectable()
export class PublicService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly config: AppConfig,
  ) {}

  /** Published (ACTIVE) cards only. Cached; invalidated whenever the owner edits the card. */
  async getBySlug(slug: string): Promise<PublicCard & { shareLinks: ReturnType<typeof buildShareLinks> }> {
    const key = publicCardCacheKey(slug);
    const cached = await this.cache.get<PublicCard & { shareLinks: ReturnType<typeof buildShareLinks> }>(key);
    if (cached) return cached;
    const card = await this.findActive({ slug });
    const pub = toPublicCard(card, this.config.frontendUrl);
    const result = { ...pub, shareLinks: buildShareLinks(pub.url, card.language, card.name) };
    await this.cache.set(key, result, PUBLIC_CACHE_TTL);
    return result;
  }

  async findActive(where: { slug: string } | { publicId: string }): Promise<BusinessCard> {
    const card = await this.prisma.businessCard.findFirst({ where: { ...where, status: 'ACTIVE' } });
    if (!card) throw new NotFoundException({ code: 'CARD_NOT_FOUND', message: 'Card not found' });
    return card;
  }

  async vcard(card: BusinessCard): Promise<string> {
    const photoPng = await fetchImageAsPng(card.profileImage, 256);
    const photo = photoPng ? (await sharp(photoPng).jpeg({ quality: 80 }).toBuffer()).toString('base64') : undefined;
    const links = ((card.socialLinks as unknown as SocialLink[]) ?? []).filter((l) => l.visible !== false);
    return buildVCard({
      ...card,
      url: toPublicCard(card, this.config.frontendUrl).url,
      socialLinks: links,
      photoJpegBase64: photo,
    });
  }
}
