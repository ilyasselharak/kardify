"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { pickContrast } from "@/components/cards/card-parts";
import { FONT_PX, MARGIN_MM, MM, PAGE_H, PAGE_W, pageGeometry, paginateDocument, SPACING } from "@/lib/cv/paginate";
import { CV_FONT_VAR, CV_TEMPLATES, normalizeCvDesign, type CvTemplateDef } from "@/lib/cv/templates";
import type { CvDesign, CvDocument } from "@/lib/cv/types";
import { cn } from "@/lib/utils";
import { buildCvBlocks, type CvBlock } from "./cv-blocks";

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

function cssVars(design: CvDesign, tpl: CvTemplateDef, marginPx: number): React.CSSProperties {
  const tone = tpl.sidebar?.tone;
  const sideBg = tone === "accent" ? design.accentColor : tone === "tint" ? `color-mix(in srgb, ${design.accentColor} 8%, white)` : "#f5f3ef";
  const sideText = tone === "accent" ? pickContrast(design.accentColor) : design.textColor;
  return {
    "--cv-accent": design.accentColor,
    "--cv-on-accent": pickContrast(design.accentColor),
    "--cv-text": design.textColor,
    "--cv-muted": `color-mix(in srgb, ${design.textColor} 64%, white)`,
    "--cv-side-bg": sideBg,
    "--cv-side-text": sideText,
    "--cv-side-heading": tone === "accent" ? sideText : design.accentColor,
    "--cv-font": CV_FONT_VAR[design.fontFamily],
    "--cv-heading-font": CV_FONT_VAR[design.headingFont],
    "--cv-s": SPACING[design.spacing],
    "--cv-margin": `${marginPx}px`,
    fontSize: `${FONT_PX[design.fontScale]}px`,
  } as React.CSSProperties;
}

function useCvModel(doc: CvDocument, links = true) {
  return useMemo(() => {
    const tpl = CV_TEMPLATES[doc.template] ?? CV_TEMPLATES.modern;
    const design = normalizeCvDesign(tpl.id, doc.design, doc.language);
    const blocks = buildCvBlocks(doc, tpl, design, links);
    const marginPx = MARGIN_MM[design.margins] * MM;
    return { tpl, design, blocks, marginPx, vars: cssVars(design, tpl, marginPx), geometry: pageGeometry(design, tpl.headerPlacement) };
  }, [doc, links]);
}

function Block({ block }: { block: CvBlock }) {
  return (
    <div data-b={block.key} className="flow-root" style={{ paddingBottom: `calc(${block.gap}px * var(--cv-s))` }}>
      {block.node}
    </div>
  );
}

/** Column paddings shared by the measuring pass and the visible pages, so widths match exactly. */
function columnStyles(tpl: CvTemplateDef, marginPx: number) {
  const s = tpl.sidebar;
  const gutter = 7 * MM;
  const sideW = s ? s.widthMm * MM : 0;
  return {
    side: s ? ({ width: sideW, flexShrink: 0, paddingInline: `${Math.round(marginPx * 0.75)}px`, color: "var(--cv-side-text)" } as React.CSSProperties) : undefined,
    main: {
      flex: 1,
      minWidth: 0,
      paddingInlineStart: s?.side === "start" ? gutter : marginPx,
      paddingInlineEnd: s?.side === "end" ? gutter : marginPx,
    } as React.CSSProperties,
    sideW,
  };
}

function Columns({ tpl, marginPx, side, main, style }: { tpl: CvTemplateDef; marginPx: number; side: React.ReactNode; main: React.ReactNode; style?: React.CSSProperties }) {
  const cols = columnStyles(tpl, marginPx);
  const sideEl = tpl.sidebar ? <div data-m="side" className="cv-col" style={cols.side}>{side}</div> : null;
  const mainEl = <div data-m="main" className="cv-col" style={cols.main}>{main}</div>;
  return (
    <div className="flex" style={style}>
      {tpl.sidebar?.side === "start" ? <>{sideEl}{mainEl}</> : <>{mainEl}{sideEl}</>}
    </div>
  );
}

interface Layout {
  epoch: number;
  headerH: number;
  pages: { main: number[]; side: number[] }[];
}

/**
 * Paginated A4 rendering. A hidden pass measures every block at the exact column width; the
 * blocks are then distributed over 210×297 mm pages. Used by the editor, the public page and
 * the PDF renderer (which waits for `data-cv-ready="true"`).
 */
