"use client";

import { useTranslations } from "next-intl";
import type { EventCounts, EventType } from "@/lib/api/types";
import { EVENT_ICONS } from "./activity-list";

const ORDER: EventType[] = [
  "QR_SCAN", "SHARE", "CONTACT_DOWNLOAD", "APPLE_WALLET_ADD", "GOOGLE_WALLET_ADD",
  "WHATSAPP_CLICK", "WEBSITE_CLICK", "EMAIL_CLICK", "PHONE_CLICK", "LOCATION_CLICK", "SOCIAL_CLICK",
];

/** Magnitude per engagement type: one hue, sorted, value labels in text ink (doubles as the table view). */
export function EngagementBars({ totals }: { totals: EventCounts }) {
  const t = useTranslations("analytics");
  const rows = ORDER.map((type) => ({ type, value: totals[type] ?? 0 })).sort((a, b) => b.value - a.value);
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <ul className="grid gap-3">
      {rows.map(({ type, value }) => {
        const Icon = EVENT_ICONS[type];
        return (
          <li key={type} className="group grid grid-cols-[minmax(0,10rem)_1fr_3rem] items-center gap-3 text-sm" title={`${t(`events.${type}`)}: ${value}`}>
            <span className="flex min-w-0 items-center gap-2 text-muted-foreground">
              <Icon className="size-4 shrink-0" />
              <span className="truncate">{t(`events.${type}`)}</span>
            </span>
            <span className="h-2.5 overflow-hidden rounded-full bg-muted">
              <span
                className="block h-full rounded-full bg-primary transition-all duration-500 group-hover:bg-primary/80"
                style={{ width: `${(value / max) * 100}%`, minWidth: value > 0 ? 6 : 0 }}
              />
            </span>
            <span className="text-end font-semibold tabular-nums">{value}</span>
          </li>
        );
      })}
    </ul>
  );
}
