import type { DesignSettings, TemplateId } from "./types";

/** Same presets as backend/src/card-design/templates.ts (kept local for instant previews). */
const solid = (backgroundColor: string, textColor: string) => ({
  backgroundType: "solid" as const, backgroundColor, gradientFrom: backgroundColor, gradientTo: backgroundColor, gradientAngle: 135, textColor,
});
const gradient = (from: string, to: string, textColor: string, angle = 135) => ({
  backgroundType: "gradient" as const, backgroundColor: from, gradientFrom: from, gradientTo: to, gradientAngle: angle, textColor,
});

export const TEMPLATES: Record<TemplateId, DesignSettings> = {
  classic: {
    template: "classic", ...solid("#ffffff", "#0d1e37"), primaryColor: "#006afe", fontFamily: "inter", fontSize: "md",
    borderRadius: 16, layout: "centered", photoShape: "circle", logoPosition: "top-end", socialIconStyle: "filled",
    back: { ...solid("#0d1e37", "#ffffff"), showQr: true, tagline: "" },
  },
  modern: {
    template: "modern", ...solid("#f7f9fc", "#0d1e37"), primaryColor: "#006afe", fontFamily: "poppins", fontSize: "md",
    borderRadius: 24, layout: "banner", photoShape: "rounded", logoPosition: "top-start", socialIconStyle: "outline",
    back: { ...gradient("#006afe", "#0d1e37", "#ffffff"), showQr: true, tagline: "" },
  },
  minimal: {
    template: "minimal", ...solid("#ffffff", "#111827"), primaryColor: "#111827", fontFamily: "inter", fontSize: "sm",
    borderRadius: 8, layout: "left", photoShape: "square", logoPosition: "hidden", socialIconStyle: "minimal",
    back: { ...solid("#ffffff", "#111827"), showQr: true, tagline: "" },
  },
  corporate: {
    template: "corporate", ...solid("#0d1e37", "#ffffff"), primaryColor: "#3b8bff", fontFamily: "montserrat", fontSize: "md",
    borderRadius: 12, layout: "split", photoShape: "rounded", logoPosition: "top-start", socialIconStyle: "filled",
    back: { ...solid("#ffffff", "#0d1e37"), showQr: true, tagline: "" },
  },
  creative: {
    template: "creative", ...gradient("#ff7a59", "#ffb347", "#1f1300", 160), primaryColor: "#1f1300", fontFamily: "poppins",
    fontSize: "lg", borderRadius: 28, layout: "centered", photoShape: "circle", logoPosition: "bottom", socialIconStyle: "filled",
    back: { ...solid("#1f1300", "#ffb347"), showQr: true, tagline: "" },
  },
  elegant: {
    template: "elegant", ...solid("#faf7f2", "#2b2118"), primaryColor: "#a67c52", fontFamily: "playfair", fontSize: "md",
    borderRadius: 4, layout: "centered", photoShape: "circle", logoPosition: "bottom", socialIconStyle: "outline",
    back: { ...solid("#2b2118", "#e9d8c4"), showQr: true, tagline: "" },
  },
  dark: {
    template: "dark", ...solid("#0b0f17", "#e5eaf1"), primaryColor: "#4d9bff", fontFamily: "inter", fontSize: "md",
    borderRadius: 20, layout: "left", photoShape: "rounded", logoPosition: "top-end", socialIconStyle: "outline",
    back: { ...solid("#111827", "#e5eaf1"), showQr: true, tagline: "" },
  },
  gradient: {
    template: "gradient", ...gradient("#006afe", "#7c3aed", "#ffffff"), primaryColor: "#ffffff", fontFamily: "montserrat",
    fontSize: "md", borderRadius: 24, layout: "centered", photoShape: "circle", logoPosition: "top-end", socialIconStyle: "filled",
    back: { ...gradient("#7c3aed", "#006afe", "#ffffff"), showQr: true, tagline: "" },
  },
};

export function templateDesign(id: TemplateId): DesignSettings {
  return structuredClone(TEMPLATES[id]);
}

/** Ensures a stored design has every field (older/partial JSON is filled from its template). */
export function normalizeDesign(input: Partial<DesignSettings> | null | undefined): DesignSettings {
  const base = templateDesign((input?.template as TemplateId) ?? "classic");
  return { ...base, ...(input ?? {}), back: { ...base.back, ...(input?.back ?? {}) } };
}

export function faceBackground(face: { backgroundType: string; backgroundColor: string; gradientFrom: string; gradientTo: string; gradientAngle: number }) {
  return face.backgroundType === "gradient"
    ? `linear-gradient(${face.gradientAngle}deg, ${face.gradientFrom}, ${face.gradientTo})`
    : face.backgroundColor;
}

export const FONT_CLASS: Record<DesignSettings["fontFamily"], string> = {
  inter: "font-inter",
  poppins: "font-poppins",
  playfair: "font-playfair",
  montserrat: "font-montserrat",
  cairo: "font-cairo",
  tajawal: "font-tajawal",
};
