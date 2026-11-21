"use client";

import { Maximize2, Minus, Monitor, Plus, Smartphone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { CvFlow, CvPaged } from "@/components/cv/render/cv-document";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PAGE_W } from "@/lib/cv/paginate";
import type { CvDocument } from "@/lib/cv/types";

/** Real-time A4 preview with zoom, page count and a phone (reflowed) view. */
export function CvPreview({ doc }: { doc: CvDocument }) {
  const t = useTranslations("cvEditor.preview");
  const box = useRef<HTMLDivElement>(null);
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [fit, setFit] = useState(0.6);
  const [zoom, setZoom] = useState<number | null>(null); // null = fit to width
  const [pages, setPages] = useState(1);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setFit(Math.max(0.3, Math.min(1.2, (e.contentRect.width - 32) / PAGE_W))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const z = zoom ?? fit;
  const step = (d: number) => setZoom(Math.max(0.3, Math.min(1.5, Math.round((z + d) * 10) / 10)));

  return (
    <div className="flex min-h-0 flex-col rounded-2xl border border-border bg-card shadow-soft">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2">
        <Tabs value={device} onValueChange={(v) => setDevice(v as typeof device)}>
          <TabsList className="h-8">
            <TabsTrigger value="desktop" className="px-2.5 text-xs"><Monitor /> {t("a4")}</TabsTrigger>
            <TabsTrigger value="mobile" className="px-2.5 text-xs"><Smartphone /> {t("mobile")}</TabsTrigger>
          </TabsList>
        </Tabs>
        {device === "desktop" && (
          <div className="flex items-center gap-1">
            <span className="me-2 text-xs text-muted-foreground tabular-nums">{t("pages", { count: pages })}</span>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => step(-0.1)} aria-label={t("zoomOut")}><Minus /></Button>
            <span className="w-11 text-center text-xs tabular-nums">{Math.round(z * 100)}%</span>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => step(0.1)} aria-label={t("zoomIn")}><Plus /></Button>
            <Button type="button" variant="ghost" size="icon-sm" onClick={() => setZoom(null)} aria-label={t("fit")}><Maximize2 /></Button>
          </div>
        )}
      </div>
      <div ref={box} className="max-h-[calc(100dvh-13rem)] min-h-[420px] overflow-auto bg-[#eef2f8] p-4">
        {device === "desktop" ? (
          <CvPaged doc={doc} zoom={z} onPages={setPages} className="mx-auto w-fit" />
        ) : (
          <div className="mx-auto w-[375px] max-w-full overflow-hidden rounded-[2rem] border-[8px] border-navy bg-white shadow-lifted">
            <CvFlow doc={doc} />
          </div>
        )}
      </div>
    </div>
  );
}
