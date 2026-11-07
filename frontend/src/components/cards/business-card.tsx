"use client";

import { Globe, Mail, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import type { SocialLink } from "@/lib/api/types";
import { FONT_CLASS, faceBackground, normalizeDesign } from "@/lib/design/templates";
import type { DesignSettings } from "@/lib/design/types";
import { qrDataUrl } from "@/lib/qr";
import { cn, initials } from "@/lib/utils";
import { SocialIcon } from "./social-icons";

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

const SIZE_SCALE = { sm: 0.9, md: 1, lg: 1.12 } as const;

/** Font size in container-width units so the card scales perfectly at any rendered size. */
const cq = (n: number, scale = 1) => `${(n * scale).toFixed(2)}cqw`;

function Photo({ src, name, shape, size, ring }: { src?: string | null; name: string; shape: DesignSettings["photoShape"]; size: string; ring: string }) {
  const radius = shape === "circle" ? "9999px" : shape === "rounded" ? "22%" : "6%";
  return (
    <div
      className="shrink-0 overflow-hidden bg-black/10"
      style={{ width: size, height: size, borderRadius: radius, boxShadow: `0 0 0 ${cq(0.6)} ${ring}` }}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center font-semibold" style={{ fontSize: `calc(${size} * 0.36)` }}>
          {initials(name)}
        </div>
      )}
    </div>
  );
}

function Logo({ src, company, color, height }: { src?: string | null; company?: string | null; color: string; height: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="w-auto object-contain" style={{ height, maxWidth: "30cqw" }} />;
  }
  if (!company) return null;
  return (
    <span className="font-semibold tracking-tight uppercase opacity-80" style={{ color, fontSize: cq(2.6), letterSpacing: "0.08em" }}>
      {company}
    </span>
  );
}

function SocialRow({ links, style, color, primary }: { links: SocialLink[]; style: DesignSettings["socialIconStyle"]; color: string; primary: string }) {
  const visible = links.filter((l) => l.visible !== false).slice(0, 6);
  if (visible.length === 0) return null;
  return (
    <div className="flex flex-wrap items-center" style={{ gap: cq(1.4) }}>
      {visible.map((l, i) => (
        <span
          key={`${l.platform}-${i}`}
          className="flex items-center justify-center rounded-full"
          style={{
            width: cq(5.6),
            height: cq(5.6),
            background: style === "filled" ? primary : "transparent",
            border: style === "outline" ? `${cq(0.3)} solid ${primary}` : "none",
            color: style === "filled" ? pickContrast(primary) : style === "outline" ? primary : color,
          }}
        >
          <SocialIcon platform={l.platform} className="size-[50%]" />
        </span>
      ))}
    </div>
  );
}

/** Returns black or white, whichever reads better on the given hex colour. */
export function pickContrast(hex: string) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return "#ffffff";
  const [r, g, b] = [m[1], m[2], m[3]].map((x) => parseInt(x, 16) / 255);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return lum > 0.6 ? "#0d1e37" : "#ffffff";
}

