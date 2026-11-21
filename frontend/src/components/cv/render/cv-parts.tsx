import { Globe, Link2, Mail, MapPin, Phone } from "lucide-react";
import { SocialIcon } from "@/components/cards/social-icons";
import { CV_LABELS, displayUrl } from "@/lib/cv/labels";
import type { CvTemplateDef } from "@/lib/cv/templates";
import type { CvDesign, CvDocument, CvLang } from "@/lib/cv/types";
import { cn, initials } from "@/lib/utils";

export interface RenderCtx {
  doc: CvDocument;
  tpl: CvTemplateDef;
  design: CvDesign;
  lang: CvLang;
  labels: (typeof CV_LABELS)[CvLang];
  /** False for thumbnails (they sit inside links/buttons, where nested anchors are invalid). */
  links: boolean;
}

/** An anchor, or plain text when links are disabled. */
export function CvLink({ ctx, href, className, dir, children }: { ctx: RenderCtx; href: string; className?: string; dir?: "ltr"; children: React.ReactNode }) {
  return ctx.links ? <a href={href} className={className} dir={dir}>{children}</a> : <span className={className} dir={dir}>{children}</span>;
}

/** `calc(n px × spacing)` so every gap follows the spacing setting. */
export const sp = (n: number) => `calc(${n}px * var(--cv-s))`;

// ─── Contact ───────────────────────────────────────────────────────────

export interface ContactItem {
  key: string;
  icon: React.ReactNode;
  text: string;
  href?: string;
}

export function contactItems(doc: CvDocument): ContactItem[] {
  const p = doc.profile;
  const location = [p.address, p.city, p.country].filter(Boolean).join(", ");
  const icon = (n: React.ReactNode) => n;
  return [
    p.email && { key: "email", icon: icon(<Mail />), text: p.email, href: `mailto:${p.email}` },
    p.phone && { key: "phone", icon: icon(<Phone />), text: p.phone, href: `tel:${p.phone.replace(/[^\d+]/g, "")}` },
    location && { key: "location", icon: icon(<MapPin />), text: location },
    p.website && { key: "website", icon: icon(<Globe />), text: displayUrl(p.website), href: p.website },
    p.linkedin && { key: "linkedin", icon: icon(<SocialIcon platform="linkedin" />), text: displayUrl(p.linkedin), href: p.linkedin },
    p.github && { key: "github", icon: icon(<SocialIcon platform="github" />), text: displayUrl(p.github), href: p.github },
    p.portfolio && { key: "portfolio", icon: icon(<Link2 />), text: displayUrl(p.portfolio), href: p.portfolio },
  ].filter(Boolean) as ContactItem[];
}

export function ContactValue({ ctx, item, showIcon, className }: { ctx: RenderCtx; item: ContactItem; showIcon: boolean; className?: string }) {
  const body = (
    <>
      {showIcon && <span className="cv-icon" aria-hidden>{item.icon}</span>}
      <span dir={item.key === "location" ? "auto" : "ltr"} className="min-w-0 break-words">{item.text}</span>
    </>
  );
  const cls = cn("inline-flex min-w-0 items-center gap-[0.45em]", className);
  return item.href ? <CvLink ctx={ctx} href={item.href} className={cls}>{body}</CvLink> : <span className={cls}>{body}</span>;
}

export function ContactList({ ctx, layout = "stack", className }: { ctx: RenderCtx; layout?: "stack" | "inline" | "grid"; className?: string }) {
  const items = contactItems(ctx.doc);
  if (!items.length) return null;
  if (layout === "inline") {
    return (
      <div className={cn("flex flex-wrap items-center gap-x-[1.1em] gap-y-[0.35em]", className)}>
        {items.map((it) => <ContactValue key={it.key} ctx={ctx} item={it} showIcon={ctx.design.showIcons} />)}
      </div>
    );
  }
  return (
    <div className={cn(layout === "grid" ? "grid grid-cols-2 gap-x-[1.2em] gap-y-[0.4em]" : "grid gap-[0.5em]", className)}>
      {items.map((it) => <ContactValue key={it.key} ctx={ctx} item={it} showIcon={ctx.design.showIcons} />)}
    </div>
  );
}

