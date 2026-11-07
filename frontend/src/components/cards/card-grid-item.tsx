"use client";

import { Eye } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import type { BusinessCard } from "@/lib/api/types";
import { formatDate } from "@/lib/utils";
import { BusinessCardFront } from "./business-card";
import { CardActionsMenu } from "./card-actions";
import { StatusBadge } from "./status-badge";

export function CardGridItem({ card }: { card: BusinessCard }) {
  const t = useTranslations("cards");
  const locale = useLocale();
  return (
    <article className="group flex flex-col rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lifted">
      <Link href={`/dashboard/cards/${card.id}`} className="block rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
        <BusinessCardFront card={card} className="shadow-md" />
      </Link>
      <div className="mt-4 flex items-start justify-between gap-2">
        <div className="min-w-0">
          <Link href={`/dashboard/cards/${card.id}`} className="block truncate font-semibold hover:text-primary" dir="auto">{card.name}</Link>
          <p className="truncate text-sm text-muted-foreground" dir="auto">
            {[card.jobTitle, card.companyName].filter(Boolean).join(" · ") || "—"}
          </p>
        </div>
        <CardActionsMenu card={card} />
      </div>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-border pt-3 text-xs text-muted-foreground">
        <StatusBadge status={card.status} />
        <span className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Eye className="size-3.5" /> {t("views", { count: card.views ?? 0 })}</span>
          <span>{formatDate(card.updatedAt, locale, { month: "short", day: "numeric" })}</span>
        </span>
      </div>
    </article>
  );
}
