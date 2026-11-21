/**
 * A4 pagination. Blocks (section titles, entry headers, bullet lines …) are measured once,
 * then distributed over fixed-size pages. The editor preview, the public page and the PDF
 * all render the same page boxes, so what you see is exactly what gets exported.
 */
import type { CvDesign } from "./types";

export const MM = 96 / 25.4; // CSS px per millimetre
export const PAGE_W_MM = 210;
export const PAGE_H_MM = 297;
export const PAGE_W = PAGE_W_MM * MM;
export const PAGE_H = PAGE_H_MM * MM;

export const MARGIN_MM: Record<CvDesign["margins"], number> = { narrow: 11, normal: 15, wide: 20 };
export const FONT_PX: Record<CvDesign["fontScale"], number> = { sm: 12.5, md: 13.5, lg: 14.5 };
export const SPACING: Record<CvDesign["spacing"], number> = { compact: 0.72, normal: 1, relaxed: 1.3 };

export interface MeasuredBlock {
  height: number;
  /** Keep on the same page as the next block (section titles, entry headers). */
  keepWithNext?: boolean;
}

/**
 * Greedy pagination for one column.
 * `capacity(page)` is the usable height of the column on that page.
 * Returns, for each page, the indexes of the blocks it holds.
 *
 * Rules:
 *  - a block plus the chain of blocks it must stay with moves to the next page together;
 *  - if that chain cannot fit even on an empty page, it is broken up;
 *  - a single block taller than a page gets a page of its own (never dropped or clipped).
 */
export function paginateColumn(blocks: MeasuredBlock[], capacity: (page: number) => number, tolerance = 0.5): number[][] {
  const pages: number[][] = [[]];
  let page = 0;
  let used = 0;
  let i = 0;
  while (i < blocks.length) {
    let end = i;
    let groupHeight = blocks[i].height;
    while (blocks[end].keepWithNext && end + 1 < blocks.length) {
      end++;
      groupHeight += blocks[end].height;
    }
    const cap = capacity(page);
    if (used + groupHeight <= cap + tolerance) {
      for (let k = i; k <= end; k++) pages[page].push(k);
      used += groupHeight;
      i = end + 1;
      continue;
    }
    if (used === 0) {
      // Even an empty page cannot hold the whole chain: place blocks one at a time.
      pages[page].push(i);
      used += blocks[i].height;
      i++;
      if (used > cap + tolerance) {
        page++;
        pages.push([]);
        used = 0;
      }
      continue;
    }
    page++;
    pages.push([]);
    used = 0;
  }
  while (pages.length > 1 && pages[pages.length - 1].length === 0) pages.pop();
  return pages;
}

export interface PageGeometry {
  marginPx: number;
  /** Usable column height on a page, given the header height on page 1. */
  columnHeight: (page: number, headerHeight: number) => number;
}

export function pageGeometry(design: Pick<CvDesign, "margins">, headerPlacement: "full" | "main" | "side"): PageGeometry {
  const marginPx = MARGIN_MM[design.margins] * MM;
  return {
    marginPx,
    columnHeight: (page, headerHeight) => {
      // A full-width header replaces the top margin on page 1 (it carries its own padding).
      const top = page === 0 && headerPlacement === "full" ? headerHeight : marginPx;
      return PAGE_H - top - marginPx;
    },
  };
}

/** Splits both columns into the same number of pages. */
export function paginateDocument(opts: {
  main: MeasuredBlock[];
  side: MeasuredBlock[];
  headerHeight: number;
  geometry: PageGeometry;
}) {
  const { main, side, headerHeight, geometry } = opts;
  const mainPages = paginateColumn(main, (p) => geometry.columnHeight(p, headerHeight));
  const sidePages = side.length ? paginateColumn(side, (p) => geometry.columnHeight(p, headerHeight)) : [[]];
  const count = Math.max(mainPages.length, sidePages.length, 1);
  return Array.from({ length: count }, (_, p) => ({ main: mainPages[p] ?? [], side: sidePages[p] ?? [] }));
}
