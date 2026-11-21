"use client";

import { useEffect, useState } from "react";
import type { SocialLink } from "@/lib/api/types";
import { FONT_CLASS, normalizeDesign } from "@/lib/design/templates";
import type { DesignSettings } from "@/lib/design/types";
import { qrDataUrl } from "@/lib/qr";
import { cn, initials } from "@/lib/utils";
import {
  alpha, ContactLines, cq, FaceBackground, isDark, Logo, PatternLayer, Photo, pickContrast, SIZE_SCALE, SocialRow,
} from "./card-parts";

export { pickContrast } from "./card-parts";

export interface CardPreviewData {
  name: string;
  jobTitle?: string | null;
  companyName?: string | null;
  description?: string | null;
  profileImage?: string | null;
  companyLogo?: string | null;
  email?: string | null;
  phone?: string | null;
  website?: string | null;
  address?: string | null;
  socialLinks?: SocialLink[];
  designSettings: Partial<DesignSettings> | DesignSettings;
  language?: "en" | "ar";
}

interface LayoutProps {
  card: CardPreviewData;
  d: DesignSettings;
  s: number;
  name: string;
  logo: React.ReactNode;
  socials: React.ReactNode;
}

function NameBlock({ d, s, name, title, align = "start", size = 5.4, upper, className }: {
  d: DesignSettings;
  s: number;
  name: string;
  title: string;
  align?: "start" | "center";
  size?: number;
  upper?: boolean;
  className?: string;
}) {
  return (
    <div className={cn("min-w-0", align === "center" ? "text-center" : "text-start", className)} dir="auto">
      <div
        className={cn("font-bold leading-[1.12]", upper ? "truncate uppercase" : "line-clamp-2 break-words")}
        style={{ fontSize: cq(size, s), color: d.textColor, letterSpacing: upper ? "0.14em" : "-0.01em" }}
      >
        {name}
      </div>
      {title && (
        <div className="truncate font-medium" style={{ fontSize: cq(size * 0.53, s), color: d.primaryColor, marginTop: cq(0.8) }}>
          {title}
        </div>
      )}
    </div>
  );
}

const titleOf = (card: CardPreviewData) => [card.jobTitle, card.companyName].filter(Boolean).join(" · ");
const contacts = (p: LayoutProps, extra?: Partial<Parameters<typeof ContactLines>[0]>) => (
  <ContactLines card={p.card} color={p.d.textColor} primary={p.d.primaryColor} scale={p.s} iconStyle={p.d.contactIconStyle} {...extra} />
);

function Centered(p: LayoutProps) {
  const { card, d, s, name, logo, socials } = p;
  return (
    <>
      <div className="flex h-full flex-col items-center justify-center text-center" style={{ padding: cq(5), gap: cq(2.4) }}>
        <Photo src={card.profileImage} name={name} shape={d.photoShape} size={cq(17)} ring={alpha(d.primaryColor, 0.3)} />
        <NameBlock d={d} s={s} name={name} title={titleOf(card)} align="center" />
        {card.description && (
          <p className="line-clamp-2 max-w-[80%] opacity-75" dir="auto" style={{ fontSize: cq(2.4, s), color: d.textColor }}>{card.description}</p>
        )}
        {socials}
        {d.logoPosition === "bottom" && logo}
      </div>
      {d.logoPosition.startsWith("top") && logo && (
        <div className={cn("absolute top-[6%]", d.logoPosition === "top-start" ? "start-[5%]" : "end-[5%]")}>{logo}</div>
      )}
    </>
  );
}

function Left(p: LayoutProps) {
  const { card, d, s, name, logo, socials } = p;
  return (
    <div className="flex h-full flex-col justify-between" style={{ padding: cq(5.5) }}>
      <div className="flex items-start justify-between" style={{ gap: cq(3) }}>
        <div className="flex min-w-0 items-center" style={{ gap: cq(3.5) }}>
          <Photo src={card.profileImage} name={name} shape={d.photoShape} size={cq(16)} ring={alpha(d.primaryColor, 0.25)} />
          <NameBlock d={d} s={s} name={name} title={titleOf(card)} />
        </div>
        {d.logoPosition.startsWith("top") && logo}
      </div>
      <div className="flex items-end justify-between" style={{ gap: cq(3) }}>
        {contacts(p)}
        <div className="flex flex-col items-end" style={{ gap: cq(2) }}>
          {socials}
          {d.logoPosition === "bottom" && logo}
        </div>
      </div>
    </div>
  );
}

