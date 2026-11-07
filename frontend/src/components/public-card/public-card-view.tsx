"use client";

import { ChevronRight, Download, Globe, Mail, MapPin, Phone, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { BusinessCardBack, pickContrast } from "@/components/cards/business-card";
import { ShareDialog } from "@/components/cards/share-dialog";
import { SocialIcon } from "@/components/cards/social-icons";
import { WalletButtons } from "@/components/cards/wallet-buttons";
import { LogoMark } from "@/components/brand/logo";
import { Link } from "@/i18n/navigation";
import type { PublicCard, ShareLinks, SocialLink } from "@/lib/api/types";
import { FONT_CLASS, faceBackground, normalizeDesign } from "@/lib/design/templates";
import { mapsUrlFor, publicQrUrl, telUrl, trackEvent, vcardUrl, whatsappChatUrl } from "@/lib/public-card";
import { cn, initials } from "@/lib/utils";

export type PublicCardViewData = Omit<PublicCard, "shareLinks" | "updatedAt"> & { shareLinks?: ShareLinks };

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden>
      <path d="M12.05 21.79h-.01a9.87 9.87 0 0 1-5.03-1.38l-.36-.21-3.74.98 1-3.65-.24-.37a9.86 9.86 0 0 1-1.51-5.26c0-5.45 4.44-9.88 9.89-9.88 2.64 0 5.12 1.03 6.99 2.9a9.82 9.82 0 0 1 2.89 6.99c0 5.45-4.44 9.88-9.88 9.88m8.41-18.29A11.82 11.82 0 0 0 12.05 0C5.5 0 .16 5.34.16 11.89c0 2.1.55 4.14 1.59 5.94L.06 24l6.3-1.65a11.88 11.88 0 0 0 5.68 1.45h.01c6.55 0 11.89-5.34 11.89-11.89 0-3.18-1.24-6.16-3.48-8.41M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.26-.46-2.39-1.48-.88-.79-1.48-1.76-1.65-2.06-.17-.3-.02-.46.13-.6.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.08-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.88 1.21 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.7.25-1.29.17-1.41-.07-.13-.27-.2-.57-.35" />
    </svg>
  );
}

/**
 * The public business-card profile. `mode="live"` tracks analytics and enables all actions;
 * `mode="preview"` is the inert version shown in the editor's mobile preview.
 */
