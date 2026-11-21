"use client";

import { Check, Copy, Download, Globe, Link2, Mail, Phone, Printer, QrCode, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Logo } from "@/components/brand/logo";
import { SocialIcon } from "@/components/cards/social-icons";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "@/i18n/navigation";
import { PAGE_W } from "@/lib/cv/paginate";
import { downloadPdf, publicCvPdfUrl } from "@/lib/cv/pdf";
import { cvShareLinks } from "@/lib/cv/share";
import type { CvDocument } from "@/lib/cv/types";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { copyText, nativeShare } from "@/lib/public-card";
import { qrDataUrl } from "@/lib/qr";
import { cn } from "@/lib/utils";
import { CvFlow, CvPaged } from "./render/cv-document";

/** A4 pages scaled to the available width (never above 100 %). */
function FitPages({ doc, onReady }: { doc: CvDocument; onReady?: () => void }) {
  const box = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setZoom(Math.min(1, e.contentRect.width / PAGE_W)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={box} className="w-full">
      <CvPaged doc={doc} zoom={zoom} className="mx-auto w-fit" onPages={onReady ? () => onReady() : undefined} />
    </div>
  );
}

export interface PublicCvViewProps {
  doc: CvDocument;
  url: string;
  slug?: string;
  allowDownload: boolean;
  /** Owner preview: no public link may exist yet, downloads use the owner endpoint. */
  mode?: "live" | "preview";
  onDownload?: () => void;
  autoPrint?: boolean;
  banner?: React.ReactNode;
  /** Off inside the dashboard, which already has a sticky top bar. */
  stickyHeader?: boolean;
}

