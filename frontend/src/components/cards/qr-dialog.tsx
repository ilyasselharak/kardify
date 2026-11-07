"use client";

import { Download, RefreshCw } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BusinessCard, QrSettings } from "@/lib/api/types";
import { useUpdateQrSettings } from "@/lib/hooks/use-cards";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { downloadFromUrl, ownerQrUrl } from "@/lib/public-card";
import { ColorInput } from "@/components/wizard/color-input";

/** QR preview + customisation (colours, centre logo) + PNG/SVG download. */
export function QrPanel({ card }: { card: BusinessCard }) {
  const t = useTranslations("qr");
  const tc = useTranslations("common");
  const errorMessage = useErrorMessage();
  const save = useUpdateQrSettings();
  const [settings, setSettings] = useState<Required<QrSettings>>({
    fgColor: card.qrSettings?.fgColor ?? "#0d1e37",
    bgColor: card.qrSettings?.bgColor ?? "#ffffff",
    logo: card.qrSettings?.logo ?? "kardify",
  });
  const [debounced, setDebounced] = useState(settings);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(settings), 300);
    return () => clearTimeout(id);
  }, [settings]);

  const query = { ...debounced, v: card.slug };
  const download = async (format: "png" | "svg") => {
    try {
      await downloadFromUrl(ownerQrUrl(card.id, { ...settings, format, size: 2048, download: 1 }), `kardify-${card.slug}.${format}`);
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  return (
    <div className="@container">
    <div className="grid gap-5 @lg:grid-cols-[220px_1fr]">
      <div className="mx-auto flex aspect-square w-full max-w-[240px] items-center justify-center rounded-2xl border border-border p-3" style={{ background: settings.bgColor }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={ownerQrUrl(card.id, { ...query, format: "svg" })} alt={t("title")} className="size-full" />
      </div>
      <div className="grid content-start gap-4">
        <div className="grid grid-cols-2 gap-3">
          <ColorInput id="qr-fg" label={t("foreground")} value={settings.fgColor} onChange={(fgColor) => setSettings((s) => ({ ...s, fgColor }))} />
          <ColorInput id="qr-bg" label={t("background")} value={settings.bgColor} onChange={(bgColor) => setSettings((s) => ({ ...s, bgColor }))} />
        </div>
        <div className="grid gap-2">
          <Label>{t("logo")}</Label>
          <Tabs value={settings.logo} onValueChange={(logo) => setSettings((s) => ({ ...s, logo: logo as QrSettings["logo"] & string }))}>
            <TabsList className="w-full">
              <TabsTrigger value="none">{t("logoNone")}</TabsTrigger>
              <TabsTrigger value="kardify">{t("logoKardify")}</TabsTrigger>
              <TabsTrigger value="company" disabled={!card.companyLogo}>{t("logoCompany")}</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={() => download("png")}><Download /> {t("png")}</Button>
          <Button variant="outline" size="sm" onClick={() => download("svg")}><Download /> {t("svg")}</Button>
          <Button
            size="sm"
            variant="secondary"
            loading={save.isPending}
            onClick={() =>
              save.mutate({ id: card.id, data: settings }, { onSuccess: () => toast.success(t("styleSaved")), onError: (e) => toast.error(errorMessage(e)) })
            }
          >
            <RefreshCw /> {t("saveStyle")}
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
      </div>
      <span className="sr-only">{tc("download")}</span>
    </div>
    </div>
  );
}

export function QrDialog({ card, open, onOpenChange }: { card: BusinessCard; open: boolean; onOpenChange: (o: boolean) => void }) {
  const t = useTranslations("qr");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{card.name}</DialogDescription>
        </DialogHeader>
        <QrPanel card={card} />
      </DialogContent>
    </Dialog>
  );
}
