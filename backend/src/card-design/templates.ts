import { TEMPLATE_IDS, type DesignSettings, type TemplateCategory, type TemplateId } from './design.types.js';

export { TEMPLATE_IDS };

const solid = (backgroundColor: string, textColor: string) => ({
  backgroundType: 'solid' as const,
  backgroundColor,
  gradientFrom: backgroundColor,
  gradientTo: backgroundColor,
  gradientAngle: 135,
  textColor,
});

const gradient = (from: string, to: string, textColor: string, angle = 135) => ({
  backgroundType: 'gradient' as const,
  backgroundColor: from,
  gradientFrom: from,
  gradientTo: to,
  gradientAngle: angle,
  textColor,
});

/** Defaults shared by every template (overridden per template below). */
const base = {
  fontSize: 'md',
  contactIconStyle: 'plain',
  pattern: 'none',
  backgroundImage: '',
  backgroundOverlay: 55,
} as const;

/** Mirrors frontend/src/lib/design/templates.ts. */
export const TEMPLATES: Record<TemplateId, DesignSettings> = {
  classic: {
    ...base, template: 'classic', ...solid('#ffffff', '#0d1e37'), primaryColor: '#006afe', secondaryColor: '#0d1e37', fontFamily: 'inter',
    borderRadius: 16, layout: 'centered', photoShape: 'circle', logoPosition: 'top-end', socialIconStyle: 'filled',
    back: { ...solid('#0d1e37', '#ffffff'), layout: 'qr-center', showQr: true, tagline: '' },
  },
  modern: {
    ...base, template: 'modern', ...solid('#f7f9fc', '#0d1e37'), primaryColor: '#006afe', secondaryColor: '#00b4d8', fontFamily: 'poppins',
    borderRadius: 24, layout: 'banner', photoShape: 'rounded', logoPosition: 'top-start', socialIconStyle: 'outline', contactIconStyle: 'circle',
    back: { ...gradient('#006afe', '#0d1e37', '#ffffff'), layout: 'qr-side', showQr: true, tagline: '' },
  },
  minimal: {
    ...base, template: 'minimal', ...solid('#ffffff', '#111827'), primaryColor: '#111827', secondaryColor: '#9ca3af', fontFamily: 'inter', fontSize: 'sm',
    borderRadius: 8, layout: 'left', photoShape: 'square', logoPosition: 'hidden', socialIconStyle: 'minimal', contactIconStyle: 'none',
    back: { ...solid('#ffffff', '#111827'), layout: 'logo', showQr: true, tagline: '' },
  },
  corporate: {
    ...base, template: 'corporate', ...solid('#ffffff', '#0d1e37'), primaryColor: '#0d1e37', secondaryColor: '#006afe', fontFamily: 'montserrat',
    borderRadius: 12, layout: 'split', photoShape: 'rounded', logoPosition: 'top-start', socialIconStyle: 'filled',
    back: { ...solid('#0d1e37', '#ffffff'), layout: 'contact', showQr: true, tagline: '' },
  },
  creative: {
    ...base, template: 'creative', ...gradient('#ff7a59', '#ffb347', '#1f1300', 160), primaryColor: '#1f1300', secondaryColor: '#ffffff', fontFamily: 'poppins',
    fontSize: 'lg', borderRadius: 28, layout: 'centered', photoShape: 'circle', logoPosition: 'bottom', socialIconStyle: 'filled', pattern: 'circles',
    back: { ...solid('#1f1300', '#ffb347'), layout: 'qr-center', showQr: true, tagline: '' },
  },
  elegant: {
    ...base, template: 'elegant', ...solid('#faf7f2', '#2b2118'), primaryColor: '#a67c52', secondaryColor: '#d9c3a5', fontFamily: 'playfair',
    borderRadius: 4, layout: 'frame', photoShape: 'circle', logoPosition: 'top-end', socialIconStyle: 'outline', contactIconStyle: 'none',
    back: { ...solid('#2b2118', '#e9d8c4'), layout: 'qr-center', showQr: true, tagline: '' },
  },
  dark: {
    ...base, template: 'dark', ...solid('#0b0f17', '#e5eaf1'), primaryColor: '#4d9bff', secondaryColor: '#7c3aed', fontFamily: 'inter',
    borderRadius: 20, layout: 'left', photoShape: 'rounded', logoPosition: 'top-end', socialIconStyle: 'outline', contactIconStyle: 'circle', pattern: 'grid',
    back: { ...solid('#111827', '#e5eaf1'), layout: 'qr-side', showQr: true, tagline: '' },
  },
  gradient: {
    ...base, template: 'gradient', ...gradient('#006afe', '#7c3aed', '#ffffff'), primaryColor: '#ffffff', secondaryColor: '#c4b5fd', fontFamily: 'montserrat',
    borderRadius: 24, layout: 'centered', photoShape: 'circle', logoPosition: 'top-end', socialIconStyle: 'filled', pattern: 'waves',
    back: { ...gradient('#7c3aed', '#006afe', '#ffffff'), layout: 'qr-center', showQr: true, tagline: '' },
  },
  clean: {
    ...base, template: 'clean', ...solid('#ffffff', '#0f172a'), primaryColor: '#006afe', secondaryColor: '#e2e8f0', fontFamily: 'inter',
    borderRadius: 14, layout: 'editorial', photoShape: 'square', logoPosition: 'top-end', socialIconStyle: 'minimal',
    back: { ...solid('#f8fafc', '#0f172a'), layout: 'qr-side', showQr: true, tagline: '' },
  },
  diagonal: {
    ...base, template: 'diagonal', ...solid('#ffffff', '#0d1e37'), primaryColor: '#006afe', secondaryColor: '#00c2a8', fontFamily: 'poppins',
    borderRadius: 18, layout: 'diagonal', photoShape: 'circle', logoPosition: 'top-end', socialIconStyle: 'filled', contactIconStyle: 'circle',
    back: { ...gradient('#006afe', '#00c2a8', '#ffffff', 120), layout: 'qr-center', showQr: true, tagline: '' },
  },
  luxe: {
    ...base, template: 'luxe', ...solid('#121212', '#f4ead5'), primaryColor: '#c9a45c', secondaryColor: '#8a6d3b', fontFamily: 'playfair',
    borderRadius: 6, layout: 'frame', photoShape: 'circle', logoPosition: 'hidden', socialIconStyle: 'outline', contactIconStyle: 'none',
    back: { ...solid('#121212', '#c9a45c'), layout: 'logo', showQr: true, tagline: '' },
  },
  aurora: {
    ...base, template: 'aurora', ...gradient('#1e1b4b', '#312e81', '#ffffff', 160), primaryColor: '#f472b6', secondaryColor: '#38bdf8', fontFamily: 'poppins',
    borderRadius: 26, layout: 'orbit', photoShape: 'circle', logoPosition: 'top-end', socialIconStyle: 'filled',
    back: { ...gradient('#312e81', '#1e1b4b', '#ffffff', 200), layout: 'qr-center', showQr: true, tagline: '' },
  },
  noir: {
    ...base, template: 'noir', ...solid('#0a0a0c', '#f5f5f5'), primaryColor: '#d4af37', secondaryColor: '#3f3f46', fontFamily: 'montserrat',
    borderRadius: 16, layout: 'monogram', photoShape: 'circle', logoPosition: 'top-start', socialIconStyle: 'minimal', contactIconStyle: 'none',
    back: { ...solid('#18181b', '#f5f5f5'), layout: 'qr-side', showQr: true, tagline: '' },
  },
  tech: {
    ...base, template: 'tech', ...solid('#0a1428', '#e2e8f0'), primaryColor: '#00e0b8', secondaryColor: '#006afe', fontFamily: 'spacegrotesk',
    borderRadius: 14, layout: 'sidebar', photoShape: 'rounded', logoPosition: 'top-start', socialIconStyle: 'outline', pattern: 'grid',
    back: { ...solid('#0a1428', '#e2e8f0'), layout: 'contact', showQr: true, tagline: '' },
  },
  startup: {
    ...base, template: 'startup', ...solid('#f5f7ff', '#1e1b4b'), primaryColor: '#5b5bf7', secondaryColor: '#00c2ff', fontFamily: 'spacegrotesk',
    borderRadius: 22, layout: 'orbit', photoShape: 'rounded', logoPosition: 'top-end', socialIconStyle: 'filled', pattern: 'dots',
    back: { ...gradient('#5b5bf7', '#00c2ff', '#ffffff'), layout: 'qr-side', showQr: true, tagline: '' },
  },
  executive: {
    ...base, template: 'executive', ...solid('#fbfaf7', '#1f2937'), primaryColor: '#7f1d1d', secondaryColor: '#0d1e37', fontFamily: 'lora',
    borderRadius: 6, layout: 'editorial', photoShape: 'rounded', logoPosition: 'top-end', socialIconStyle: 'outline', pattern: 'lines',
    back: { ...solid('#0d1e37', '#f3f4f6'), layout: 'contact', showQr: true, tagline: '' },
  },
};

export const TEMPLATE_CATEGORY: Record<TemplateId, TemplateCategory> = {
  minimal: 'minimal', clean: 'minimal',
  corporate: 'corporate', modern: 'creative',
  creative: 'creative', diagonal: 'creative',
  elegant: 'elegant', luxe: 'elegant',
  gradient: 'gradient', aurora: 'gradient',
  dark: 'dark', noir: 'dark',
  tech: 'tech', startup: 'tech',
  classic: 'classic', executive: 'classic',
};

export function defaultDesign(template: TemplateId = 'classic'): DesignSettings {
  return structuredClone(TEMPLATES[template]);
}