function Split(p: LayoutProps) {
  const { card, d, s, name, logo, socials } = p;
  const on = pickContrast(d.primaryColor);
  return (
    <div className="flex h-full">
      <div
        className="flex w-[38%] flex-col items-center justify-center"
        style={{ background: `linear-gradient(160deg, ${d.primaryColor}, ${d.secondaryColor})`, gap: cq(2.5), padding: cq(4), color: on }}
      >
        <Photo src={card.profileImage} name={name} shape={d.photoShape} size={cq(18)} ring={alpha(on, 0.35)} />
        {logo}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center" style={{ padding: cq(5), gap: cq(3) }}>
        <NameBlock d={{ ...d, primaryColor: d.secondaryColor }} s={s} name={name} title={titleOf(card)} />
        {contacts(p, { primary: d.secondaryColor })}
        {socials}
      </div>
    </div>
  );
}

function Banner(p: LayoutProps) {
  const { card, d, s, name, logo, socials } = p;
  return (
    <div className="flex h-full flex-col">
      <div className="relative shrink-0" style={{ height: "32%", background: `linear-gradient(120deg, ${d.primaryColor}, ${d.secondaryColor})` }}>
        {logo && (
          // The photo sits at the start edge, so the logo always goes to the end.
          <div className="absolute end-[5%] top-[18%]" style={{ color: pickContrast(d.primaryColor) }}>{logo}</div>
        )}
        <div className="absolute start-[5%] bottom-0 translate-y-1/2">
          <Photo src={card.profileImage} name={name} shape={d.photoShape} size={cq(17)} ring={d.backgroundColor} />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col justify-end" style={{ padding: `${cq(10)} ${cq(5)} ${cq(4)}`, gap: cq(2.4) }}>
        <NameBlock d={d} s={s} name={name} title={titleOf(card)} />
        <div className="flex items-end justify-between" style={{ gap: cq(3) }}>
          {contacts(p, { max: 2 })}
          {socials}
        </div>
      </div>
    </div>
  );
}

