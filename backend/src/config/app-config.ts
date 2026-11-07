import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Typed accessors for every environment variable used by the API.
 * Secrets never leave the backend: nothing here is ever serialised to clients.
 */
@Injectable()
export class AppConfig {
  constructor(private readonly config: ConfigService) {}

  private get(key: string, fallback?: string): string {
    const value = this.config.get<string>(key);
    if (value === undefined || value === '') {
      if (fallback !== undefined) return fallback;
      throw new Error(`Missing required environment variable ${key}`);
    }
    return value;
  }

  private optional(key: string): string | undefined {
    const value = this.config.get<string>(key);
    return value === undefined || value === '' ? undefined : value;
  }

  get nodeEnv() {
    return this.get('NODE_ENV', 'development');
  }
  get isProduction() {
    return this.nodeEnv === 'production';
  }
  get port() {
    return Number(this.get('PORT', '4000'));
  }
  /** Public origin of the Next.js frontend, e.g. https://kardify.com */
  get frontendUrl() {
    return this.get('FRONTEND_URL', 'http://localhost:3000').replace(/\/$/, '');
  }
  /** Public origin of this API as seen from the internet (used by Apple Wallet web service). */
  get apiPublicUrl() {
    return this.get('API_PUBLIC_URL', 'http://localhost:4000').replace(/\/$/, '');
  }
  get corsOrigins(): string[] {
    return this.get('CORS_ORIGINS', this.frontendUrl)
      .split(',')
      .map((o) => o.trim())
      .filter(Boolean);
  }

  get jwtSecret() {
    return this.get('JWT_SECRET', this.isProduction ? undefined : 'dev-only-insecure-jwt-secret-change-me');
  }
  get cookieDomain() {
    return this.optional('COOKIE_DOMAIN');
  }
  get sessionTtlHours() {
    return Number(this.get('SESSION_TTL_HOURS', '24'));
  }
  get rememberMeTtlDays() {
    return Number(this.get('REMEMBER_ME_TTL_DAYS', '30'));
  }

  get redisUrl() {
    return this.optional('REDIS_URL');
  }

  get resendApiKey() {
    return this.optional('RESEND_API_KEY');
  }
  get emailFrom() {
    return this.get('EMAIL_FROM', 'Kardify <no-reply@kardify.com>');
  }

  get cloudinary() {
    const cloudName = this.optional('CLOUDINARY_CLOUD_NAME');
    const apiKey = this.optional('CLOUDINARY_API_KEY');
    const apiSecret = this.optional('CLOUDINARY_API_SECRET');
    if (!cloudName || !apiKey || !apiSecret) return undefined;
    return { cloudName, apiKey, apiSecret, folder: this.get('CLOUDINARY_FOLDER', 'kardify') };
  }

  get apple() {
    const passTypeIdentifier = this.optional('APPLE_PASS_TYPE_ID');
    const teamIdentifier = this.optional('APPLE_TEAM_ID');
    const wwdr = this.optional('APPLE_WWDR_CERT');
    const signerCert = this.optional('APPLE_SIGNER_CERT');
    const signerKey = this.optional('APPLE_SIGNER_KEY');
    if (!passTypeIdentifier || !teamIdentifier || !wwdr || !signerCert || !signerKey) return undefined;
    return {
      passTypeIdentifier,
      teamIdentifier,
      wwdr,
      signerCert,
      signerKey,
      signerKeyPassphrase: this.optional('APPLE_SIGNER_KEY_PASSPHRASE'),
      organizationName: this.get('APPLE_ORGANIZATION_NAME', 'Kardify'),
      apnsHost: this.get('APPLE_APNS_HOST', 'https://api.push.apple.com'),
    };
  }

  get google() {
    const issuerId = this.optional('GOOGLE_WALLET_ISSUER_ID');
    const clientEmail = this.optional('GOOGLE_WALLET_SERVICE_ACCOUNT_EMAIL');
    const privateKey = this.optional('GOOGLE_WALLET_SERVICE_ACCOUNT_PRIVATE_KEY');
    if (!issuerId || !clientEmail || !privateKey) return undefined;
    return {
      issuerId,
      clientEmail,
      // Allow "\n" escaped keys in .env files
      privateKey: privateKey.replace(/\\n/g, '\n'),
      classSuffix: this.get('GOOGLE_WALLET_CLASS_SUFFIX', 'kardify_business_card_v1'),
      origins: this.corsOrigins,
    };
  }
}
