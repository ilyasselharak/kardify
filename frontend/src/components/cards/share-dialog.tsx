"use client";

import { Check, Copy, Download, Mail, MessageSquare, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { ShareLinks } from "@/lib/api/types";
import { copyText, downloadFromUrl, nativeShare } from "@/lib/public-card";
import { SocialIcon } from "./social-icons";

export interface ShareTargets {
  name: string;
  slug: string;
  links: ShareLinks;
  qrPngUrl: string;
  qrSvgUrl: string;
  qrPreviewUrl: string;
  vcardUrl?: string;
}

function WhatsAppGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.29A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.94L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41" />
    </svg>
  );
}

/** Share dialog: native share, copy, WhatsApp, email, SMS, LinkedIn, X, QR (PNG/SVG) and vCard. */
export function ShareDialog({
  open,
  onOpenChange,
  targets,
  onShared,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targets: ShareTargets;
  onShared?: (channel: string) => void;
}) {
  const t = useTranslations("share");
  const tc = useTranslations("common");
  const [copied, setCopied] = useState(false);
  const { links } = targets;

  const copy = async () => {
    if (await copyText(links.url)) {
      setCopied(true);
      toast.success(tc("copied"));
      onShared?.("copy");
      setTimeout(() => setCopied(false), 1800);
    }
  };

  const download = async (url: string, filename: string) => {
    try {
      await downloadFromUrl(url, filename);
    } catch {
      toast.error(tc("somethingWrong"));
    }
  };

  const channels = [
    { key: "whatsapp", label: t("whatsapp"), href: links.whatsapp, icon: <WhatsAppGlyph />, color: "#25D366" },
    { key: "email", label: t("email"), href: links.email, icon: <Mail className="size-5" />, color: "#006afe" },
    { key: "sms", label: t("sms"), href: links.sms, icon: <MessageSquare className="size-5" />, color: "#12a150" },
    { key: "linkedin", label: t("linkedin"), href: links.linkedin, icon: <SocialIcon platform="linkedin" className="size-5" />, color: "#0a66c2" },
    { key: "x", label: t("x"), href: links.x, icon: <SocialIcon platform="x" className="size-4" />, color: "#000000" },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        <div className="flex gap-2">
          <Input readOnly value={links.url} dir="ltr" className="font-mono text-xs" onFocus={(e) => e.currentTarget.select()} />
          <Button variant="outline" onClick={copy} className="shrink-0">
            {copied ? <Check className="text-success" /> : <Copy />}
            {t("copyLink")}
          </Button>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {channels.map((c) => (
            <a
              key={c.key}
              href={c.href}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => onShared?.(c.key)}
              className="group flex flex-col items-center gap-1.5 rounded-xl p-2 text-center text-[11px] font-medium text-muted-foreground transition hover:bg-muted"
            >
              <span className="flex size-11 items-center justify-center rounded-full text-white shadow-sm transition group-hover:scale-105" style={{ background: c.color }}>
                {c.icon}
              </span>
              {c.label}
            </a>
          ))}
        </div>

        {typeof navigator !== "undefined" && "share" in navigator && (
          <Button
            variant="secondary"
            onClick={async () => {
              if (await nativeShare({ title: targets.name, text: links.message, url: links.url })) onShared?.("native");
            }}
          >
            <Share2 /> {t("native")}
          </Button>
        )}

        <div className="flex items-center gap-4 rounded-2xl border border-border bg-muted/40 p-4">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={targets.qrPreviewUrl} alt={t("qr")} className="size-28 shrink-0 rounded-lg border border-border bg-white p-1" />
          <div className="grid w-full gap-2">
            <p className="text-sm font-medium">{t("qr")}</p>
            <Button size="sm" variant="outline" onClick={() => download(targets.qrPngUrl, `kardify-${targets.slug}.png`)}>
              <Download /> {t("downloadPng")}
            </Button>
            <Button size="sm" variant="outline" onClick={() => download(targets.qrSvgUrl, `kardify-${targets.slug}.svg`)}>
              <Download /> {t("downloadSvg")}
            </Button>
          </div>
        </div>

        {targets.vcardUrl && (
          <Button variant="ghost" onClick={() => download(targets.vcardUrl!, `${targets.slug}.vcf`)}>
            <Download /> {t("downloadVcard")}
          </Button>
        )}
      </DialogContent>
    </Dialog>
  );
}