function Diagonal(p: LayoutProps) {
  const { card, d, s, name, logo, socials } = p;
  const on = pickContrast(d.primaryColor);
  return (
    <>
      <div
        aria-hidden
        className="absolute inset-y-0 start-0 w-[44%] rtl:-scale-x-100"
        style={{ background: `linear-gradient(150deg, ${d.primaryColor}, ${d.secondaryColor})`, clipPath: "polygon(0 0, 100% 0, 74% 100%, 0 100%)" }}
      />
      <div className="relative flex h-full">
        <div className="flex w-[33%] flex-col items-center justify-center" style={{ gap: cq(2.6), color: on }}>
          <Photo src={card.profileImage} name={name} shape={d.photoShape} size={cq(19)} ring={alpha(on, 0.6)} />
          {d.logoPosition !== "hidden" && <div className="max-w-[80%]">{logo}</div>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center" style={{ paddingBlock: cq(5), paddingInlineStart: cq(10), paddingInlineEnd: cq(5.5), gap: cq(3) }}>
          <NameBlock d={d} s={s} name={name} title={titleOf(card)} size={5.2} />
          <div className="h-[0.35cqw] w-[10cqw] rounded-full" style={{ background: d.secondaryColor }} />
          {contacts(p)}
          {socials}
        </div>
      </div>
    </>
  );
}

function Frame(p: LayoutProps) {
  const { card, d, s, name, logo } = p;
  const line = [card.phone, card.email].filter(Boolean).join("   ·   ");
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-[3.5%]" style={{ border: `${cq(0.28)} solid ${d.primaryColor}`, borderRadius: cq(d.borderRadius / 8) }} />
      <div aria-hidden className="pointer-events-none absolute inset-[5.2%]" style={{ border: `${cq(0.12)} solid ${alpha(d.primaryColor, 0.55)}`, borderRadius: cq(d.borderRadius / 10) }} />
      <div className="flex h-full flex-col items-center justify-center text-center" style={{ padding: cq(9), gap: cq(2) }}>
        {card.profileImage ? (
          <Photo src={card.profileImage} name={name} shape={d.photoShape} size={cq(12)} ring={alpha(d.primaryColor, 0.7)} />
        ) : (
          <div className="flex items-center justify-center rounded-full font-semibold" style={{ width: cq(10), height: cq(10), border: `${cq(0.25)} solid ${d.primaryColor}`, color: d.primaryColor, fontSize: cq(3.6) }}>
            {initials(name)}
          </div>
        )}
        <NameBlock d={d} s={s} name={name} title="" align="center" size={4.6} upper />
        <div className="h-[0.25cqw] w-[9cqw]" style={{ background: d.primaryColor }} />
        {titleOf(card) && (
          <div dir="auto" className="max-w-full truncate uppercase" style={{ fontSize: cq(2.2, s), letterSpacing: "0.2em", color: d.primaryColor }}>{titleOf(card)}</div>
        )}
        {line && <div dir="ltr" className="max-w-full truncate opacity-80" style={{ fontSize: cq(2.2, s), marginTop: cq(1) }}>{line}</div>}
      </div>
      {d.logoPosition.startsWith("top") && logo && (
        <div className={cn("absolute top-[9%]", d.logoPosition === "top-start" ? "start-[8%]" : "end-[8%]")}>{logo}</div>
      )}
    </>
  );
}

function Editorial(p: LayoutProps) {
  const { card, d, s, name, logo, socials } = p;
  return (
    <div className="flex h-full flex-col" style={{ padding: cq(6) }}>
      <div className="flex items-start justify-between" style={{ gap: cq(4) }}>
        <div className="min-w-0 flex-1" dir="auto">
          <div className="line-clamp-2 font-bold leading-[1.05] break-words" style={{ fontSize: cq(7, s), letterSpacing: "-0.02em" }}>{name}</div>
          {titleOf(card) && (
            <div className="mt-[1.4cqw] truncate font-semibold uppercase" style={{ fontSize: cq(2.4, s), letterSpacing: "0.12em", color: d.primaryColor }}>{titleOf(card)}</div>
          )}
        </div>
        <div className="flex flex-col items-end" style={{ gap: cq(2) }}>
          {d.logoPosition.startsWith("top") && logo}
          {card.profileImage && <Photo src={card.profileImage} name={name} shape={d.photoShape} size={cq(13)} />}
        </div>
      </div>
      <div className="flex-1" />
      <div style={{ borderTop: `${cq(0.2)} solid ${alpha(d.textColor, 0.18)}`, paddingTop: cq(3) }} className="flex items-end justify-between gap-[3cqw]">
        {contacts(p)}
        <div className="flex flex-col items-end" style={{ gap: cq(2) }}>
          {socials}
          {d.logoPosition === "bottom" && logo}
        </div>
      </div>
    </div>
  );
}

function Sidebar(p: LayoutProps) {
  const { card, d, s, name, logo } = p;
  const on = pickContrast(d.primaryColor);
  return (
    <div className="flex h-full">
      <div
        className="flex w-[19%] flex-col items-center justify-between"
        style={{ background: `linear-gradient(180deg, ${d.primaryColor}, ${d.secondaryColor})`, padding: `${cq(5)} ${cq(2)}`, color: on }}
      >
        <div className="flex max-w-full justify-center">{d.logoPosition !== "hidden" ? logo : null}</div>
        <SocialRow links={card.socialLinks ?? []} style="minimal" color={on} primary={on} size={5} vertical />
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-between" style={{ padding: cq(5.5) }}>
        <div className="flex min-w-0 items-center" style={{ gap: cq(3.5) }}>
          <Photo src={card.profileImage} name={name} shape={d.photoShape} size={cq(15)} ring={alpha(d.primaryColor, 0.5)} />
          <NameBlock d={d} s={s} name={name} title={titleOf(card)} size={5} />
        </div>
        {card.description && (
          <p dir="auto" className="line-clamp-2 opacity-70" style={{ fontSize: cq(2.3, s) }}>{card.description}</p>
        )}
        <div className="grid" style={{ gap: cq(1.2), borderInlineStart: `${cq(0.4)} solid ${d.primaryColor}`, paddingInlineStart: cq(2.4) }}>
          {contacts(p, { iconStyle: d.contactIconStyle === "circle" ? "plain" : d.contactIconStyle })}
        </div>
      </div>
    </div>
  );
}

