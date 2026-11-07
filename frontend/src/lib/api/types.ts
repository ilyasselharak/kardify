import type { DesignSettings } from "@/lib/design/types";

export type Locale = "en" | "ar";
export type CardStatus = "DRAFT" | "ACTIVE" | "INACTIVE";
export type Role = "USER" | "ADMIN";

export interface UserPreferences {
  defaultCardLanguage?: Locale;
  defaultTemplate?: string;
  defaultPrimaryColor?: string;
  defaultBackgroundColor?: string;
  defaultTextColor?: string;
  notifications?: { productUpdates?: boolean; weeklySummary?: boolean; securityAlerts?: boolean };
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  profileImage: string | null;
  preferredLanguage: Locale;
  role: Role;
  preferences: UserPreferences;
  createdAt: string;
}

export const SOCIAL_PLATFORMS = ["linkedin", "instagram", "facebook", "x", "tiktok", "youtube", "github", "custom"] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

export interface SocialLink {
  platform: SocialPlatform;
  url: string;
  visible?: boolean;
  label?: string;
}

export interface QrSettings {
  fgColor?: string;
  bgColor?: string;
  logo?: "none" | "kardify" | "company";
}

export interface CardFields {
  name: string;
  jobTitle: string | null;
  companyName: string | null;
  description: string | null;
  profileImage: string | null;
  companyLogo: string | null;
  email: string | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  address: string | null;
  mapsUrl: string | null;
  socialLinks: SocialLink[];
  designSettings: DesignSettings;
  language: Locale;
}

export interface BusinessCard extends CardFields {
  id: string;
  slug: string;
  publicId: string;
  publicUrl: string;
  status: CardStatus;
  qrSettings: QrSettings;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
  views?: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ShareLinks {
  url: string;
  message: string;
  whatsapp: string;
  email: string;
  sms: string;
  linkedin: string;
  x: string;
}

export interface PublicCard extends Omit<CardFields, "designSettings"> {
  slug: string;
  publicId: string;
  url: string;
  designSettings: DesignSettings;
  updatedAt: string;
  shareLinks: ShareLinks;
}

export const EVENT_TYPES = [
  "VIEW", "QR_SCAN", "SHARE", "CONTACT_DOWNLOAD", "APPLE_WALLET_ADD", "GOOGLE_WALLET_ADD",
  "WHATSAPP_CLICK", "WEBSITE_CLICK", "EMAIL_CLICK", "PHONE_CLICK", "LOCATION_CLICK", "SOCIAL_CLICK",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];
export type AnalyticsRange = "7d" | "30d" | "90d" | "all";

export type EventCounts = Record<EventType, number>;

export interface SeriesPoint {
  date: string;
  views: number;
  scans: number;
  visitors: number;
  interactions: number;
}

export interface ActivityItem {
  id: string;
  eventType: EventType;
  meta: string | null;
  createdAt: string;
  card: { id: string; name: string };
}

export interface AnalyticsOverview {
  range: AnalyticsRange;
  totals: EventCounts & { cards: number; activeCards: number; uniqueVisitors: number };
  series: SeriesPoint[];
  topCards: { id: string; name: string; jobTitle: string | null; companyName: string | null; profileImage: string | null; status: CardStatus; views: number }[];
  recentActivity: ActivityItem[];
}

export interface CardAnalytics {
  range: AnalyticsRange;
  card: { id: string; name: string; slug: string; status: CardStatus };
  totals: EventCounts & { uniqueVisitors: number };
  series: SeriesPoint[];
  socialClicks: { platform: string; count: number }[];
  topReferrers: { referrer: string; count: number }[];
  recentActivity: ActivityItem[];
}

export interface SessionInfo {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  lastUsedAt: string;
  expiresAt: string;
  current: boolean;
}

export interface Features {
  appleWallet: boolean;
  googleWallet: boolean;
  uploads: boolean;
  email: boolean;
}

// ───────────── Admin ─────────────

export interface AdminUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  profileImage: string | null;
  preferredLanguage: Locale;
  role: Role;
  suspendedAt: string | null;
  createdAt: string;
  updatedAt: string;
  cardsCount?: number;
}

export interface AdminUserDetail extends AdminUser {
  failedLoginAttempts: number;
  lockedUntil: string | null;
  totalViews: number;
  cards: { id: string; name: string; slug: string; status: CardStatus; jobTitle: string | null; companyName: string | null; createdAt: string; updatedAt: string }[];
  sessions: { id: string; userAgent: string | null; ipAddress: string | null; createdAt: string; lastUsedAt: string }[];
}

export interface AdminCard {
  id: string;
  name: string;
  slug: string;
  status: CardStatus;
  jobTitle: string | null;
  companyName: string | null;
  profileImage: string | null;
  createdAt: string;
  updatedAt: string;
  views: number;
  publicUrl: string;
  user: { id: string; email: string; firstName: string; lastName: string };
}

export interface AdminStats {
  users: { total: number; admins: number; verified: number; suspended: number; new30d: number };
  cards: { total: number; active: number };
  engagement: { events30d: number; views30d: number };
  wallet: { apple: number; google: number };
  activeSessions: number;
  signups: { date: string; count: number }[];
  recentUsers: AdminUser[];
}

export interface AuditLogEntry {
  id: string;
  adminId: string | null;
  adminEmail: string;
  action: string;
  targetType: string;
  targetId: string | null;
  meta: Record<string, unknown>;
  createdAt: string;
}
