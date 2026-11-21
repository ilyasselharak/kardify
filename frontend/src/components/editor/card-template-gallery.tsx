"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo, useMemo, useState } from "react";
import { BusinessCardFront, type CardPreviewData } from "@/components/cards/business-card";
import { TEMPLATE_CATEGORY, templateDesign } from "@/lib/design/templates";
import { TEMPLATE_CATEGORIES, TEMPLATE_IDS, type TemplateCategory, type TemplateId } from "@/lib/design/types";
import { cn } from "@/lib/utils";

export type SampleCard = Omit<CardPreviewData, "designSettings">;

const Thumb = memo(function Thumb({ id, sample }: { id: TemplateId; sample: SampleCard }) {
  return <BusinessCardFront card={{ ...sample, designSettings: templateDesign(id) }} className="pointer-events-none shadow-sm" />;
});

/** Category chips + template thumbnails rendered with the user's own details. */
export function CardTemplateGallery({ value, onSelect, sample, columns = 2, className }: {
  value?: TemplateId;
  onSelect: (id: TemplateId) => void;
  sample: SampleCard;
  columns?: 2 | 3 | 4;
  className?: string;
}) {
  const t = useTranslations("templates");
  const [category, setCategory] = useState<TemplateCategory | "all">("all");
  const ids = useMemo(() => TEMPLATE_IDS.filter((id) => category === "all" || TEMPLATE_CATEGORY[id] === category), [category]);
  // Only re-render thumbnails when the visible identity fields change.
  const stableSample = useMemo(
    () => sample,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sample.name, sample.jobTitle, sample.companyName, sample.profileImage, sample.companyLogo, sample.email, sample.phone, sample.website],
  );

  return (
    <div className={cn("grid gap-3", className)}>
      <div role="tablist" aria-label={t("categoriesLabel")} className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:thin]">
        {(["all", ...TEMPLATE_CATEGORIES] as const).map((c) => (
          <button
            key={c}
            type="button"
            role="tab"
            aria-selected={category === c}
            onClick={() => setCategory(c)}
            className={cn(
              "shrink-0 rounded-full border px-3 py-1 text-xs font-medium whitespace-nowrap transition",
              category === c ? "border-primary bg-primary text-white" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
            )}
          >
            {t(`categories.${c}`)}
          </button>
        ))}
      </div>
      <div className={cn("grid gap-3", { 2: "grid-cols-2", 3: "grid-cols-2 md:grid-cols-3", 4: "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" }[columns])}>
        {ids.map((id) => {
          const active = value === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onSelect(id)}
              aria-pressed={active}
              className={cn("group relative grid min-w-0 gap-1.5 rounded-xl p-1.5 text-start text-xs font-medium transition", active ? "bg-primary/5 ring-2 ring-primary" : "hover:bg-muted")}
            >
              <Thumb id={id} sample={stableSample} />
              <span className="flex min-w-0 items-center justify-between gap-2 px-0.5">
                <span className={cn("shrink-0", active ? "text-primary" : "text-foreground")}>{t(`cardNames.${id}`)}</span>
                <span className="min-w-0 truncate text-[11px] font-normal text-muted-foreground">{t(`categories.${TEMPLATE_CATEGORY[id]}`)}</span>
              </span>
              {active && (
                <span className="absolute end-2.5 top-2.5 flex size-5 items-center justify-center rounded-full bg-primary text-white shadow">
                  <Check className="size-3" />
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