function Monogram(p: LayoutProps) {
  const { card, d, s, name, logo, socials } = p;
  const line = [card.phone, card.email, card.website?.replace(/^https?:\/\//, "")].filter(Boolean).slice(0, 2).join("   |   ");
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute end-[-3%] bottom-[-16%] leading-none font-extrabold select-none"
        style={{ fontSize: cq(44), color: alpha(d.primaryColor, 0.13), letterSpacing: "-0.06em" }}
      >
        {initials(name)}
      </div>
      <div className="relative flex h-full flex-col justify-between" style={{ padding: cq(6) }}>
        <div className="flex items-start justify-between" style={{ gap: cq(3) }}>
          <div>{d.logoPosition !== "hidden" && logo}</div>
          {card.profileImage && <Photo src={card.profileImage} name={name} shape={d.photoShape} size={cq(12)} ring={alpha(d.primaryColor, 0.8)} />}
        </div>
        <div className="grid" style={{ gap: cq(1.8) }}>
          <div className="h-[0.5cqw] w-[9cqw]" style={{ background: d.primaryColor }} />
          <NameBlock d={d} s={s} name={name} title={titleOf(card)} size={6} />
          <div className="flex items-center justify-between" style={{ gap: cq(3) }}>
            {line ? <div dir="ltr" className="min-w-0 truncate opacity-75" style={{ fontSize: cq(2.3, s) }}>{line}</div> : <span />}
            {socials}
          </div>
        </div>
      </div>
    </>
  );
}

function Orbit(p: LayoutProps) {
  const { card, d, s, name, logo, socials } = p;
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute end-[-12%] top-[-38%] size-[55cqw] rounded-full" style={{ background: `radial-gradient(circle, ${alpha(d.primaryColor, 0.55)}, transparent 68%)` }} />
      <div aria-hidden className="pointer-events-none absolute start-[-10%] bottom-[-42%] size-[46cqw] rounded-full" style={{ background: `radial-gradient(circle, ${alpha(d.secondaryColor, 0.5)}, transparent 68%)` }} />
      <div aria-hidden className="pointer-events-none absolute end-[7%] bottom-[-22%] size-[30cqw] rounded-full" style={{ border: `${cq(0.3)} solid ${alpha(d.primaryColor, 0.45)}` }} />
      <div className="relative flex h-full flex-col justify-center" style={{ padding: cq(6), gap: cq(3.4) }}>
        <div className="flex min-w-0 items-center" style={{ gap: cq(4) }}>
          <div className="shrink-0 rounded-full" style={{ padding: cq(0.6), background: `linear-gradient(135deg, ${d.primaryColor}, ${d.secondaryColor})` }}>
            <Photo src={card.profileImage} name={name} shape="circle" size={cq(17)} />
          </div>
          <NameBlock d={d} s={s} name={name} title={titleOf(card)} size={5.6} />
        </div>
        <div className="flex items-end justify-between" style={{ gap: cq(3) }}>
          {contacts(p, { max: 2 })}
          {socials}
        </div>
      </div>
      {d.logoPosition !== "hidden" && logo && (
        <div className={cn("absolute", d.logoPosition === "bottom" ? "bottom-[7%] end-[6%]" : d.logoPosition === "top-start" ? "top-[7%] start-[6%]" : "top-[7%] end-[6%]")}>{logo}</div>
      )}
    </>
  );
}