export function CvPaged({ doc, zoom = 1, maxPages, className, onPages, links = true }: {
  doc: CvDocument;
  /** Disable anchors (thumbnails inside links or buttons). */
  links?: boolean;
  zoom?: number;
  maxPages?: number;
  className?: string;
  onPages?: (count: number) => void;
}) {
  const { tpl, blocks, marginPx, vars, geometry } = useCvModel(doc, links);
  const measureRef = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState<Layout | null>(null);
  const [fontsReady, setFontsReady] = useState<boolean>(() => typeof document !== "undefined" && !document.fonts);
  const [fontEpoch, setFontEpoch] = useState(0);

  useEffect(() => {
    let active = true;
    const fonts = document.fonts;
    if (!fonts) return;
    void fonts.ready.then(() => active && (setFontsReady(true), setFontEpoch((n) => n + 1)));
    const onDone = () => active && setFontEpoch((n) => n + 1);
    fonts.addEventListener?.("loadingdone", onDone);
    return () => {
      active = false;
      fonts.removeEventListener?.("loadingdone", onDone);
    };
  }, []);

  useIsoLayoutEffect(() => {
    const root = measureRef.current;
    if (!root) return;
    // Divide by the rendered scale so ancestor transforms (dialog animations, zoom) never skew heights.
    const scale = root.getBoundingClientRect().width / PAGE_W || 1;
    const heights = (col: string) =>
      [...root.querySelectorAll<HTMLElement>(`[data-m="${col}"] > [data-b]`)].map((el) => el.getBoundingClientRect().height / scale);
    const mainH = heights("main");
    const sideH = heights("side");
    const headerH = (root.querySelector<HTMLElement>("[data-m=header]")?.getBoundingClientRect().height ?? 0) / scale;
    const pages = paginateDocument({
      main: blocks.main.map((b, i) => ({ height: mainH[i] ?? 0, keepWithNext: b.keepWithNext })),
      side: blocks.side.map((b, i) => ({ height: sideH[i] ?? 0, keepWithNext: b.keepWithNext })),
      headerHeight: headerH,
      geometry,
    });
    const next = { headerH, pages, epoch: fontEpoch };
    setLayout((prev) => (prev && JSON.stringify(prev) === JSON.stringify(next) ? prev : next));
  }, [blocks, tpl, geometry, fontEpoch]);

  useEffect(() => {
    if (layout) onPages?.(layout.pages.length);
  }, [layout, onPages]);

  const dir = doc.language === "ar" ? "rtl" : "ltr";
  const full = tpl.headerPlacement === "full";
  const { sideW } = columnStyles(tpl, marginPx);
  const pages = layout ? (maxPages ? layout.pages.slice(0, maxPages) : layout.pages) : [];

  return (
    <div className={cn("cv-root", className)} dir={dir} lang={doc.language} style={vars} data-cv-ready={layout && fontsReady && layout.epoch === fontEpoch ? "true" : "false"} data-pages={layout?.pages.length ?? 0}>
      {/* Measuring pass: same widths and styles, never visible. */}
      <div className="cv-measure-clip" aria-hidden>
        <div ref={measureRef} className="cv-measure" style={{ width: PAGE_W }}>
          {full && <div data-m="header" className="flow-root">{blocks.header}</div>}
          <Columns tpl={tpl} marginPx={marginPx} side={blocks.side.map((b) => <Block key={b.key} block={b} />)} main={blocks.main.map((b) => <Block key={b.key} block={b} />)} />
        </div>
      </div>

      <div className="cv-zoom" style={{ zoom }}>
        {pages.map((p, i) => {
          const top = i === 0 && full ? (layout?.headerH ?? 0) : marginPx;
          return (
            <section key={i} className="cv-page" style={{ width: PAGE_W, height: PAGE_H }} aria-label={`${i + 1} / ${pages.length}`}>
              {tpl.sidebar && (
                <div
                  aria-hidden
                  className="absolute bottom-0"
                  style={{ top: i === 0 && full ? top : 0, width: sideW, background: "var(--cv-side-bg)", [tpl.sidebar.side === "start" ? "insetInlineStart" : "insetInlineEnd"]: 0 }}
                />
              )}
              {i === 0 && full && <div className="absolute inset-x-0 top-0 flow-root">{blocks.header}</div>}
              <Columns
                tpl={tpl}
                marginPx={marginPx}
                style={{ position: "absolute", top, bottom: marginPx, insetInline: 0 }}
                // The layout may still describe the previous content for one render (it is recomputed
                // in a layout effect before paint), so skip indexes that no longer exist.
                side={p.side.filter((idx) => blocks.side[idx]).map((idx) => <Block key={blocks.side[idx].key} block={blocks.side[idx]} />)}
                main={p.main.filter((idx) => blocks.main[idx]).map((idx) => <Block key={blocks.main[idx].key} block={blocks.main[idx]} />)}
              />
            </section>
          );
        })}
      </div>
    </div>
  );
}

/**
 * Continuous (non-paginated) rendering for small screens: same template styles, columns stacked.
 */
export function CvFlow({ doc, className }: { doc: CvDocument; className?: string }) {
  const { tpl, blocks, vars } = useCvModel(doc);
  const flowVars = { ...vars, "--cv-margin": "22px" } as React.CSSProperties;
  const sideFirst = tpl.headerPlacement === "side";
  const side = blocks.side.length ? (
    <div data-m="side" className="px-[22px] pt-[22px] pb-[8px]" style={{ background: "var(--cv-side-bg)", color: "var(--cv-side-text)" }}>
      {blocks.side.map((b) => <Block key={b.key} block={b} />)}
    </div>
  ) : null;
  return (
    <div className={cn("cv-root cv-flow overflow-hidden bg-white", className)} dir={doc.language === "ar" ? "rtl" : "ltr"} lang={doc.language} style={flowVars}>
      {blocks.header}
      {sideFirst && side}
      <div className="px-[22px] pt-[18px] pb-[8px]">{blocks.main.map((b) => <Block key={b.key} block={b} />)}</div>
      {!sideFirst && side}
    </div>
  );
}
