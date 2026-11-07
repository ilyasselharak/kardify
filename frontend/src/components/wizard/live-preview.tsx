"use client";

import { Monitor, RotateCcw, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FlippableCard } from "@/components/cards/business-card";
import { PublicCardView } from "@/components/public-card/public-card-view";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formValuesToPreview } from "@/lib/card-form";
import type { CardFormValues } from "@/lib/validation/card";
import { cn } from "@/lib/utils";

/** Real-time preview: desktop (flippable card) and mobile (public page inside a phone frame). */
export function LivePreview({ values, url, publicId, slug }: { values: CardFormValues; url?: string; publicId?: string; slug?: string }) {
  const t = useTranslations("wizard.design");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [side, setSide] = useState<"front" | "back">("front");
  const card = formValuesToPreview(values);

  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-soft">
      <div className="mb-4 flex items-center justify-between gap-2">
        <span className="text-sm font-semibold">{t("preview")}</span>
        <Tabs value={device} onValueChange={(v) => setDevice(v as typeof device)}>
          <TabsList className="h-9">
            <TabsTrigger value="desktop" className="px-2.5 text-xs"><Monitor /> {t("desktop")}</TabsTrigger>
            <TabsTrigger value="mobile" className="px-2.5 text-xs"><Smartphone /> {t("mobile")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {device === "desktop" ? (
        <div className="rounded-xl bg-[radial-gradient(circle_at_top,#eaf2ff,transparent_70%)] px-4 py-8">
          <FlippableCard card={card} url={url} side={side} className="mx-auto max-w-[460px]" />
          <div className="mt-6 flex items-center justify-center gap-2">
            <Tabs value={side} onValueChange={(v) => setSide(v as typeof side)}>
              <TabsList className="h-9">
                <TabsTrigger value="front" className="px-4 text-xs">{t("front")}</TabsTrigger>
                <TabsTrigger value="back" className="px-4 text-xs">{t("back")}</TabsTrigger>
              </TabsList>
            </Tabs>
            <Button type="button" variant="outline" size="icon-sm" onClick={() => setSide((s) => (s === "front" ? "back" : "front"))} aria-label={t("flip")}>
              <RotateCcw />
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex justify-center py-2">
          <div className="relative h-[620px] w-[310px] overflow-hidden rounded-[2.6rem] border-[10px] border-navy bg-background shadow-lifted">
            <div className="absolute start-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-navy rtl:translate-x-1/2" />
            <div className={cn("h-full overflow-y-auto pt-6 [scrollbar-width:none]")}>
              <PublicCardView
                mode="preview"
                card={{ ...card, slug: slug ?? "preview", publicId: publicId ?? "preview", url: url ?? "https://kardify.com/card/preview", language: values.language } as never}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