export function PublicCardView({ card, mode = "live", source }: { card: PublicCardViewData; mode?: "live" | "preview"; source?: string }) {
  const t = useTranslations("publicCard");
  const d = normalizeDesign(card.designSettings);
  const live = mode === "live";
  const [shareOpen, setShareOpen] = useState(false);
  const tracked = useRef(false);
  const onPrimary = pickContrast(d.primaryColor);
  const heroText = d.textColor;

  useEffect(() => {
    if (!live || tracked.current) return;
    tracked.current = true;
    // Sequential: the first response sets the anonymous visitor cookie used by the next one.
    void (async () => {
      if (source === "qr") await trackEvent(card.slug, "QR_SCAN");
      await trackEvent(card.slug, "VIEW");
    })();
  }, [live, card.slug, source]);

  const track = (type: Parameters<typeof trackEvent>[1], meta?: string) => {
    if (live) void trackEvent(card.slug, type, meta);
  };
  const maps = mapsUrlFor(card.address, card.mapsUrl);
  const socials = (card.socialLinks as SocialLink[]).filter((s) => s.visible !== false);

  const quick = [
    card.phone && { key: "call", label: t("call"), href: telUrl(card.phone), icon: Phone, event: "PHONE_CLICK" as const },
    card.email && { key: "email", label: t("email"), href: `mailto:${card.email}`, icon: Mail, event: "EMAIL_CLICK" as const },
    card.whatsapp && { key: "whatsapp", label: t("whatsapp"), href: whatsappChatUrl(card.whatsapp), icon: WhatsAppIcon, event: "WHATSAPP_CLICK" as const },
    maps && { key: "location", label: t("location"), href: maps, icon: MapPin, event: "LOCATION_CLICK" as const },
  ].filter(Boolean) as { key: string; label: string; href: string; icon: React.ComponentType<{ className?: string }>; event: Parameters<typeof trackEvent>[1] }[];

  const contactRows = [
    card.phone && { icon: Phone, label: t("call"), value: card.phone, href: telUrl(card.phone), event: "PHONE_CLICK" as const, ltr: true },
    card.email && { icon: Mail, label: t("email"), value: card.email, href: `mailto:${card.email}`, event: "EMAIL_CLICK" as const, ltr: true },
    card.website && { icon: Globe, label: t("website"), value: card.website.replace(/^https?:\/\//, ""), href: card.website, event: "WEBSITE_CLICK" as const, ltr: true },
    card.address && { icon: MapPin, label: t("location"), value: card.address, href: maps ?? undefined, event: "LOCATION_CLICK" as const, ltr: false },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string }>; label: string; value: string; href?: string; event: Parameters<typeof trackEvent>[1]; ltr: boolean }[];

  const photoRadius = d.photoShape === "circle" ? "9999px" : d.photoShape === "rounded" ? "28%" : "10%";
  const linkProps = live ? { target: "_blank", rel: "noopener noreferrer" } : { onClick: (e: React.MouseEvent) => e.preventDefault() };

  return (
    <div className={cn("min-h-full bg-background", FONT_CLASS[d.fontFamily])}>
      <div className="mx-auto w-full max-w-md pb-10">
        {/* Hero */}
        <div className="relative px-5 pt-5">
          <div className="relative overflow-hidden rounded-[28px] px-6 pt-8 pb-7 shadow-lifted" style={{ background: faceBackground(d), color: heroText }}>
            {card.companyLogo && d.logoPosition !== "hidden" && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={card.companyLogo} alt="" className={cn("absolute top-5 h-8 w-auto max-w-[35%] object-contain", d.logoPosition === "top-start" ? "start-5" : "end-5")} />
            )}
            <div className="flex flex-col items-center text-center">
              <div className="size-28 overflow-hidden bg-black/10 shadow-lg" style={{ borderRadius: photoRadius, boxShadow: `0 0 0 4px ${d.primaryColor}33` }}>
                {card.profileImage ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={card.profileImage} alt={card.name} className="size-full object-cover" />
                ) : (
                  <div className="flex size-full items-center justify-center text-3xl font-bold">{initials(card.name)}</div>
                )}
              </div>
              <h1 dir="auto" className="mt-5 text-2xl font-bold leading-tight tracking-tight">{card.name || "—"}</h1>
              {card.jobTitle && <p dir="auto" className="mt-1.5 text-[15px] font-medium" style={{ color: d.primaryColor === d.backgroundColor ? heroText : d.primaryColor }}>{card.jobTitle}</p>}
              {card.companyName && <p dir="auto" className="mt-0.5 text-sm opacity-75">{card.companyName}</p>}
              {socials.length > 0 && (
                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {socials.map((s, i) => (
                    <a
                      key={`${s.platform}-${i}`}
                      href={s.url}
                      aria-label={s.label || s.platform}
                      {...linkProps}
                      onClick={(e) => (live ? track("SOCIAL_CLICK", s.platform) : e.preventDefault())}
                      className="flex size-10 items-center justify-center rounded-full transition hover:scale-105"
                      style={{
                        background: d.socialIconStyle === "filled" ? d.primaryColor : "transparent",
                        color: d.socialIconStyle === "filled" ? onPrimary : d.socialIconStyle === "outline" ? d.primaryColor : heroText,
                        border: d.socialIconStyle === "outline" ? `2px solid ${d.primaryColor}` : undefined,
                      }}
                    >
                      <SocialIcon platform={s.platform} className="size-[18px]" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick actions */}
        {quick.length > 0 && (
          <div className="mt-4 grid gap-2 px-5" style={{ gridTemplateColumns: `repeat(${quick.length}, minmax(0, 1fr))` }}>
            {quick.map((q) => (
              <a
                key={q.key}
                href={q.href}
                {...(q.key === "call" || q.key === "email" ? {} : linkProps)}
                onClick={(e) => (live ? track(q.event) : e.preventDefault())}
                className="flex flex-col items-center gap-1.5 rounded-2xl border border-border bg-card py-3 text-xs font-medium shadow-soft transition hover:-translate-y-0.5"
              >
                <q.icon className="size-5 text-primary" />
                {q.label}
              </a>
            ))}
          </div>
        )}

        {/* Primary actions */}
        <div className="mt-4 grid grid-cols-2 gap-2.5 px-5">
          <a
            href={live ? vcardUrl(card.slug) : undefined}
            onClick={(e) => !live && e.preventDefault()}
            className="flex h-12 items-center justify-center gap-2 rounded-xl text-sm font-semibold shadow-sm transition hover:opacity-90 active:scale-[0.98]"
            style={{ background: d.primaryColor === "#ffffff" ? "#006afe" : d.primaryColor, color: d.primaryColor === "#ffffff" ? "#fff" : onPrimary }}
          >
            <Download className="size-4" /> {t("saveContact")}
          </a>
          <button
            type="button"
            onClick={() => live && setShareOpen(true)}
            className="flex h-12 items-center justify-center gap-2 rounded-xl border border-border bg-card text-sm font-semibold shadow-soft transition hover:bg-muted active:scale-[0.98]"
          >
            <Share2 className="size-4" /> {t("share")}
          </button>
        </div>
        <WalletButtons publicId={card.publicId} disabled={!live} className="mt-2.5 px-5" compact />

        {/* About */}
        {card.description && (
          <section className="mx-5 mt-5 rounded-2xl border border-border bg-card p-5 shadow-soft">
            <h2 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">{t("about")}</h2>
            <p dir="auto" className="mt-2 text-[15px] leading-relaxed whitespace-pre-line">{card.description}</p>
          </section>
        )}

        {/* Contact */}
        {contactRows.length > 0 && (
          <section className="mx-5 mt-4 overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
            <h2 className="px-5 pt-4 text-xs font-semibold tracking-wider text-muted-foreground uppercase">{t("contact")}</h2>
            <ul className="divide-y divide-border">
              {contactRows.map((r) => (
                <li key={r.label}>
                  <a
                    href={r.href}
                    {...(r.event === "WEBSITE_CLICK" || r.event === "LOCATION_CLICK" ? linkProps : {})}
                    onClick={(e) => (live ? track(r.event) : e.preventDefault())}
                    className="flex items-center gap-3.5 px-5 py-3.5 transition hover:bg-muted/60"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      <r.icon className="size-[18px]" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs text-muted-foreground">{r.label}</span>
                      <span className="block truncate text-start text-[15px] font-medium">{r.ltr ? <bdi dir="ltr">{r.value}</bdi> : <bdi>{r.value}</bdi>}</span>
                    </span>
                    <ChevronRight className="rtl-flip size-4 text-muted-foreground" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Back of the card with QR */}
        {d.back.showQr && (
          <div className="mx-5 mt-4">
            <BusinessCardBack card={{ ...card, designSettings: d }} url={card.url} />
          </div>
        )}

        <footer className="mt-8 flex flex-col items-center gap-2 text-xs text-muted-foreground">
          <Link href="/" className="flex items-center gap-1.5 font-medium hover:text-foreground">
            {t("poweredBy")} <LogoMark className="size-4" /> <span dir="ltr" className="font-semibold text-navy">Kardify</span>
          </Link>
          <Link href="/register" className="text-primary hover:underline">{t("createYours")}</Link>
        </footer>
      </div>

      {live && card.shareLinks && (
        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          onShared={() => track("SHARE")}
          targets={{
            name: card.name,
            slug: card.slug,
            links: card.shareLinks,
            qrPngUrl: publicQrUrl(card.slug, "png", true),
            qrSvgUrl: publicQrUrl(card.slug, "svg", true),
            qrPreviewUrl: publicQrUrl(card.slug, "svg"),
            vcardUrl: vcardUrl(card.slug),
          }}
        />
      )}
    </div>
  );
}