export function PublicCvView({ doc, url, slug, allowDownload, mode = "live", onDownload, autoPrint, banner, stickyHeader = true }: PublicCvViewProps) {
  const t = useTranslations("cvPublic");
  const errorMessage = useErrorMessage();
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [qr, setQr] = useState<string>();
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const printed = useRef(false);
  const p = doc.profile;
  const links = cvShareLinks(url, p.fullName);

  useEffect(() => {
    if (!(shareOpen || qrOpen)) return;
    let active = true;
    void qrDataUrl(url).then((d) => active && setQr(d));
    return () => {
      active = false;
    };
  }, [url, shareOpen, qrOpen]);

  const download = async () => {
    if (onDownload) return onDownload();
    if (!slug) return;
    setBusy(true);
    try {
      await downloadPdf(publicCvPdfUrl(slug), `${p.fullName || "CV"}`);
    } catch (e) {
      toast.error(errorMessage(e), { action: { label: t("print"), onClick: () => window.print() } });
    } finally {
      setBusy(false);
    }
  };

  const contacts = [
    p.email && { key: "email", href: `mailto:${p.email}`, label: t("email"), icon: <Mail /> },
    p.phone && { key: "phone", href: `tel:${p.phone.replace(/[^\d+]/g, "")}`, label: t("call"), icon: <Phone /> },
    p.linkedin && { key: "linkedin", href: p.linkedin, label: "LinkedIn", icon: <SocialIcon platform="linkedin" className="size-4" /> },
    p.github && { key: "github", href: p.github, label: "GitHub", icon: <SocialIcon platform="github" className="size-4" /> },
    (p.portfolio || p.website) && { key: "web", href: (p.portfolio || p.website)!, label: p.portfolio ? t("portfolio") : t("website"), icon: p.portfolio ? <Link2 /> : <Globe /> },
  ].filter(Boolean) as { key: string; href: string; label: string; icon: React.ReactNode }[];

  return (
    <div className="min-h-dvh bg-[#eef2f8] print:bg-white">
      {banner}
      <header className={cn("no-print z-30 border-b border-border bg-card/90 backdrop-blur-lg", stickyHeader && "sticky top-0")}>
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link href="/" className="shrink-0" aria-label="Kardify"><Logo className="[&>span:last-child]:hidden sm:[&>span:last-child]:inline" /></Link>
          <div className="min-w-0 flex-1">
            <p dir="auto" className="truncate text-sm font-semibold text-navy">{p.fullName}</p>
            {p.professionalTitle && <p dir="auto" className="truncate text-xs text-muted-foreground">{p.professionalTitle}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            {allowDownload && (
              <Button size="sm" onClick={download} loading={busy}><Download /> <span className="hidden sm:inline">{t("downloadPdf")}</span></Button>
            )}
            {mode === "live" && (
              <>
                <Button size="sm" variant="outline" onClick={() => setShareOpen(true)}><Share2 /> <span className="hidden sm:inline">{t("share")}</span></Button>
                <Button size="icon-sm" variant="outline" onClick={() => setQrOpen(true)} aria-label={t("qr")}><QrCode /></Button>
              </>
            )}
          </div>
        </div>
        {contacts.length > 0 && (
          <nav aria-label={t("contactLabel")} className="mx-auto flex max-w-6xl gap-1.5 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
            {contacts.map((c) => (
              <Button key={c.key} asChild size="sm" variant="ghost" className="shrink-0 bg-muted/60">
                <a href={c.href} target={c.key === "email" || c.key === "phone" ? undefined : "_blank"} rel="noopener noreferrer">{c.icon} {c.label}</a>
              </Button>
            ))}
          </nav>
        )}
      </header>

      <main className="mx-auto max-w-6xl px-3 py-6 sm:px-6 sm:py-10 print:p-0">
        {/* Paged A4 on larger screens and in print; reflowed single column on phones. */}
        <div className="hidden md:block print:block">
          <FitPages
            doc={doc}
            onReady={autoPrint ? () => {
              if (printed.current) return;
              printed.current = true;
              setTimeout(() => window.print(), 300);
            } : undefined}
          />
        </div>
        <div className="md:hidden print:hidden">
          <CvFlow doc={doc} className="rounded-2xl shadow-lifted" />
        </div>
      </main>

      {mode === "live" && (
        <footer className="no-print pb-10 text-center text-sm text-muted-foreground">
          {t("madeWith")} <Link href="/register" className="font-semibold text-primary hover:underline">{t("createYours")}</Link>
        </footer>
      )}

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("shareTitle")}</DialogTitle>
            <DialogDescription>{t("shareBody")}</DialogDescription>
          </DialogHeader>
          <div className="flex gap-2">
            <input dir="ltr" readOnly value={url} className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-muted/40 px-3 font-mono text-xs" aria-label={t("link")} />
            <Button
              variant="outline"
              onClick={async () => {
                if (await copyText(url)) {
                  setCopied(true);
                  setTimeout(() => setCopied(false), 1500);
                }
              }}
            >
              {copied ? <Check /> : <Copy />} {t("copy")}
            </Button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={async () => { if (!(await nativeShare({ title: p.fullName, text: p.professionalTitle, url }))) toast.info(t("nativeUnsupported")); }}><Share2 /> {t("share")}</Button>
            <Button asChild variant="outline"><a href={links.whatsapp} target="_blank" rel="noopener noreferrer">WhatsApp</a></Button>
            <Button asChild variant="outline"><a href={links.linkedin} target="_blank" rel="noopener noreferrer"><SocialIcon platform="linkedin" className="size-4" /> LinkedIn</a></Button>
            <Button asChild variant="outline"><a href={links.email}><Mail /> {t("email")}</a></Button>
          </div>
          <Button variant="ghost" className="justify-self-start" onClick={() => window.print()}><Printer /> {t("print")}</Button>
        </DialogContent>
      </Dialog>

      <Dialog open={qrOpen} onOpenChange={setQrOpen}>
        <DialogContent className="max-w-xs text-center">
          <DialogHeader className="items-center text-center">
            <DialogTitle>{t("qrTitle")}</DialogTitle>
            <DialogDescription>{t("qrBody")}</DialogDescription>
          </DialogHeader>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {qr ? <img src={qr} alt={t("qr")} className="mx-auto size-56 rounded-xl border border-border" /> : <div className="mx-auto size-56 rounded-xl bg-muted" />}
          {qr && (
            <Button asChild variant="outline"><a href={qr} download={`${slug ?? "cv"}-qr.png`}><Download /> {t("downloadQr")}</a></Button>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
