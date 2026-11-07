"use client";

import { BarChart3, Contact, Eye, Globe, Mail, MapPin, MessageCircle, Phone, QrCode, Share2, Wallet, AtSign } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import type { ActivityItem, EventType } from "@/lib/api/types";
import { formatRelative } from "@/lib/utils";

export const EVENT_ICONS: Record<EventType, typeof Eye> = {
  VIEW: Eye,
  QR_SCAN: QrCode,
  SHARE: Share2,
  CONTACT_DOWNLOAD: Contact,
  APPLE_WALLET_ADD: Wallet,
  GOOGLE_WALLET_ADD: Wallet,
  WHATSAPP_CLICK: MessageCircle,
  WEBSITE_CLICK: Globe,
  EMAIL_CLICK: Mail,
  PHONE_CLICK: Phone,
  LOCATION_CLICK: MapPin,
  SOCIAL_CLICK: AtSign,
};

export function ActivityList({ items, empty }: { items: ActivityItem[]; empty: string }) {
  const t = useTranslations("analytics");
  const locale = useLocale();
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-10 text-center text-sm text-muted-foreground">
        <BarChart3 className="size-6" />
        {empty}
      </div>
    );
  }
  return (
    <ul className="divide-y divide-border">
      {items.map((a) => {
        const Icon = EVENT_ICONS[a.eventType];
        return (
          <li key={a.id} className="flex items-center gap-3 py-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
              <Icon className="size-4" />
            </span>
            <p className="min-w-0 flex-1 truncate text-sm">
              {t("activityOn", { event: t(`events.${a.eventType}`), card: a.card.name })}
              {a.meta && <span className="text-muted-foreground"> · {a.meta}</span>}
            </p>
            <time className="shrink-0 text-xs text-muted-foreground" dateTime={a.createdAt}>
              {formatRelative(a.createdAt, locale)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