function ContactLines({ card, color, primary, scale }: { card: CardPreviewData; color: string; primary: string; scale: number }) {
  const rows = [
    card.phone && { icon: Phone, text: card.phone },
    card.email && { icon: Mail, text: card.email },
    card.website && { icon: Globe, text: card.website.replace(/^https?:\/\//, "").replace(/\/$/, "") },
    card.address && { icon: MapPin, text: card.address },
  ].filter(Boolean) as { icon: typeof Phone; text: string }[];
  if (rows.length === 0) return null;
  return (
    <div className="grid min-w-0" style={{ gap: cq(1.1) }}>
      {rows.slice(0, 3).map(({ icon: Icon, text }) => (
        <div key={text} className="flex min-w-0 items-center" style={{ gap: cq(1.4), color, fontSize: cq(2.5, scale) }}>
          <Icon style={{ width: cq(2.8), height: cq(2.8), color: primary }} className="shrink-0" />
          <span dir="ltr" className="truncate">{text}</span>
        </div>
      ))}
    </div>
  );
}

export function BusinessCardFront({ card, className }: { card: CardPreviewData; className?: string }) {
  const d = normalizeDesign(card.designSettings as Partial<DesignSettings>);
  const s = SIZE_SCALE[d.fontSize];
  const name = card.name || "—";
  const logo = d.logoPosition !== "hidden" ? <Logo src={card.companyLogo} company={card.companyName} color={d.textColor} height={cq(6)} /> : null;
  const titleLine = [card.jobTitle, card.companyName].filter(Boolean).join(" · ");
  const socials = <SocialRow links={card.socialLinks ?? []} style={d.socialIconStyle} color={d.textColor} primary={d.primaryColor} />;

  const nameBlock = (align: "start" | "center") => (
    <div className={cn("min-w-0", align === "center" ? "text-center" : "text-start")} dir="auto">
      <div className="truncate font-bold leading-tight" style={{ fontSize: cq(5.4, s), color: d.textColor }}>{name}</div>
      {titleLine && (
        <div className="truncate font-medium" style={{ fontSize: cq(2.9, s), color: d.primaryColor, marginTop: cq(0.8) }}>
          {titleLine}
        </div>
      )}
    </div>
  );

  let body: React.ReactNode;
  if (d.layout === "split") {
    body = (
      <div className="flex h-full">
        <div className="flex w-[38%] flex-col items-center justify-center" style={{ background: d.primaryColor, gap: cq(2.5), padding: cq(4) }}>
          <Photo src={card.profileImage} name={name} shape={d.photoShape} size={cq(18)} ring={pickContrast(d.primaryColor) + "55"} />
          {logo && <div style={{ color: pickContrast(d.primaryColor) }}>{logo}</div>}
        </div>
        <div className="flex min-w-0 flex-1 flex-col justify-center" style={{ padding: cq(5), gap: cq(3) }}>
          {nameBlock("start")}
          <ContactLines card={card} color={d.textColor} primary={d.primaryColor} scale={s} />
          {socials}
        </div>
      </div>
    );
  } else if (d.layout === "banner") {
    body = (
      <div className="flex h-full flex-col">
        <div className="relative shrink-0" style={{ height: "32%", background: `linear-gradient(120deg, ${d.primaryColor}, ${d.primaryColor}cc)` }}>
          {logo && (
            <div className={cn("absolute top-[18%]", d.logoPosition === "top-start" ? "start-[5%]" : "end-[5%]")} style={{ color: pickContrast(d.primaryColor) }}>
              {logo}
            </div>
          )}
          <div className="absolute start-[5%] bottom-0 translate-y-1/2">
            <Photo src={card.profileImage} name={name} shape={d.photoShape} size={cq(17)} ring={d.backgroundColor} />
          </div>
        </div>
        <div className="flex flex-1 flex-col justify-end" style={{ padding: `${cq(10)} ${cq(5)} ${cq(4)}`, gap: cq(2.4) }}>
          {nameBlock("start")}
          <div className="flex items-end justify-between" style={{ gap: cq(3) }}>
            <ContactLines card={card} color={d.textColor} primary={d.primaryColor} scale={s} />
            {socials}
          </div>
        </div>
      </div>
    );
  } else if (d.layout === "left") {
    body = (
      <div className="flex h-full flex-col justify-between" style={{ padding: cq(5.5) }}>
        <div className="flex items-start justify-between" style={{ gap: cq(3) }}>
          <div className="flex min-w-0 items-center" style={{ gap: cq(3.5) }}>
            <Photo src={card.profileImage} name={name} shape={d.photoShape} size={cq(16)} ring={d.primaryColor + "40"} />
            {nameBlock("start")}
          </div>
          {d.logoPosition.startsWith("top") && logo}
        </div>
        <div className="flex items-end justify-between" style={{ gap: cq(3) }}>
          <ContactLines card={card} color={d.textColor} primary={d.primaryColor} scale={s} />
          <div className="flex flex-col items-end" style={{ gap: cq(2) }}>
            {socials}
            {d.logoPosition === "bottom" && logo}
          </div>
        </div>
      </div>
    );
  } else {
    body = (
      <div className="flex h-full flex-col items-center justify-center text-center" style={{ padding: cq(5), gap: cq(2.6) }}>
        <Photo src={card.profileImage} name={name} shape={d.photoShape} size={cq(17)} ring={d.primaryColor + "40"} />
        {nameBlock("center")}
        {card.description && (
          <p className="line-clamp-2 max-w-[80%] opacity-75" dir="auto" style={{ fontSize: cq(2.5, s), color: d.textColor }}>
            {card.description}
          </p>
        )}
        {socials}
        {d.logoPosition === "bottom" && logo}
      </div>
    );
  }

  return (
    <div
      className={cn("@container relative aspect-[1.6/1] w-full overflow-hidden shadow-lifted select-none", FONT_CLASS[d.fontFamily], className)}
      style={{ background: faceBackground(d), color: d.textColor, borderRadius: `${(d.borderRadius / 4).toFixed(1)}cqw`, containerType: "inline-size" }}
    >
      {body}
      {d.layout === "centered" && d.logoPosition.startsWith("top") && logo && (
        <div className={cn("absolute top-[6%]", d.logoPosition === "top-start" ? "start-[5%]" : "end-[5%]")}>{logo}</div>
      )}
    </div>
  );
}

export function BusinessCardBack({ card, url, className }: { card: CardPreviewData; url?: string; className?: string }) {
  const d = normalizeDesign(card.designSettings as Partial<DesignSettings>);
  const b = d.back;
  const [qr, setQr] = useState<string>();
  const qrText = url ?? "https://kardify.com";

  useEffect(() => {
    if (!b.showQr) return;
    let active = true;
    qrDataUrl(qrText, b.textColor, b.backgroundType === "solid" ? b.backgroundColor : "#ffffff").then((u) => active && setQr(u));
    return () => {
      active = false;
    };
  }, [qrText, b.showQr, b.textColor, b.backgroundColor, b.backgroundType]);

  return (
    <div
      className={cn("@container relative flex aspect-[1.6/1] w-full items-center justify-center overflow-hidden shadow-lifted select-none", FONT_CLASS[d.fontFamily], className)}
      style={{ background: faceBackground(b), color: b.textColor, borderRadius: `${(d.borderRadius / 4).toFixed(1)}cqw`, containerType: "inline-size" }}
    >
      <div className="flex flex-col items-center text-center" style={{ gap: cq(3), padding: cq(5) }}>
        {card.companyLogo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.companyLogo} alt="" className="w-auto object-contain" style={{ height: cq(8), maxWidth: "40cqw" }} />
        ) : (
          <div className="font-bold tracking-tight" dir="auto" style={{ fontSize: cq(5) }}>{card.companyName || card.name || "Kardify"}</div>
        )}
        {b.showQr && (
          <div className="overflow-hidden bg-white" style={{ width: cq(26), height: cq(26), padding: cq(1.2), borderRadius: cq(2.4) }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            {qr && <img src={qr} alt="QR" className="size-full" />}
          </div>
        )}
        {b.tagline && <div dir="auto" className="font-medium opacity-90" style={{ fontSize: cq(3) }}>{b.tagline}</div>}
        {url && <div dir="ltr" className="opacity-70" style={{ fontSize: cq(2.2) }}>{url.replace(/^https?:\/\//, "")}</div>}
      </div>
    </div>
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