const LAYOUT_COMPONENTS: Record<DesignSettings["layout"], (p: LayoutProps) => React.ReactNode> = {
  centered: Centered,
  left: Left,
  split: Split,
  banner: Banner,
  diagonal: Diagonal,
  frame: Frame,
  editorial: Editorial,
  sidebar: Sidebar,
  monogram: Monogram,
  orbit: Orbit,
};

function CardShell({ d, className, children, flex }: { d: DesignSettings; className?: string; children: React.ReactNode; flex?: boolean }) {
  return (
    <div
      className={cn("@container relative aspect-[1.6/1] w-full overflow-hidden shadow-lifted select-none", flex && "flex items-center justify-center", FONT_CLASS[d.fontFamily], className)}
      // Percentages (not cqw: an element's own container units resolve against its ancestors).
      // Horizontal % of width / vertical % of height keeps corners circular on a 1.6:1 card.
      style={{ borderRadius: `${(d.borderRadius / 4).toFixed(2)}% / ${((d.borderRadius / 4) * 1.6).toFixed(2)}%`, containerType: "inline-size" }}
    >
      {children}
    </div>
  );
}

export function BusinessCardFront({ card, className }: { card: CardPreviewData; className?: string }) {
  const d = normalizeDesign(card.designSettings as Partial<DesignSettings>);
  const s = SIZE_SCALE[d.fontSize];
  const name = card.name || "—";
  const logo = d.logoPosition !== "hidden" ? <Logo src={card.companyLogo} company={card.companyName} color={d.textColor} height={cq(6)} /> : null;
  const socials = <SocialRow links={card.socialLinks ?? []} style={d.socialIconStyle} color={d.textColor} primary={d.primaryColor} />;
  const Layout = LAYOUT_COMPONENTS[d.layout] ?? Centered;

  return (
    <CardShell d={d} className={className}>
      <FaceBackground face={d} image={d.backgroundImage} overlay={d.backgroundOverlay} />
      <PatternLayer pattern={d.pattern} color={d.textColor} />
      <div className="relative h-full" style={{ color: d.textColor }}>
        <Layout card={card} d={d} s={s} name={name} logo={logo} socials={socials} />
      </div>
    </CardShell>
  );
}

/** QR modules are always dark on white, so every phone camera can read them. */
function qrColors(b: DesignSettings["back"]) {
  if (isDark(b.textColor)) return { fg: b.textColor, bg: "#ffffff" };
  if (b.backgroundType === "solid" && isDark(b.backgroundColor)) return { fg: b.backgroundColor, bg: "#ffffff" };
  if (isDark(b.gradientFrom)) return { fg: b.gradientFrom, bg: "#ffffff" };
  return { fg: "#0d1e37", bg: "#ffffff" };
}

function useQr(text: string, enabled: boolean, fg: string, bg: string) {
  const [qr, setQr] = useState<string>();
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    qrDataUrl(text, fg, bg).then((u) => active && setQr(u));
    return () => {
      active = false;
    };
  }, [text, enabled, fg, bg]);
  return enabled ? qr : undefined;
}

