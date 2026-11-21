"use client";

import { Globe, Mail, MapPin, Phone } from "lucide-react";
import type { SocialLink } from "@/lib/api/types";
import { faceBackground } from "@/lib/design/templates";
import type { CardFaceDesign, DesignSettings, Pattern } from "@/lib/design/types";
import { cn, initials } from "@/lib/utils";
import { SocialIcon } from "./social-icons";

/** Size in container-width units, so a card scales perfectly at any rendered size. */
export const cq = (n: number, scale = 1) => `${(n * scale).toFixed(2)}cqw`;

export const SIZE_SCALE = { sm: 0.9, md: 1, lg: 1.12 } as const;

function luminance(hex: string) {
  const m = /^#?([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(hex);
  if (!m) return 1;
  const [r, g, b] = [m[1], m[2], m[3]].map((x) => parseInt(x, 16) / 255);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Returns navy or white, whichever reads better on the given hex colour. */
export function pickContrast(hex: string) {
  return luminance(hex) > 0.6 ? "#0d1e37" : "#ffffff";
}

export const isDark = (hex: string) => luminance(hex) < 0.5;

/** Appends an alpha channel (0–1) to a #rrggbb colour. */
export const alpha = (hex: string, a: number) =>
  /^#[0-9a-f]{6}$/i.test(hex) ? `${hex}${Math.round(Math.max(0, Math.min(1, a)) * 255).toString(16).padStart(2, "0")}` : hex;

export function Photo({ src, name, shape, size, ring, className }: { src?: string | null; name: string; shape: DesignSettings["photoShape"]; size: string; ring?: string; className?: string }) {
  const radius = shape === "circle" ? "9999px" : shape === "rounded" ? "22%" : "6%";
  return (
    <div
      className={cn("shrink-0 overflow-hidden bg-black/10", className)}
      style={{ width: size, height: size, borderRadius: radius, boxShadow: ring ? `0 0 0 ${cq(0.6)} ${ring}` : undefined }}
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

export function Logo({ src, company, color, height, maxWidth = "30cqw" }: { src?: string | null; company?: string | null; color: string; height: string; maxWidth?: string }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" className="w-auto object-contain" style={{ height, maxWidth }} />;
  }
  if (!company) return null;
  return (
    <span dir="auto" className="block truncate font-semibold tracking-tight uppercase opacity-85" style={{ color, fontSize: cq(2.5), letterSpacing: "0.08em", maxWidth }}>
      {company}
    </span>
  );
}

export function SocialRow({ links, style, color, primary, size = 5.6, vertical }: {
  links: SocialLink[];
  style: DesignSettings["socialIconStyle"];
  color: string;
  primary: string;
  size?: number;
  vertical?: boolean;
}) {
  const visible = links.filter((l) => l.visible !== false).slice(0, 6);
  if (visible.length === 0) return null;
  return (
    <div className={cn("flex items-center", vertical ? "flex-col" : "flex-wrap")} style={{ gap: cq(size / 4) }}>
      {visible.map((l, i) => (
        <span
          key={`${l.platform}-${i}`}
          className="flex shrink-0 items-center justify-center rounded-full"
          style={{
            width: cq(size),
            height: cq(size),
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

export interface ContactSource {
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
}

export function contactRows(card: ContactSource) {
  return [
    card.phone && { key: "phone", icon: Phone, text: card.phone },
    card.email && { key: "email", icon: Mail, text: card.email },
    card.website && { key: "website", icon: Globe, text: card.website.replace(/^https?:\/\//, "").replace(/\/$/, "") },
    card.address && { key: "address", icon: MapPin, text: card.address },
  ].filter(Boolean) as { key: string; icon: typeof Phone; text: string }[];
}

export function ContactLines({ card, color, primary, scale, iconStyle, max = 3, size = 2.5 }: {
  card: ContactSource;
  color: string;
  primary: string;
  scale: number;
  iconStyle: DesignSettings["contactIconStyle"];
  max?: number;
  size?: number;
}) {
  const rows = contactRows(card).slice(0, max);
  if (rows.length === 0) return null;
  return (
    <div className="grid min-w-0" style={{ gap: cq(size * 0.44) }}>
      {rows.map(({ key, icon: Icon, text }) => (
        <div key={key} className="flex min-w-0 items-center" style={{ gap: cq(size * 0.56), color, fontSize: cq(size, scale) }}>
          {iconStyle === "circle" ? (
            <span className="flex shrink-0 items-center justify-center rounded-full" style={{ width: cq(size * 1.7), height: cq(size * 1.7), background: alpha(primary, 0.14), color: primary }}>
              <Icon style={{ width: "55%", height: "55%" }} />
            </span>
          ) : iconStyle === "plain" ? (
            <Icon style={{ width: cq(size * 1.12), height: cq(size * 1.12), color: primary }} className="shrink-0" />
          ) : null}
          <span dir="ltr" className="truncate">{text}</span>
        </div>
      ))}
    </div>
  );
}

const svgUrl = (svg: string) => `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;

/** Decorative background pattern drawn in the face's text colour at low opacity. */
export function PatternLayer({ pattern, color }: { pattern: Pattern; color: string }) {
  if (pattern === "none") return null;
  const c = alpha(color, pattern === "circles" ? 0.16 : 0.1);
  const styles: Record<Exclude<Pattern, "none">, React.CSSProperties> = {
    dots: { backgroundImage: `radial-gradient(${c} 0.32cqw, transparent 0.38cqw)`, backgroundSize: "3.4cqw 3.4cqw" },
    grid: {
      backgroundImage: `linear-gradient(to right, ${c} 0.1cqw, transparent 0.1cqw), linear-gradient(to bottom, ${c} 0.1cqw, transparent 0.1cqw)`,
      backgroundSize: "4.5cqw 4.5cqw",
    },
    lines: { backgroundImage: `repeating-linear-gradient(135deg, ${c} 0 0.12cqw, transparent 0.12cqw 2.4cqw)` },
    waves: {
      backgroundImage: svgUrl(`<svg xmlns="http://www.w3.org/2000/svg" width="120" height="40" viewBox="0 0 120 40"><path d="M0 20 Q 30 0 60 20 T 120 20" fill="none" stroke="${c}" stroke-width="2"/></svg>`),
      backgroundSize: "16cqw 5.3cqw",
    },
    circles: {
      backgroundImage: `radial-gradient(circle at 88% 12%, transparent 17cqw, ${c} 17cqw, ${c} 17.4cqw, transparent 17.4cqw), radial-gradient(circle at 88% 12%, transparent 24cqw, ${c} 24cqw, ${c} 24.3cqw, transparent 24.3cqw), radial-gradient(circle at 6% 104%, transparent 12cqw, ${c} 12cqw, ${c} 12.4cqw, transparent 12.4cqw)`,
    },
  };
  return <div aria-hidden className="pointer-events-none absolute inset-0" style={styles[pattern]} />;
}

/** Face background: colour/gradient, or an uploaded image with a colour overlay for legibility. */
export function FaceBackground({ face, image, overlay }: { face: CardFaceDesign; image?: string; overlay?: number }) {
  if (!image) return <div aria-hidden className="absolute inset-0" style={{ background: faceBackground(face) }} />;
  return (
    <>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={image} alt="" aria-hidden className="absolute inset-0 size-full object-cover" />
      <div aria-hidden className="absolute inset-0" style={{ background: faceBackground(face), opacity: (overlay ?? 55) / 100 }} />
    </>
  );
}
