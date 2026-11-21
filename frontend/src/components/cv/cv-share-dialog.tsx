"use client";

import { Check, Copy, Download, ExternalLink, Eye, Globe, Link2, Lock, Mail, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { SocialIcon } from "@/components/cards/social-icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Link } from "@/i18n/navigation";
import { cvShareLinks } from "@/lib/cv/share";
import type { CvPublicLink, CvVisibility } from "@/lib/cv/types";
import { checkSlug, useUpdateCvSharing } from "@/lib/hooks/use-cv";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { copyText, nativeShare } from "@/lib/public-card";
import { qrDataUrl } from "@/lib/qr";
import { cn } from "@/lib/utils";

export interface ShareableCv {
  id: string;
  title: string;
  visibility: CvVisibility;
  allowDownload: boolean;
  publicLink: CvPublicLink | null;
  isPublic: boolean;
}

const SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,58})[a-z0-9]$/;

/** Visibility, public link (custom slug, on/off), PDF downloads, QR code and share targets. */
export function CvShareDialog({ cv, name, open, onOpenChange, onChange }: {
  cv: ShareableCv;
  name: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onChange?: (cv: ShareableCv) => void;
}) {
  const t = useTranslations("cvShare");
  const errorMessage = useErrorMessage();
  const update = useUpdateCvSharing();
  // null = not edited, show the saved slug.
  const [slugDraft, setSlugDraft] = useState<string | null>(null);
  const [checked, setChecked] = useState<{ slug: string; result: "ok" | "taken" | "invalid" | "idle" } | null>(null);
  const savedSlug = cv.publicLink?.slug ?? "";
  const slug = slugDraft ?? savedSlug;
  const slugState: "idle" | "checking" | "ok" | "taken" | "invalid" =
    !slug || slug === savedSlug ? "idle" : !SLUG_RE.test(slug) ? "invalid" : checked?.slug === slug ? checked.result : "checking";
  const [qr, setQr] = useState<string>();
  const [copied, setCopied] = useState(false);
  const url = cv.publicLink?.url;

  useEffect(() => {
    if (!url || !open) return;
    let active = true;
    void qrDataUrl(url).then((d) => active && setQr(d));
    return () => {
      active = false;
    };
  }, [url, open]);

  // Live availability check for a custom link (debounced).
  useEffect(() => {
    if (slugState !== "checking") return;
    const timer = setTimeout(() => {
      checkSlug(cv.id, slug)
        .then((r) => setChecked({ slug, result: !r.valid ? "invalid" : r.available ? "ok" : "taken" }))
        .catch(() => setChecked({ slug, result: "idle" }));
    }, 350);
    return () => clearTimeout(timer);
  }, [slug, slugState, cv.id]);

  const save = (data: Parameters<typeof update.mutate>[0]["data"], success?: string) =>
    update.mutate(
      { id: cv.id, data },
      {
        onSuccess: (next) => {
          if (next) onChange?.(next);
          if (data.slug) setSlugDraft(null);
          if (success) toast.success(success);
        },
        onError: (e) => toast.error(errorMessage(e)),
      },
    );

  const visibilities: { value: CvVisibility; icon: typeof Lock }[] = [
    { value: "PRIVATE", icon: Lock },
    { value: "UNLISTED", icon: Link2 },
    { value: "PUBLIC", icon: Globe },
  ];
  const links = url ? cvShareLinks(url, name) : null;
  const reachable = cv.isPublic;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] max-w-lg overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{t("title")}</DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        <div role="radiogroup" aria-label={t("visibility")} className="grid gap-2">
          {visibilities.map(({ value, icon: Icon }) => {
            const active = cv.visibility === value;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={active}
                disabled={update.isPending}
                onClick={() => !active && save({ visibility: value }, t("saved"))}
                className={cn("flex items-start gap-3 rounded-xl border p-3 text-start transition", active ? "border-primary bg-primary/5 ring-2 ring-primary/15" : "border-border hover:border-primary/40")}
              >
                <span className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", active ? "bg-primary text-white" : "bg-muted text-muted-foreground")}><Icon className="size-4" /></span>
                <span>
                  <span className="block text-sm font-semibold">{t(`visibilities.${value}.label`)}</span>
                  <span className="block text-xs text-muted-foreground">{t(`visibilities.${value}.body`)}</span>
                </span>
              </button>
            );
          })}
        </div>

        {cv.visibility !== "PRIVATE" && cv.publicLink && (
          <div className="grid gap-4 rounded-xl border border-border p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">{t("linkActive")}</p>
                <p className="text-xs text-muted-foreground">{t("linkActiveHint")}</p>
              </div>
              <Switch checked={cv.publicLink.enabled} disabled={update.isPending} onCheckedChange={(linkEnabled) => save({ linkEnabled }, linkEnabled ? t("linkOn") : t("linkOff"))} />
            </div>

            <div className="flex gap-2">
              <Input dir="ltr" readOnly value={cv.publicLink.url} className={cn("font-mono text-xs", !reachable && "opacity-60")} aria-label={t("publicUrl")} />
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  if (await copyText(cv.publicLink!.url)) {
                    setCopied(true);
                    setTimeout(() => setCopied(false), 1500);
                  }
                }}
              >
                {copied ? <Check /> : <Copy />} <span className="sr-only">{t("copy")}</span>
              </Button>
              {reachable && (
                <Button asChild variant="outline"><a href={cv.publicLink.url} target="_blank" rel="noopener noreferrer" aria-label={t("open")}><ExternalLink /></a></Button>
              )}
            </div>

            <form
              className="grid gap-1.5"
              onSubmit={(e) => {
                e.preventDefault();
                if (slugState === "ok") save({ slug }, t("slugSaved"));
              }}
            >
              <label htmlFor="cv-slug" className="text-xs font-medium text-muted-foreground">{t("customLink")}</label>
              <div className="flex gap-2">
                <div className="flex min-w-0 flex-1 items-center rounded-lg border border-input bg-card ps-2.5 text-sm shadow-xs focus-within:border-ring" dir="ltr">
                  <span className="shrink-0 text-muted-foreground">/cv/</span>
                  <input id="cv-slug" className="h-10 min-w-0 flex-1 bg-transparent px-1 outline-none" value={slug} maxLength={60} onChange={(e) => setSlugDraft(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} />
                </div>
                <Button type="submit" variant="outline" disabled={slugState !== "ok" || update.isPending}>{t("saveLink")}</Button>
              </div>
              <p className={cn("text-xs", slugState === "ok" ? "text-success" : slugState === "taken" || slugState === "invalid" ? "text-destructive" : "text-muted-foreground")}>
                {t(`slugStates.${slugState}`)}
              </p>
            </form>

            {reachable && links && (
              <div className="grid gap-3 sm:grid-cols-[120px_1fr]">
                <div className="grid justify-items-center gap-2">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {qr ? <img src={qr} alt={t("qrAlt")} className="size-28 rounded-lg border border-border" /> : <div className="size-28 rounded-lg bg-muted" />}
                  {qr && (
                    <a href={qr} download={`${cv.publicLink.slug}-qr.png`} className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
                      <Download className="size-3.5" /> {t("downloadQr")}
                    </a>
                  )}
                </div>
                <div className="grid grid-cols-2 content-start gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={async () => { if (!(await nativeShare({ title: name, text: name, url: cv.publicLink!.url }))) toast.info(t("nativeUnsupported")); }}>
                    <Share2 /> {t("share")}
                  </Button>
                  <Button asChild variant="outline" size="sm"><a href={links.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a></Button>
                  <Button asChild variant="outline" size="sm"><a href={links.linkedin} target="_blank" rel="noopener noreferrer"><SocialIcon platform="linkedin" className="size-4" /> LinkedIn</a></Button>
                  <Button asChild variant="outline" size="sm"><a href={links.x} target="_blank" rel="noopener noreferrer"><SocialIcon platform="x" className="size-4" /> X</a></Button>
                  <Button asChild variant="outline" size="sm" className="col-span-2"><a href={links.email}><Mail /> {t("email")}</a></Button>
                </div>
              </div>
            )}
            {!reachable && <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-amber-800">{t("linkDisabledNote")}</p>}
          </div>
        )}

        <label className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
          <span>
            <span className="block text-sm font-semibold">{t("allowDownload")}</span>
            <span className="block text-xs text-muted-foreground">{t("allowDownloadHint")}</span>
          </span>
          <Switch checked={cv.allowDownload} disabled={update.isPending} onCheckedChange={(allowDownload) => save({ allowDownload }, t("saved"))} />
        </label>

        <Button asChild variant="ghost" className="justify-self-start">
          <Link href={`/dashboard/cv/${cv.id}/preview`}><Eye /> {t("previewPublic")}</Link>
        </Button>
      </DialogContent>
    </Dialog>
  );
}