// ─── Photo / name ──────────────────────────────────────────────────────

export function CvPhoto({ ctx, size, radius = "9999px", ring }: { ctx: RenderCtx; size: string; radius?: string; ring?: string }) {
  const { profile } = ctx.doc;
  if (!ctx.design.showPhoto) return null;
  return (
    <div className="shrink-0 overflow-hidden" style={{ width: size, height: size, borderRadius: radius, boxShadow: ring ? `0 0 0 3px ${ring}` : undefined, background: "color-mix(in srgb, var(--cv-accent) 14%, white)" }}>
      {profile.photo ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={profile.photo} alt="" className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center font-semibold" style={{ fontSize: `calc(${size} * 0.36)`, color: "var(--cv-accent)" }}>
          {initials(profile.fullName || "CV")}
        </div>
      )}
    </div>
  );
}

const Name = ({ ctx, className, style }: { ctx: RenderCtx; className?: string; style?: React.CSSProperties }) => (
  <h1 dir="auto" className={cn("cv-heading break-words", className)} style={style}>{ctx.doc.profile.fullName || "—"}</h1>
);
const Title = ({ ctx, className, style }: { ctx: RenderCtx; className?: string; style?: React.CSSProperties }) =>
  ctx.doc.profile.professionalTitle ? <p dir="auto" className={className} style={style}>{ctx.doc.profile.professionalTitle}</p> : null;

/** Padding used by full-width headers (they replace the page's top margin on page 1). */
const headerPad = { paddingTop: "var(--cv-margin)", paddingInline: "var(--cv-margin)", paddingBottom: sp(18) } as const;

