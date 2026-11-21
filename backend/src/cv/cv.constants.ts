/**
 * CV builder constants. Templates are rendering code, so they live in a code registry
 * (mirrored in `frontend/src/lib/cv/templates.ts`); a CV stores the template id only.
 */
export const CV_TEMPLATE_IDS = [
  'modern',
  'minimal',
  'corporate',
  'creative',
  'executive',
  'technical',
  'academic',
  'elegant',
] as const;
export type CvTemplateId = (typeof CV_TEMPLATE_IDS)[number];

export const CV_SECTION_KEYS = [
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
  'awards',
  'publications',
  'volunteer',
  'interests',
  'references',
] as const;
export type CvSectionKey = (typeof CV_SECTION_KEYS)[number];

/** Sections shown on a brand-new CV; the optional ones start disabled. */
export const DEFAULT_ENABLED_SECTIONS: ReadonlySet<CvSectionKey> = new Set([
  'summary',
  'experience',
  'education',
  'skills',
  'projects',
  'certifications',
  'languages',
]);

/** Academic CVs lead with education and publications; technical CVs with skills and projects. */
export function defaultSectionOrder(template: CvTemplateId): CvSectionKey[] {
  if (template === 'academic') {
    return ['summary', 'education', 'experience', 'publications', 'projects', 'awards', 'skills', 'certifications', 'languages', 'volunteer', 'interests', 'references'];
  }
  if (template === 'technical') {
    return ['summary', 'skills', 'experience', 'projects', 'education', 'certifications', 'languages', 'awards', 'publications', 'volunteer', 'interests', 'references'];
  }
  return [...CV_SECTION_KEYS];
}

export const CV_FONTS = ['inter', 'poppins', 'montserrat', 'lora', 'playfair', 'spacegrotesk', 'cairo', 'tajawal'] as const;
export const CV_FONT_SCALES = ['sm', 'md', 'lg'] as const;
export const CV_SPACINGS = ['compact', 'normal', 'relaxed'] as const;
export const CV_MARGINS = ['narrow', 'normal', 'wide'] as const;
export const CV_SKILL_STYLES = ['tags', 'bars', 'list'] as const;
export const CV_DATE_FORMATS = ['short', 'numeric', 'year'] as const;

export const EMPLOYMENT_TYPES = ['full-time', 'part-time', 'contract', 'freelance', 'internship', 'temporary', 'volunteer'] as const;
export const LANGUAGE_LEVELS = ['native', 'fluent', 'advanced', 'intermediate', 'basic'] as const;
export const SKILL_CATEGORIES = ['TECHNICAL', 'SOFT', 'LANGUAGE', 'TOOL'] as const;
export const EXTRA_KINDS = ['AWARD', 'PUBLICATION', 'VOLUNTEER', 'INTEREST', 'REFERENCE'] as const;

/** Section key that lists each extra item kind. */
export const EXTRA_KIND_SECTION: Record<(typeof EXTRA_KINDS)[number], CvSectionKey> = {
  AWARD: 'awards',
  PUBLICATION: 'publications',
  VOLUNTEER: 'volunteer',
  INTEREST: 'interests',
  REFERENCE: 'references',
};

export const MAX_CVS_PER_USER = 30;
/** YYYY-MM */
export const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;
/** Public slug: 3–60 chars, lowercase letters, digits and inner hyphens. */
export const CV_SLUG_RE = /^[a-z0-9](?:[a-z0-9-]{1,58})[a-z0-9]$/;
export const RESERVED_CV_SLUGS = new Set(['new', 'edit', 'preview', 'print', 'admin', 'api', 'pdf', 'dashboard', 'settings']);
