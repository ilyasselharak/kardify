import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { connect } from 'node:http2';
import { PKPass } from 'passkit-generator';
import sharp from 'sharp';
import { KARDIFY_MARK_SVG } from '../../assets/brand.js';
import { publicCardUrl, type SocialLink } from '../../cards/card.mapper.js';
import { AppConfig } from '../../config/app-config.js';
import { randomId } from '../../common/utils/crypto.js';
import { fetchImageAsPng } from '../../common/utils/remote-image.js';
import type { BusinessCard, WalletPass } from '../../generated/prisma/client.js';
import { PrismaService } from '../../prisma/prisma.service.js';
import { WALLET_LABELS } from '../wallet.labels.js';
import { hexToRgb, passAuthToken, readPem, type WalletCardDesign } from '../wallet.utils.js';

@Injectable()
export class AppleWalletService {
  private readonly logger = new Logger(AppleWalletService.name);
  private iconCache?: Record<string, Buffer>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
  ) {}

  get enabled() {
    return !!this.config.apple;
  }

  private requireConfig() {
    const apple = this.config.apple;
    if (!apple) {
      throw new ServiceUnavailableException({ code: 'WALLET_NOT_CONFIGURED', message: 'Apple Wallet is not configured' });
    }
    return apple;
  }

  /** Returns the (single) Apple pass record for a card, creating it on first download. */
  async ensurePass(card: BusinessCard): Promise<WalletPass> {
    return this.prisma.walletPass.upsert({
      where: { cardId_platform: { cardId: card.id, platform: 'APPLE' } },
      create: { cardId: card.id, platform: 'APPLE', serialNumber: `kdf-${randomId(24)}` },
      update: {},
    });
  }

  authToken(serial: string) {
    return passAuthToken(this.config.jwtSecret, serial);
  }

  /** Builds and signs a .pkpass using Apple's PassKit "generic" style. */
  async buildPass(card: BusinessCard, pass: WalletPass): Promise<Buffer> {
    const apple = this.requireConfig();
    const design = (card.designSettings ?? {}) as WalletCardDesign;
    const l = WALLET_LABELS[card.language] ?? WALLET_LABELS.en;
    const url = publicCardUrl(this.config.frontendUrl, card.slug);
    const webServiceEnabled = this.config.apiPublicUrl.startsWith('https://');
    const socialLinks = ((card.socialLinks as unknown as SocialLink[]) ?? []).filter((s) => s.visible !== false);

    const field = (key: string, label: string, value?: string | null, extra: Record<string, unknown> = {}) =>
      value ? [{ key, label, value, ...extra }] : [];

    const passJson = {
      formatVersion: 1,
      passTypeIdentifier: apple.passTypeIdentifier,
      teamIdentifier: apple.teamIdentifier,
      organizationName: apple.organizationName,
      serialNumber: pass.serialNumber,
      description: `${l.card} — ${card.name}`,
      logoText: card.companyName ?? 'Kardify',
      backgroundColor: hexToRgb(design.backgroundColor, 'rgb(13, 30, 55)'),
      foregroundColor: hexToRgb(design.textColor, 'rgb(255, 255, 255)'),
      labelColor: hexToRgb(design.primaryColor, 'rgb(0, 106, 254)'),
      voided: card.status !== 'ACTIVE',
      ...(webServiceEnabled
        ? { webServiceURL: `${this.config.apiPublicUrl}/api/wallet/apple`, authenticationToken: this.authToken(pass.serialNumber) }
        : {}),
      barcodes: [{ format: 'PKBarcodeFormatQR', message: `${url}?src=qr`, messageEncoding: 'iso-8859-1', altText: l.scan }],
      generic: {
        primaryFields: field('name', l.name, card.name),
        secondaryFields: [...field('title', l.title, card.jobTitle), ...field('company', l.company, card.companyName)],
        auxiliaryFields: [...field('phone', l.phone, card.phone), ...field('email', l.email, card.email)],
        backFields: [
          ...field('about', l.about, card.description),
          ...field('phone_back', l.phone, card.phone, { dataDetectorTypes: ['PKDataDetectorTypePhoneNumber'] }),
          ...field('email_back', l.email, card.email),
          ...field('website', l.website, card.website, { dataDetectorTypes: ['PKDataDetectorTypeLink'] }),
          ...field('address', l.address, card.address, { dataDetectorTypes: ['PKDataDetectorTypeAddress'] }),
          ...socialLinks.map((s, i) => ({ key: `social_${i}`, label: s.label || s.platform, value: s.url })),
          { key: 'card_url', label: l.card, value: url, dataDetectorTypes: ['PKDataDetectorTypeLink'] },
          { key: 'powered', label: 'Kardify', value: l.poweredBy },
        ],
      },
    };

    const files: Record<string, Buffer> = {
      'pass.json': Buffer.from(JSON.stringify(passJson)),
      ...(await this.icons()),
    };
    const logo = await fetchImageAsPng(card.companyLogo, 100, false);
    if (logo) {
      files['logo.png'] = await sharp(logo).resize(160, 50, { fit: 'inside' }).png().toBuffer();
      files['logo@2x.png'] = await sharp(logo).resize(320, 100, { fit: 'inside' }).png().toBuffer();
    } else {
      files['logo.png'] = (await this.icons())['icon@2x.png'];
      files['logo@2x.png'] = (await this.icons())['icon@3x.png'];
    }
    const photo = await fetchImageAsPng(card.profileImage, 180);
    if (photo) {
      files['thumbnail.png'] = await sharp(photo).resize(90, 90).png().toBuffer();
      files['thumbnail@2x.png'] = photo;
    }

    const pkpass = new PKPass(files, {
      wwdr: readPem(apple.wwdr),
      signerCert: readPem(apple.signerCert),
      signerKey: readPem(apple.signerKey),
      signerKeyPassphrase: apple.signerKeyPassphrase,
    });
    return pkpass.getAsBuffer();
  }

  /** Marks the pass as updated and sends an empty APNs push so devices fetch the new version. */
  async notifyUpdated(cardId: string) {
    const apple = this.config.apple;
    const pass = await this.prisma.walletPass.update({
      where: { cardId_platform: { cardId, platform: 'APPLE' } },
      data: { lastUpdatedAt: new Date() },
      include: { registrations: true },
    });
    if (!apple || pass.registrations.length === 0) return;
    await this.push(apple, pass.registrations.map((r) => r.pushToken));
  }

  private async push(apple: NonNullable<AppConfig['apple']>, tokens: string[]) {
    const client = connect(apple.apnsHost, {
      cert: readPem(apple.signerCert),
      key: readPem(apple.signerKey),
      passphrase: apple.signerKeyPassphrase,
    });
    client.on('error', (err) => this.logger.warn(`APNs connection error: ${err.message}`));
    try {
      await Promise.all(
        [...new Set(tokens)].map(
          (token) =>
            new Promise<void>((resolve) => {
              const req = client.request({
                ':method': 'POST',
                ':path': `/3/device/${token}`,
                'apns-topic': apple.passTypeIdentifier,
                'apns-push-type': 'background',
                'apns-priority': '5',
              });
              req.on('response', (headers) => {
                const status = Number(headers[':status']);
                if (status !== 200) this.logger.warn(`APNs push returned ${status}`);
              });
              req.on('error', () => resolve());
              req.on('close', () => resolve());
              req.end('{}');
            }),
        ),
      );
    } finally {
      client.close();
    }
  }

  private async icons() {
    if (this.iconCache) return this.iconCache;
    const svg = Buffer.from(KARDIFY_MARK_SVG);
    const render = (size: number) => sharp(svg, { density: 600 }).resize(size, size).png().toBuffer();
    this.iconCache = {
      'icon.png': await render(29),
      'icon@2x.png': await render(58),
      'icon@3x.png': await render(87),
    };
    return this.iconCache;
  }
}