export function CvHeader({ ctx, sideContact }: { ctx: RenderCtx; sideContact: boolean }) {
  const { tpl } = ctx;
  const contact = !sideContact;
  switch (tpl.header) {
    case "side":
      return (
        <div className="grid justify-items-center gap-[0.6em] text-center" style={{ paddingBottom: sp(14) }}>
          <CvPhoto ctx={ctx} size="30mm" ring="color-mix(in srgb, var(--cv-side-text) 35%, transparent)" />
          <Name ctx={ctx} className="text-[2em] leading-[1.1] font-bold" style={{ color: "var(--cv-side-text)" }} />
          <Title ctx={ctx} className="cv-track text-[0.95em] font-medium uppercase tracking-[0.12em] opacity-85" />
        </div>
      );
    case "band":
      // Padding (not margin) below the band so the measured header height includes the gap.
      return (
        <div style={{ paddingBottom: sp(14) }}>
          <div className="cv-on-accent" style={{ ...headerPad, background: "var(--cv-accent)", color: "var(--cv-on-accent)" }}>
            <div className="flex items-center gap-[1.4em]">
              <div className="min-w-0 flex-1">
                <Name ctx={ctx} className="text-[2.35em] leading-[1.08] font-bold" />
                <Title ctx={ctx} className="mt-[0.25em] text-[1.1em] font-medium opacity-90" />
              </div>
              <CvPhoto ctx={ctx} size="27mm" radius="18%" ring="color-mix(in srgb, var(--cv-on-accent) 30%, transparent)" />
            </div>
            {contact && <ContactList ctx={ctx} layout="inline" className="mt-[1.1em] text-[0.88em] opacity-95" />}
          </div>
        </div>
      );
    case "inline":
      return (
        <div style={headerPad}>
          <div className="flex items-end justify-between gap-[1.2em] border-b pb-[0.9em]" style={{ borderColor: "color-mix(in srgb, var(--cv-text) 15%, transparent)" }}>
            <div className="min-w-0">
              <Name ctx={ctx} className="text-[2.5em] leading-[1.05] font-semibold tracking-tight" />
              <Title ctx={ctx} className="mt-[0.3em] text-[1.1em] text-[var(--cv-muted)]" />
            </div>
            <CvPhoto ctx={ctx} size="22mm" radius="8px" />
          </div>
          {contact && <ContactList ctx={ctx} layout="inline" className="mt-[0.8em] text-[0.9em] text-[var(--cv-muted)]" />}
        </div>
      );
    case "centered":
      return (
        <div className="grid justify-items-center text-center" style={headerPad}>
          <CvPhoto ctx={ctx} size="24mm" ring="var(--cv-accent)" />
          <Name ctx={ctx} className="cv-track mt-[0.4em] text-[2.3em] leading-[1.1] font-semibold tracking-[0.12em] uppercase" />
          <Title ctx={ctx} className="cv-track mt-[0.35em] text-[1em] tracking-[0.18em] uppercase" style={{ color: "var(--cv-accent)" }} />
          {contact && <ContactList ctx={ctx} layout="inline" className="mt-[0.9em] justify-center text-[0.88em] text-[var(--cv-muted)]" />}
          <div className="mt-[1em] grid w-full gap-[2px]">
            <div className="h-[1.5px]" style={{ background: "var(--cv-accent)" }} />
            <div className="h-px" style={{ background: "var(--cv-accent)", opacity: 0.5 }} />
          </div>
        </div>
      );
    case "split":
      return (
        <div className="flex items-center gap-[1.3em]" style={{ paddingBottom: sp(16) }}>
          <CvPhoto ctx={ctx} size="28mm" radius="22%" />
          <div className="min-w-0">
            <Name ctx={ctx} className="text-[2.6em] leading-[1.02] font-extrabold" style={{ color: "var(--cv-accent)" }} />
            <Title ctx={ctx} className="mt-[0.35em] text-[1.15em] font-medium" />
            <div className="mt-[0.7em] h-[4px] w-[16mm] rounded-full" style={{ background: "var(--cv-accent)" }} />
          </div>
        </div>
      );
    case "tech":
      return (
        <div style={headerPad}>
          <div className="flex items-start justify-between gap-[1.5em] pb-[0.9em]" style={{ borderBottom: "2px solid var(--cv-accent)" }}>
            <div className="min-w-0">
              <Name ctx={ctx} className="text-[2.3em] leading-[1.05] font-bold" />
              <Title ctx={ctx} className="cv-heading mt-[0.3em] text-[1.1em] font-medium" style={{ color: "var(--cv-accent)" }} />
            </div>
            {contact && <ContactList ctx={ctx} layout="grid" className="max-w-[58%] shrink-0 text-[0.84em]" />}
          </div>
        </div>
      );
    case "academic":
      return (
        <div style={headerPad}>
          <div className="flex items-start justify-between gap-[1.5em] pb-[0.8em]" style={{ borderBottom: "1px solid color-mix(in srgb, var(--cv-text) 35%, transparent)" }}>
            <div className="min-w-0">
              <Name ctx={ctx} className="text-[2.2em] leading-[1.1] font-bold" />
              <Title ctx={ctx} className="mt-[0.25em] text-[1.05em] italic" style={{ color: "var(--cv-accent)" }} />
            </div>
            {contact && <ContactList ctx={ctx} className="shrink-0 text-[0.84em] text-[var(--cv-muted)]" />}
          </div>
        </div>
      );
    case "elegant":
      return (
        <div className="grid justify-items-center text-center" style={headerPad}>
          <CvPhoto ctx={ctx} size="25mm" ring="color-mix(in srgb, var(--cv-accent) 60%, transparent)" />
          <Name ctx={ctx} className="cv-track mt-[0.45em] text-[2.6em] leading-[1.08] font-medium tracking-[0.06em]" />
          {ctx.doc.profile.professionalTitle && (
            <div className="mt-[0.4em] flex w-full items-center gap-[0.9em]">
              <span className="h-px flex-1" style={{ background: "var(--cv-accent)" }} />
              <Title ctx={ctx} className="cv-track text-[0.95em] tracking-[0.22em] uppercase" style={{ color: "var(--cv-accent)" }} />
              <span className="h-px flex-1" style={{ background: "var(--cv-accent)" }} />
            </div>
          )}
          {contact && <ContactList ctx={ctx} layout="inline" className="mt-[0.8em] justify-center text-[0.88em] text-[var(--cv-muted)]" />}
        </div>
      );
  }
}

