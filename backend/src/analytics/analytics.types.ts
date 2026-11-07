import type { AnalyticsEventType } from '../generated/prisma/client.js';

export const ANALYTICS_RANGES = ['7d', '30d', '90d', 'all'] as const;
export type AnalyticsRange = (typeof ANALYTICS_RANGES)[number];

/** Events the browser may report. Downloads and wallet additions are recorded server-side. */
export const CLIENT_EVENTS = [
  'VIEW', 'QR_SCAN', 'SHARE', 'WHATSAPP_CLICK', 'WEBSITE_CLICK', 'EMAIL_CLICK', 'PHONE_CLICK', 'LOCATION_CLICK', 'SOCIAL_CLICK',
] as const satisfies readonly AnalyticsEventType[];

/** Seconds during which the same visitor repeating the same event on a card is ignored. */
export const DEDUPE_WINDOW_SECONDS: Partial<Record<AnalyticsEventType, number>> = {
  VIEW: 30 * 60,
  QR_SCAN: 30 * 60,
  CONTACT_DOWNLOAD: 30 * 60,
  APPLE_WALLET_ADD: 24 * 60 * 60,
  GOOGLE_WALLET_ADD: 24 * 60 * 60,
};
export const DEFAULT_DEDUPE_SECONDS = 10;

export function rangeStart(range: AnalyticsRange, now = new Date()): Date | undefined {
  if (range === 'all') return undefined;
  const days = Number(range.replace('d', ''));
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d;
}
