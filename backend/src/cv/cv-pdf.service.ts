import { Injectable, Logger, type OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { Browser } from 'puppeteer';
import { AppConfig } from '../config/app-config.js';

export const RENDER_TOKEN_AUDIENCE = 'cv-render';
const MAX_CONCURRENT = 2;
const IDLE_CLOSE_MS = 90_000;
const CACHE_ENTRIES = 24;
/** Hosts the renderer may load besides the web app itself (uploaded images). */
const EXTRA_ALLOWED_HOSTS = new Set(['res.cloudinary.com']);

/**
 * Renders CVs to PDF with headless Chromium. The browser opens the web app's print route, which
 * draws the exact same paginated A4 pages as the editor preview, so the PDF matches it.
 * Text stays selectable, fonts are embedded and links stay clickable.
 */
@Injectable()
export class CvPdfService implements OnModuleDestroy {
  private readonly logger = new Logger(CvPdfService.name);
  private browser?: Promise<Browser>;
  private idleTimer?: NodeJS.Timeout;
  private active = 0;
  private readonly waiters: (() => void)[] = [];
  /** Small LRU: (cv id + content version) → PDF bytes. */
  private readonly cache = new Map<string, Buffer>();

  constructor(
    private readonly config: AppConfig,
    private readonly jwt: JwtService,
  ) {}

  get enabled() {
    return this.config.pdfEnabled;
  }

  /** Short-lived token that lets the print page read one CV, whatever its visibility. */
  createRenderToken(cvId: string) {
    return this.jwt.signAsync({ cv: cvId }, { audience: RENDER_TOKEN_AUDIENCE, expiresIn: 120 });
  }

  async verifyRenderToken(token: string): Promise<string | null> {
    try {
      const payload = await this.jwt.verifyAsync<{ cv?: string }>(token, { audience: RENDER_TOKEN_AUDIENCE });
      return typeof payload.cv === 'string' ? payload.cv : null;
    } catch {
      return null;
    }
  }

  async render(cvId: string, version: string, language: 'en' | 'ar'): Promise<Buffer> {
    if (!this.enabled) throw new ServiceUnavailableException({ code: 'PDF_DISABLED', message: 'PDF export is not available' });
    const key = `${cvId}:${version}:${language}`;
    const hit = this.cache.get(key);
    if (hit) {
      this.cache.delete(key);
      this.cache.set(key, hit);
      return hit;
    }

    await this.acquire();
    try {
      const pdf = await this.renderWithBrowser(cvId, language);
      this.cache.set(key, pdf);
      while (this.cache.size > CACHE_ENTRIES) this.cache.delete(this.cache.keys().next().value!);
      return pdf;
    } catch (err) {
      this.logger.error(`PDF render failed for ${cvId}: ${(err as Error).message}`);
      throw new ServiceUnavailableException({ code: 'PDF_FAILED', message: 'Could not generate the PDF. Please try again.' });
    } finally {
      this.release();
    }
  }

  private async renderWithBrowser(cvId: string, language: 'en' | 'ar') {
    const browser = await this.getBrowser();
    const page = await browser.newPage();
    try {
      const origin = new URL(this.config.frontendInternalUrl).origin;
      // Only the web app and uploaded images may load: user-supplied URLs can never make the
      // server fetch internal addresses (SSRF).
      await page.setRequestInterception(true);
      page.on('request', (req) => {
        const url = req.url();
        if (url.startsWith('data:') || url.startsWith('blob:')) return void req.continue();
        try {
          const u = new URL(url);
          if (u.origin === origin || (u.protocol === 'https:' && EXTRA_ALLOWED_HOSTS.has(u.hostname))) return void req.continue();
        } catch {
          /* fall through */
        }
        void req.abort('blockedbyclient');
      });
      const token = await this.createRenderToken(cvId);
      await page.goto(`${origin}/${language}/cv-print?token=${encodeURIComponent(token)}`, { waitUntil: 'networkidle0', timeout: 30_000 });
      const state = await page.waitForSelector('[data-cv-ready]', { timeout: 20_000 }).then((el) => el?.evaluate((n) => n.getAttribute('data-cv-ready')));
      if (state !== 'true') throw new Error(`print page state: ${state}`);
      await page.evaluate(() => document.fonts.ready.then(() => true));
      const pdf = await page.pdf({ printBackground: true, preferCSSPageSize: true, format: 'A4', margin: { top: 0, right: 0, bottom: 0, left: 0 } });
      return Buffer.from(pdf);
    } finally {
      await page.close().catch(() => undefined);
    }
  }

  private getBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = import('puppeteer')
        .then(({ default: puppeteer }) =>
          puppeteer.launch({
            headless: true,
            executablePath: this.config.chromeExecutablePath,
            args: [
              '--disable-dev-shm-usage',
              '--font-render-hinting=none',
              // Chromium's sandbox cannot start as root or in most containers. The renderer only
              // loads this web app and uploaded images (see request interception), never user URLs.
              ...(this.config.chromeDisableSandbox ? ['--no-sandbox', '--disable-setuid-sandbox'] : []),
            ],
          }),
        )
        .then((b) => {
          b.on('disconnected', () => (this.browser = undefined));
          return b;
        })
        .catch((err: Error) => {
          this.browser = undefined;
          throw err;
        });
    }
    return this.browser;
  }

  private async acquire() {
    clearTimeout(this.idleTimer);
    if (this.active < MAX_CONCURRENT) {
      this.active++;
      return;
    }
    await new Promise<void>((resolve) => this.waiters.push(resolve));
    this.active++;
  }

  private release() {
    this.active--;
    const next = this.waiters.shift();
    if (next) return next();
    if (this.active === 0) {
      // Free Chromium's memory when idle (important on small instances).
      this.idleTimer = setTimeout(() => void this.closeBrowser(), IDLE_CLOSE_MS);
      this.idleTimer.unref?.();
    }
  }

  private async closeBrowser() {
    const b = this.browser;
    this.browser = undefined;
    if (b) await (await b.catch(() => undefined))?.close().catch(() => undefined);
  }

  async onModuleDestroy() {
    clearTimeout(this.idleTimer);
    await this.closeBrowser();
  }
}

/** ASCII-safe file name plus an RFC 5987 UTF-8 variant. */
export function pdfDisposition(name: string, download: boolean) {
  const ascii = (name.normalize('NFKD').replace(/[^\w\s-]/g, '').trim().replace(/\s+/g, '-') || 'cv').slice(0, 80);
  return `${download ? 'attachment' : 'inline'}; filename="${ascii}.pdf"; filename*=UTF-8''${encodeURIComponent(`${name || 'cv'}.pdf`)}`;
}
