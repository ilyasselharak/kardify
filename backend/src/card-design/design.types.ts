/**
 * Card design settings, stored as JSON in BusinessCard.designSettings.
 * The frontend mirrors this contract in `frontend/src/lib/design/types.ts`.
 * New fields are optional in stored JSON: older cards are completed from their template.
 */
export const TEMPLATE_IDS = [
  'classic', 'modern', 'minimal', 'corporate', 'creative', 'elegant', 'dark', 'gradient',
  'clean', 'diagonal', 'luxe', 'aurora', 'noir', 'tech', 'startup', 'executive',
] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const TEMPLATE_CATEGORIES = ['minimal', 'corporate', 'creative', 'elegant', 'gradient', 'dark', 'tech', 'classic'] as const;
export type TemplateCategory = (typeof TEMPLATE_CATEGORIES)[number];

export const FONT_FAMILIES = ['inter', 'poppins', 'playfair', 'montserrat', 'cairo', 'tajawal', 'lora', 'spacegrotesk', 'jetbrains'] as const;
export const FONT_SIZES = ['sm', 'md', 'lg'] as const;
export const LAYOUTS = ['centered', 'left', 'split', 'banner', 'diagonal', 'frame', 'editorial', 'sidebar', 'monogram', 'orbit'] as const;
export const PHOTO_SHAPES = ['circle', 'rounded', 'square'] as const;
export const LOGO_POSITIONS = ['top-start', 'top-end', 'bottom', 'hidden'] as const;
export const SOCIAL_ICON_STYLES = ['filled', 'outline', 'minimal'] as const;
export const CONTACT_ICON_STYLES = ['plain', 'circle', 'none'] as const;
export const BACKGROUND_TYPES = ['solid', 'gradient'] as const;
export const PATTERNS = ['none', 'dots', 'grid', 'lines', 'waves', 'circles'] as const;
export const BACK_LAYOUTS = ['qr-center', 'qr-side', 'logo', 'contact'] as const;

export interface CardFaceDesign {
  backgroundType: (typeof BACKGROUND_TYPES)[number];
  backgroundColor: string;
  gradientFrom: string;
  gradientTo: string;
  gradientAngle: number;
  textColor: string;
}

export interface DesignSettings extends CardFaceDesign {
  template: TemplateId;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: (typeof FONT_FAMILIES)[number];
  fontSize: (typeof FONT_SIZES)[number];
  borderRadius: number;
  layout: (typeof LAYOUTS)[number];
  photoShape: (typeof PHOTO_SHAPES)[number];
  logoPosition: (typeof LOGO_POSITIONS)[number];
  socialIconStyle: (typeof SOCIAL_ICON_STYLES)[number];
  contactIconStyle: (typeof CONTACT_ICON_STYLES)[number];
  pattern: (typeof PATTERNS)[number];
  /** Optional uploaded image behind the front face ('' = none). */
  backgroundImage: string;
  /** 0–90: opacity (%) of the background colour drawn over the image, for legibility. */
  backgroundOverlay: number;
  back: CardFaceDesign & { layout: (typeof BACK_LAYOUTS)[number]; showQr: boolean; tagline: string };
}
