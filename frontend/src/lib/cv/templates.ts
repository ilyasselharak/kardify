import type { CvDesign, CvLang, CvSectionKey, CvTemplateId } from "./types";

export type CvHeaderStyle = "side" | "band" | "inline" | "centered" | "split" | "tech" | "academic" | "elegant";
export type CvTitleStyle = "underline" | "smallcaps" | "bar" | "pill" | "ruled-center" | "code" | "rule-below" | "serif-italic";
export type CvEntryStyle = "standard" | "timeline" | "date-left";

export interface CvTemplateDef {
  id: CvTemplateId;
  category: "modern" | "minimal" | "corporate" | "creative" | "executive" | "technical" | "academic" | "elegant";
  /** Single column, real text, standard headings: parses cleanly in applicant tracking systems. */
  ats: boolean;
  header: CvHeaderStyle;
  /** Where the header sits: across the page top, in the main column or in the sidebar. */
  headerPlacement: "full" | "main" | "side";
  sidebar?: {
    side: "start" | "end";
    widthMm: number;
    /** Sidebar background: solid accent, accent tint or neutral tint. */
    tone: "accent" | "tint" | "neutral";
    sections: CvSectionKey[];
    /** Show the contact list at the top of the sidebar. */
    contact: boolean;
  };
  title: CvTitleStyle;
  entry: CvEntryStyle;
  defaults: CvDesign;
}

const design = (d: Partial<CvDesign>): CvDesign => ({
  accentColor: "#006afe",
  textColor: "#1f2937",
  fontFamily: "inter",
  headingFont: "inter",
  fontScale: "md",
  spacing: "normal",
  margins: "normal",
  skillStyle: "tags",
  dateFormat: "short",
  showPhoto: true,
  showIcons: true,
  ...d,
});

const SIDE_SECTIONS: CvSectionKey[] = ["skills", "languages", "certifications", "interests"];

export const CV_TEMPLATES: Record<CvTemplateId, CvTemplateDef> = {
  modern: {
    id: "modern", category: "modern", ats: false, header: "side", headerPlacement: "side",
    sidebar: { side: "start", widthMm: 68, tone: "accent", sections: SIDE_SECTIONS, contact: true },
    title: "underline", entry: "standard",
    defaults: design({ accentColor: "#0d1e37", fontFamily: "inter", headingFont: "inter", skillStyle: "bars" }),
  },
  minimal: {
    id: "minimal", category: "minimal", ats: true, header: "inline", headerPlacement: "full",
    title: "smallcaps", entry: "standard",
    defaults: design({ accentColor: "#111827", textColor: "#111827", fontFamily: "inter", headingFont: "inter", skillStyle: "list", showPhoto: false, showIcons: false }),
  },
  corporate: {
    id: "corporate", category: "corporate", ats: true, header: "band", headerPlacement: "full",
    title: "bar", entry: "standard",
    defaults: design({ accentColor: "#0d1e37", fontFamily: "inter", headingFont: "montserrat", skillStyle: "tags" }),
  },
  creative: {
    id: "creative", category: "creative", ats: false, header: "split", headerPlacement: "main",
    sidebar: { side: "end", widthMm: 64, tone: "tint", sections: SIDE_SECTIONS, contact: true },
    title: "pill", entry: "timeline",
    defaults: design({ accentColor: "#7c3aed", fontFamily: "poppins", headingFont: "poppins", skillStyle: "tags" }),
  },
  executive: {
    id: "executive", category: "executive", ats: true, header: "centered", headerPlacement: "full",
    title: "ruled-center", entry: "standard",
    defaults: design({ accentColor: "#8a6a3b", textColor: "#1f2937", fontFamily: "lora", headingFont: "playfair", skillStyle: "list", showPhoto: false }),
  },
  technical: {
    id: "technical", category: "technical", ats: true, header: "tech", headerPlacement: "full",
    title: "code", entry: "standard",
    defaults: design({ accentColor: "#006afe", textColor: "#0f172a", fontFamily: "inter", headingFont: "spacegrotesk", skillStyle: "tags", showPhoto: false }),
  },
  academic: {
    id: "academic", category: "academic", ats: true, header: "academic", headerPlacement: "full",
    title: "rule-below", entry: "date-left",
    defaults: design({ accentColor: "#1e3a8a", fontFamily: "lora", headingFont: "lora", skillStyle: "list", dateFormat: "year", showPhoto: false, showIcons: false }),
  },
  elegant: {
    id: "elegant", category: "elegant", ats: false, header: "elegant", headerPlacement: "full",
    sidebar: { side: "end", widthMm: 62, tone: "neutral", sections: SIDE_SECTIONS, contact: true },
    title: "serif-italic", entry: "standard",
    defaults: design({ accentColor: "#a67c52", textColor: "#2b2118", fontFamily: "lora", headingFont: "playfair", skillStyle: "bars" }),
  },
};

const ARABIC_FONT = "cairo";
const LATIN_ONLY = new Set(["poppins", "montserrat", "lora", "playfair", "spacegrotesk", "inter"]);

/**
 * Template defaults + the CV's stored overrides. Arabic CVs default to an Arabic typeface
 * (a stored choice is always respected; Latin fonts still fall back to an Arabic font per glyph).
 */
export function normalizeCvDesign(template: CvTemplateId, stored: Partial<CvDesign> | undefined, language: CvLang): CvDesign {
  const def = (CV_TEMPLATES[template] ?? CV_TEMPLATES.modern).defaults;
  const d = { ...def, ...(stored ?? {}) };
  if (language === "ar") {
    if (!stored?.fontFamily && LATIN_ONLY.has(def.fontFamily)) d.fontFamily = ARABIC_FONT;
    if (!stored?.headingFont && LATIN_ONLY.has(def.headingFont)) d.headingFont = ARABIC_FONT;
  }
  return d;
}

export const CV_FONT_VAR: Record<CvDesign["fontFamily"], string> = {
  inter: "var(--font-inter)",
  poppins: "var(--font-poppins)",
  montserrat: "var(--font-montserrat)",
  lora: "var(--font-lora)",
  playfair: "var(--font-playfair)",
  spacegrotesk: "var(--font-spacegrotesk)",
  cairo: "var(--font-cairo)",
  tajawal: "var(--font-tajawal)",
};