// ─── Section titles ────────────────────────────────────────────────────

export function SectionTitle({ ctx, text, side }: { ctx: RenderCtx; text: string; side?: boolean }) {
  if (side) {
    return (
      <h2 className="cv-heading cv-track border-b pb-[0.3em] text-[0.92em] font-bold tracking-[0.14em] uppercase" style={{ color: "var(--cv-side-heading)", borderColor: "color-mix(in srgb, var(--cv-side-text) 25%, transparent)" }}>
        {text}
      </h2>
    );
  }
  switch (ctx.tpl.title) {
    case "underline":
      return (
        <h2 className="cv-heading cv-track text-[1.02em] font-bold tracking-[0.1em] uppercase" style={{ color: "var(--cv-accent)" }}>
          {text}
          <span className="mt-[0.3em] block h-[2px] w-[11mm]" style={{ background: "var(--cv-accent)" }} />
        </h2>
      );
    case "smallcaps":
      return (
        <h2 className="cv-heading cv-track border-b pb-[0.35em] text-[0.84em] font-semibold tracking-[0.2em] uppercase text-[var(--cv-muted)]" style={{ borderColor: "color-mix(in srgb, var(--cv-text) 14%, transparent)" }}>
          {text}
        </h2>
      );
    case "bar":
      return (
        <h2 className="cv-heading py-[0.15em] ps-[0.6em] text-[1.18em] font-bold" style={{ borderInlineStart: "4px solid var(--cv-accent)", background: "color-mix(in srgb, var(--cv-accent) 6%, transparent)" }}>
          {text}
        </h2>
      );
    case "pill":
      return (
        <h2 className="cv-heading cv-track inline-block rounded-full px-[0.9em] py-[0.2em] text-[0.95em] font-bold tracking-[0.06em] uppercase" style={{ color: "var(--cv-accent)", background: "color-mix(in srgb, var(--cv-accent) 12%, transparent)" }}>
          {text}
        </h2>
      );
    case "ruled-center":
      return (
        <h2 className="cv-heading cv-track flex items-center gap-[0.8em] text-[0.98em] font-semibold tracking-[0.2em] uppercase" style={{ color: "var(--cv-accent)" }}>
          <span className="h-px flex-1" style={{ background: "color-mix(in srgb, var(--cv-accent) 55%, transparent)" }} />
          {text}
          <span className="h-px flex-1" style={{ background: "color-mix(in srgb, var(--cv-accent) 55%, transparent)" }} />
        </h2>
      );
    case "code":
      return (
        <h2 className="cv-heading flex items-baseline gap-[0.4em] text-[1.15em] font-bold">
          <span aria-hidden style={{ color: "var(--cv-accent)" }}>{"//"}</span>
          {text}
          <span className="ms-[0.3em] h-px flex-1 self-center" style={{ background: "color-mix(in srgb, var(--cv-text) 15%, transparent)" }} />
        </h2>
      );
    case "rule-below":
      return (
        <h2 className="cv-heading border-b pb-[0.2em] text-[1.2em] font-bold" style={{ borderColor: "color-mix(in srgb, var(--cv-text) 40%, transparent)" }}>
          {text}
        </h2>
      );
    case "serif-italic":
      return (
        <h2 className="cv-heading flex items-center gap-[0.7em] text-[1.3em] font-medium italic" style={{ color: "var(--cv-accent)" }}>
          {text}
          <span className="h-px flex-1" style={{ background: "color-mix(in srgb, var(--cv-accent) 40%, transparent)" }} />
        </h2>
      );
  }
}

