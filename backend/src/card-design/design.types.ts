/**
 * Card design settings, stored as JSON in BusinessCard.designSettings.
 * The frontend mirrors this contract in `frontend/src/lib/design/types.ts`.
 */
export const TEMPLATE_IDS = ['classic', 'modern', 'minimal', 'corporate', 'creative', 'elegant', 'dark', 'gradient'] as const;
export type TemplateId = (typeof TEMPLATE_IDS)[number];

export const FONT_FAMILIES = ['inter', 'poppins', 'playfair', 'montserrat', 'cairo', 'tajawal'] as const;
export const FONT_SIZES = ['sm', 'md', 'lg'] as const;
export const LAYOUTS = ['centered', 'left', 'split', 'banner'] as const;
export const PHOTO_SHAPES = ['circle', 'rounded', 'square'] as const;
export const LOGO_POSITIONS = ['top-start', 'top-end', 'bottom', 'hidden'] as const;
export const SOCIAL_ICON_STYLES = ['filled', 'outline', 'minimal'] as const;
export const BACKGROUND_TYPES = ['solid', 'gradient'] as const;

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
  fontFamily: (typeof FONT_FAMILIES)[number];
  fontSize: (typeof FONT_SIZES)[number];
  borderRadius: number;
  layout: (typeof LAYOUTS)[number];
  photoShape: (typeof PHOTO_SHAPES)[number];
  logoPosition: (typeof LOGO_POSITIONS)[number];
  socialIconStyle: (typeof SOCIAL_ICON_STYLES)[number];
  back: CardFaceDesign & { showQr: boolean; tagline: string };
}