function QrTile({ src, size }: { src?: string; size: number }) {
  return (
    <div className="shrink-0 overflow-hidden bg-white" style={{ width: cq(size), height: cq(size), padding: cq(size * 0.05), borderRadius: cq(size * 0.09) }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      {src && <img src={src} alt="QR" className="size-full" />}
    </div>
  );
}

export function BusinessCardBack({ card, url, className }: { card: CardPreviewData; url?: string; className?: string }) {
  const d = normalizeDesign(card.designSettings as Partial<DesignSettings>);
  const b = d.back;
  const { fg, bg } = qrColors(b);
  const qr = useQr(url ?? "https://kardify.com", b.showQr, fg, bg);
  const shortUrl = url?.replace(/^https?:\/\//, "");
  const brand = card.companyLogo ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={card.companyLogo} alt="" className="w-auto object-contain" style={{ height: cq(8), maxWidth: "40cqw" }} />
  ) : (
    <div className="line-clamp-2 font-bold tracking-tight break-words" dir="auto" style={{ fontSize: cq(5) }}>{card.companyName || card.name || "Kardify"}</div>
  );
  const face = { ...d, textColor: b.textColor, primaryColor: isDark(b.textColor) === isDark(d.primaryColor) ? b.textColor : d.primaryColor };
  const tagline = b.tagline && <div dir="auto" className="font-medium opacity-90" style={{ fontSize: cq(3) }}>{b.tagline}</div>;
  const urlLine = shortUrl && <div dir="ltr" className="truncate opacity-70" style={{ fontSize: cq(2.2) }}>{shortUrl}</div>;

  let body: React.ReactNode;
  if (b.layout === "qr-side" || b.layout === "contact") {
    body = (
      <div className="flex h-full items-center" style={{ padding: cq(6), gap: cq(5) }}>
        <div className="flex min-w-0 flex-1 flex-col justify-center" style={{ gap: cq(2.4) }}>
          {b.layout === "qr-side" ? (
            <>
              {brand}
              {card.companyLogo && card.companyName && <div dir="auto" className="truncate font-semibold" style={{ fontSize: cq(3) }}>{card.companyName}</div>}
              {tagline}
              {urlLine}
            </>
          ) : (
            <>
              <div dir="auto" className="min-w-0">
                <div className="truncate font-bold" style={{ fontSize: cq(4.4) }}>{card.name || "—"}</div>
                {card.jobTitle && <div className="truncate opacity-80" style={{ fontSize: cq(2.6) }}>{card.jobTitle}</div>}
              </div>
              <ContactLines card={card} color={b.textColor} primary={face.primaryColor} scale={1} iconStyle={d.contactIconStyle === "none" ? "none" : "plain"} max={4} size={2.3} />
              {tagline}
            </>
          )}
        </div>
        {b.showQr && (
          <div className="flex flex-col items-center" style={{ gap: cq(1.6) }}>
            <QrTile src={qr} size={b.layout === "contact" ? 25 : 29} />
            {b.layout === "contact" && shortUrl && <div dir="ltr" className="max-w-[28cqw] truncate opacity-70" style={{ fontSize: cq(1.9) }}>{shortUrl}</div>}
          </div>
        )}
      </div>
    );
  } else if (b.layout === "logo") {
    body = (
      <>
        <div className="flex h-full flex-col items-center justify-center text-center" style={{ gap: cq(3), padding: cq(8) }}>
          {brand}
          <div className="h-[0.25cqw] w-[8cqw]" style={{ background: d.primaryColor }} />
          {tagline}
        </div>
        {b.showQr && <div className="absolute end-[5%] bottom-[7%]"><QrTile src={qr} size={14} /></div>}
        {shortUrl && <div className="absolute start-[5%] bottom-[7%] max-w-[60%]">{urlLine}</div>}
      </>
    );
  } else {
    body = (
      <div className="flex h-full flex-col items-center justify-center text-center" style={{ gap: cq(3), padding: cq(5) }}>
        {brand}
        {b.showQr && <QrTile src={qr} size={26} />}
        {tagline}
        {urlLine}
      </div>
    );
  }

  return (
    <CardShell d={d} className={className}>
      <FaceBackground face={b} />
      <PatternLayer pattern={d.pattern} color={b.textColor} />
      <div className="relative h-full" style={{ color: b.textColor }}>{body}</div>
    </CardShell>
  );
}

/** Card with a 3D flip between front and back. */
export function FlippableCard({ card, url, side, className }: { card: CardPreviewData; url?: string; side: "front" | "back"; className?: string }) {
  return (
    <div className={cn("[perspective:1600px]", className)}>
      <div
        className="relative transition-transform duration-700 [transform-style:preserve-3d]"
        style={{ transform: side === "back" ? "rotateY(180deg)" : "none" }}
      >
        <div className="[backface-visibility:hidden]">
          <BusinessCardFront card={card} />
        </div>
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
          <BusinessCardBack card={card} url={url} />
        </div>
      </div>
    </div>
  );
}
