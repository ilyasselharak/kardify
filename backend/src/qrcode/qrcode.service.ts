import { Injectable } from '@nestjs/common';
import QRCode from 'qrcode';
import sharp from 'sharp';
import { BRAND, KARDIFY_MARK_SVG } from '../assets/brand.js';
import { fetchImageAsPng } from '../common/utils/remote-image.js';

export interface QrOptions {
  fgColor?: string;
  bgColor?: string;
  logo?: 'none' | 'kardify' | 'company';
  companyLogoUrl?: string | null;
}

const HEX = /^#[0-9a-fA-F]{6}$/;

@Injectable()
export class QrCodeService {
  /** Adds ?src=qr so scans can be distinguished from regular visits. */
  scanUrl(publicUrl: string) {
    return `${publicUrl}?src=qr`;
  }

  async svg(text: string, opts: QrOptions = {}): Promise<string> {
    const dark = HEX.test(opts.fgColor ?? '') ? opts.fgColor! : BRAND.navy;
    const light = HEX.test(opts.bgColor ?? '') ? opts.bgColor! : BRAND.white;
    const logo = opts.logo ?? 'kardify';
    const svg = await QRCode.toString(text, {
      type: 'svg',
      // High error correction tolerates the centre logo covering modules.
      errorCorrectionLevel: logo === 'none' ? 'M' : 'H',
      margin: 2,
      color: { dark, light },
    });
    if (logo === 'none') return svg;

    const viewBox = /viewBox="0 0 (\d+) (\d+)"/.exec(svg);
    const size = viewBox ? Number(viewBox[1]) : 33;
    const logoSize = size * 0.22;
    const pad = size * 0.03;
    const pos = (size - logoSize) / 2;
    const href = await this.logoDataUri(logo, opts.companyLogoUrl);
    const overlay =
      `<rect x="${pos - pad}" y="${pos - pad}" width="${logoSize + pad * 2}" height="${logoSize + pad * 2}" rx="${pad * 2}" fill="${light}"/>` +
      `<image href="${href}" x="${pos}" y="${pos}" width="${logoSize}" height="${logoSize}" preserveAspectRatio="xMidYMid meet"/>`;
    return svg.replace('</svg>', `${overlay}</svg>`);
  }

  async png(text: string, size: number, opts: QrOptions = {}): Promise<Buffer> {
    const svg = await this.svg(text, opts);
    return sharp(Buffer.from(svg), { density: 300 }).resize(size, size).png().toBuffer();
  }

  private async logoDataUri(logo: 'kardify' | 'company', companyLogoUrl?: string | null) {
    if (logo === 'company') {
      const png = await fetchImageAsPng(companyLogoUrl, 256, false);
      if (png) return `data:image/png;base64,${png.toString('base64')}`;
    }
    return `data:image/svg+xml;base64,${Buffer.from(KARDIFY_MARK_SVG).toString('base64')}`;
  }
}
