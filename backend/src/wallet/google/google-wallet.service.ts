import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { GoogleAuth } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { publicCardUrl } from '../../cards/card.mapper.js';
import { AppConfig } from '../../config/app-config.js';
import { isAllowedImageUrl } from '../../common/utils/remote-image.js';
import type { BusinessCard } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { WALLET_LABELS } from '../wallet.labels.js';
import type { WalletCardDesign } from '../wallet.utils.js';

const API = 'https://walletobjects.googleapis.com/walletobjects/v1';
const SCOPE = 'https://www.googleapis.com/auth/wallet_object.issuer';

interface HttpError {
  status?: number;
  response?: { status?: number };
}

/** Google Wallet Generic Pass integration (https://developers.google.com/wallet/generic). */
@Injectable()
export class GoogleWalletService {
  private readonly logger = new Logger(GoogleWalletService.name);
  private auth?: GoogleAuth;
  private classReady = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
  ) {}

  get enabled() {
    return !!this.config.google;
  }

  private requireConfig() {
    const g = this.config.google;
    if (!g) throw new ServiceUnavailableException({ code: 'WALLET_NOT_CONFIGURED', message: 'Google Wallet is not configured' });
    this.auth ??= new GoogleAuth({ credentials: { client_email: g.clientEmail, private_key: g.privateKey }, scopes: [SCOPE] });
    return g;
  }

  classId() {
    const g = this.requireConfig();
    return `${g.issuerId}.${g.classSuffix}`;
  }

  objectId(card: BusinessCard) {
    return `${this.requireConfig().issuerId}.card_${card.publicId}`;
  }

  /** Creates/updates the Generic Object and returns a signed "Save to Google Wallet" link. */
  async saveUrl(card: BusinessCard): Promise<string> {
    const g = this.requireConfig();
    await this.upsertObject(card);
    await this.prisma.walletPass.upsert({
      where: { cardId_platform: { cardId: card.id, platform: 'GOOGLE' } },
      create: {
        cardId: card.id,
        platform: 'GOOGLE',
        externalObjectId: this.objectId(card),
        serialNumber: `g-${card.publicId}`,
      },
      update: { lastUpdatedAt: new Date(), status: 'ACTIVE' },
    });
    const token = jwt.sign(
      {
        iss: g.clientEmail,
        aud: 'google',
        typ: 'savetowallet',
        origins: g.origins,
        payload: { genericObjects: [{ id: this.objectId(card), classId: this.classId() }] },
      },
      g.privateKey,
      { algorithm: 'RS256' },
    );
    return `https://pay.google.com/gp/v/save/${token}`;
  }

  /** Called when a card changes; only touches objects that were already saved by someone. */
  async syncExisting(card: BusinessCard, deleted = false) {
    if (!this.enabled) return;
    const pass = await this.prisma.walletPass.findUnique({
      where: { cardId_platform: { cardId: card.id, platform: 'GOOGLE' } },
    });
    if (!pass) return;
    await this.upsertObject(card, deleted ? 'INACTIVE' : undefined);
    if (!deleted) {
      await this.prisma.walletPass.update({ where: { id: pass.id }, data: { lastUpdatedAt: new Date() } });
    }
  }

  private async ensureClass() {
    if (this.classReady) return;
    const id = this.classId();
    try {
      await this.request('GET', `/genericClass/${encodeURIComponent(id)}`);
    } catch (err) {
      if (statusOf(err) !== 404) throw err;
      await this.request('POST', '/genericClass', { id });
    }
    this.classReady = true;
  }

  private async upsertObject(card: BusinessCard, forceState?: 'INACTIVE') {
    await this.ensureClass();
    const body = this.buildObject(card, forceState);
    const id = encodeURIComponent(body.id);
    try {
      await this.request('GET', `/genericObject/${id}`);
      await this.request('PUT', `/genericObject/${id}`, body);
    } catch (err) {
      if (statusOf(err) !== 404) throw err;
      await this.request('POST', '/genericObject', body);
    }
  }

  buildObject(card: BusinessCard, forceState?: 'INACTIVE') {
    const lang = card.language;
    const l = WALLET_LABELS[lang] ?? WALLET_LABELS.en;
    const design = (card.designSettings ?? {}) as WalletCardDesign;
    const url = publicCardUrl(this.config.frontendUrl, card.slug);
    const text = (value: string) => ({ defaultValue: { language: lang, value } });
    const image = (uri: string, description: string) => ({
      sourceUri: { uri },
      contentDescription: text(description),
    });
    const logoUri = isAllowedImageUrl(card.companyLogo)
      ? card.companyLogo
      : `${this.config.frontendUrl}/brand/kardify-mark.png`;

    const allModules: { id: string; header: string; body: string | null }[] = [
      { id: 'company', header: l.company, body: card.companyName },
      { id: 'phone', header: l.phone, body: card.phone },
      { id: 'email', header: l.email, body: card.email },
      { id: 'website', header: l.website, body: card.website },
      { id: 'address', header: l.address, body: card.address },
      { id: 'about', header: l.about, body: card.description },
    ];
    const modules = allModules.filter((m): m is { id: string; header: string; body: string } => !!m.body);

    const links = [
      card.phone && { uri: `tel:${card.phone.replace(/[^\d+]/g, '')}`, description: l.phone, id: 'tel' },
      card.email && { uri: `mailto:${card.email}`, description: l.email, id: 'mail' },
      card.website && { uri: card.website, description: l.website, id: 'web' },
      { uri: url, description: l.card, id: 'card' },
    ].filter(Boolean);

    return {
      id: this.objectId(card),
      classId: this.classId(),
      state: forceState ?? (card.status === 'ACTIVE' ? 'ACTIVE' : 'INACTIVE'),
      cardTitle: text('Kardify'),
      header: text(card.name),
      ...(card.jobTitle ? { subheader: text(card.jobTitle) } : {}),
      logo: image(logoUri, card.companyName ?? 'Kardify'),
      ...(isAllowedImageUrl(card.profileImage) ? { heroImage: image(card.profileImage, card.name) } : {}),
      hexBackgroundColor: /^#[0-9a-f]{6}$/i.test(design.backgroundColor ?? '') ? design.backgroundColor : '#0d1e37',
      barcode: { type: 'QR_CODE', value: `${url}?src=qr`, alternateText: l.scan },
      textModulesData: modules,
      linksModuleData: { uris: links },
    };
  }

  private async request(method: 'GET' | 'POST' | 'PUT', path: string, data?: unknown) {
    this.requireConfig();
    const client = await this.auth!.getClient();
    return client.request({ url: `${API}${path}`, method, data });
  }
}

function statusOf(err: unknown): number | undefined {
  const e = err as HttpError;
  return e?.status ?? e?.response?.status;
}
