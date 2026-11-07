import { createHmac, timingSafeEqual } from 'node:crypto';

/** Accepts PEM content (with literal "\n" escapes allowed) or base64-encoded PEM. */
export function readPem(value: string): string {
  const unescaped = value.replace(/\\n/g, '\n').trim();
  if (unescaped.startsWith('-----BEGIN')) return unescaped;
  return Buffer.from(value, 'base64').toString('utf8');
}

export function hexToRgb(hex: string | undefined, fallback = 'rgb(13, 30, 55)'): string {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex ?? '');
  if (!m) return fallback;
  return `rgb(${parseInt(m[1], 16)}, ${parseInt(m[2], 16)}, ${parseInt(m[3], 16)})`;
}

/** Deterministic per-pass auth token so it never needs to be stored in plaintext. */
export function passAuthToken(secret: string, serial: string): string {
  return createHmac('sha256', secret).update(`apple-pass:${serial}`).digest('hex');
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

export interface WalletCardDesign {
  backgroundColor?: string;
  textColor?: string;
  primaryColor?: string;
}