// ─── Entries ───────────────────────────────────────────────────────────

export function EntryHeader({ ctx, title, org, meta, dates, link, side }: {
  ctx: RenderCtx;
  title: React.ReactNode;
  org?: React.ReactNode;
  meta?: string;
  dates?: string;
  link?: { href: string; text: string }[];
  side?: boolean;
}) {
  const style = side ? "standard" : ctx.tpl.entry;
  const datesEl = dates ? <bdi className="tabular-nums">{dates}</bdi> : null;
  const links = link?.length ? (
    <span className="flex flex-wrap gap-x-[0.8em] text-[0.88em]" style={{ color: "var(--cv-accent)" }}>
      {link.map((l) => <CvLink key={l.href} ctx={ctx} href={l.href} dir="ltr">{l.text}</CvLink>)}
    </span>
  ) : null;

  const main = (
    <div className="min-w-0 flex-1">
      <div className="flex items-baseline justify-between gap-[0.8em]">
        <h3 dir="auto" className="min-w-0 font-semibold leading-[1.3]">{title}</h3>
        {style === "standard" && datesEl && <span className="shrink-0 text-[0.86em] text-[var(--cv-muted)]">{datesEl}</span>}
      </div>
      {(org || meta) && (
        <p dir="auto" className="leading-[1.35]">
          {org && <span className="font-medium" style={{ color: side ? "inherit" : "var(--cv-accent)" }}>{org}</span>}
          {org && meta && <span className="text-[var(--cv-muted)]"> · </span>}
          {meta && <span className="text-[0.92em] text-[var(--cv-muted)]">{meta}</span>}
        </p>
      )}
      {style === "timeline" && datesEl && <p className="text-[0.86em] text-[var(--cv-muted)]">{datesEl}</p>}
      {links}
    </div>
  );

  if (style === "timeline") return <TimelineRow dot>{main}</TimelineRow>;
  if (style === "date-left") return <DateLeftRow date={datesEl}>{main}</DateLeftRow>;
  return main;
}

/** Vertical rail + dot used by the timeline entry style. Rows stack seamlessly across blocks. */
export function TimelineRow({ dot, children }: { dot?: boolean; children: React.ReactNode }) {
  return (
    <div className="relative ps-[1.4em]" style={{ borderInlineStart: "2px solid color-mix(in srgb, var(--cv-accent) 25%, transparent)", marginInlineStart: "0.35em" }}>
      {dot && <span className="absolute top-[0.32em] start-[-0.45em] size-[0.8em] rounded-full border-2 bg-white" style={{ borderColor: "var(--cv-accent)" }} />}
      {children}
    </div>
  );
}

export function DateLeftRow({ date, children }: { date?: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[24mm_minmax(0,1fr)] gap-[1em]">
      <div className="pt-[0.1em] text-[0.86em] text-[var(--cv-muted)]">{date}</div>
      {children}
    </div>
  );
}

/** One paragraph or bullet of free text, wrapped in the entry style's rail/column. */
export function TextLine({ ctx, text, bullet, side, label, strong }: { ctx: RenderCtx; text: string; bullet?: boolean; side?: boolean; label?: string; strong?: boolean }) {
  const content = (
    <p dir="auto" className={cn("leading-[1.5]", bullet && "relative ps-[1.05em]", strong && "pt-[0.3em] font-semibold")}>
      {bullet && <span aria-hidden className="absolute start-[0.15em] top-[0.62em] size-[0.32em] rounded-full" style={{ background: side ? "currentColor" : "var(--cv-accent)" }} />}
      {label && <span className="font-semibold">{label}: </span>}
      {text}
    </p>
  );
  const style = side ? "standard" : ctx.tpl.entry;
  if (style === "timeline") return <TimelineRow>{content}</TimelineRow>;
  if (style === "date-left") return <DateLeftRow>{content}</DateLeftRow>;
  return content;
}
