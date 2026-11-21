import type { CvProfile, Prisma, User } from '../generated/prisma/client.js';
import { CV_SECTION_KEYS, DEFAULT_ENABLED_SECTIONS, EXTRA_KIND_SECTION, type CvSectionKey } from './cv.constants.js';

export const CV_CONTENT_INCLUDE = {
  publicLink: true,
  sections: { orderBy: { position: 'asc' } },
  experiences: { orderBy: { position: 'asc' } },
  educations: { orderBy: { position: 'asc' } },
  skills: { orderBy: { position: 'asc' } },
  projects: { orderBy: { position: 'asc' } },
  certifications: { orderBy: { position: 'asc' } },
  languages: { orderBy: { position: 'asc' } },
  extras: { orderBy: [{ kind: 'asc' }, { position: 'asc' }] },
} satisfies Prisma.CvInclude;

export type CvWithContent = Prisma.CvGetPayload<{ include: typeof CV_CONTENT_INCLUDE }>;

export const publicCvUrl = (frontendUrl: string, slug: string) => `${frontendUrl}/cv/${slug}`;

/** Removes database bookkeeping columns from a content row. */
function strip<T extends { id: string; cvId: string; position: number }>(rows: T[]) {
  return rows.map(({ id: _id, cvId: _cv, position: _p, ...rest }) => rest);
}

/** Always returns all section keys: stored order first, then any missing keys (disabled unless default). */
export function completeSections(stored: { key: CvSectionKey; enabled: boolean; title: string | null }[]) {
  const seen = new Set(stored.map((s) => s.key));
  return [
    ...stored.map(({ key, enabled, title }) => ({ key, enabled, title })),
    ...CV_SECTION_KEYS.filter((k) => !seen.has(k)).map((key) => ({ key, enabled: DEFAULT_ENABLED_SECTIONS.has(key) && stored.length === 0, title: null })),
  ];
}

export function cvContent(cv: CvWithContent) {
  return {
    sections: completeSections(cv.sections),
    experiences: strip(cv.experiences),
    educations: strip(cv.educations),
    skills: strip(cv.skills),
    projects: strip(cv.projects),
    certifications: strip(cv.certifications),
    languages: strip(cv.languages),
    extras: strip(cv.extras),
  };
}

export function isPubliclyReachable(cv: Pick<CvWithContent, 'visibility' | 'publicLink'>) {
  return cv.visibility !== 'PRIVATE' && !!cv.publicLink?.enabled;
}

/** Owner view: everything needed by the editor. */
export function serializeCv(cv: CvWithContent, frontendUrl: string) {
  const { userId: _u, publicLink, sections: _s, experiences: _e, educations: _ed, skills: _sk, projects: _p, certifications: _c, languages: _l, extras: _x, ...meta } = cv;
  return {
    ...meta,
    publicLink: publicLink ? { slug: publicLink.slug, enabled: publicLink.enabled, url: publicCvUrl(frontendUrl, publicLink.slug) } : null,
    isPublic: isPubliclyReachable(cv),
    ...cvContent(cv),
  };
}

export type ProfileLike = Omit<CvProfile, 'id' | 'userId' | 'createdAt' | 'updatedAt'>;

export function serializeProfile(p: CvProfile) {
  const { id: _id, userId: _u, createdAt: _c, ...rest } = p;
  return rest;
}

/** Defaults for a brand-new profile, pre-filled from the account. */
export function profileDefaults(user: Pick<User, 'firstName' | 'lastName' | 'email' | 'profileImage'>) {
  return {
    fullName: `${user.firstName} ${user.lastName}`.trim().slice(0, 120),
    email: user.email,
    photo: user.profileImage,
  };
}

/**
 * The document a template renders: shared personal details + this version's content.
 * Only enabled sections are included, so hidden content never reaches a public page or PDF.
 */
export function toCvDocument(cv: CvWithContent, profile: ProfileLike) {
  const content = cvContent(cv);
  const enabled = new Set(content.sections.filter((s) => s.enabled).map((s) => s.key));
  const on = <T>(key: CvSectionKey, rows: T[]) => (enabled.has(key) ? rows : []);
  return {
    profile: {
      fullName: cv.fullName || profile.fullName,
      professionalTitle: cv.headline || profile.professionalTitle,
      photo: profile.photo,
      email: profile.email,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      country: profile.country,
      website: profile.website,
      linkedin: profile.linkedin,
      github: profile.github,
      portfolio: profile.portfolio,
      summary: enabled.has('summary') ? cv.summary || profile.summary : '',
      objectives: enabled.has('summary') ? profile.objectives : '',
      achievements: enabled.has('summary') ? profile.achievements : '',
    },
    template: cv.template,
    language: cv.language,
    design: cv.design,
    sections: content.sections.filter((s) => s.enabled),
    experiences: on('experience', content.experiences),
    educations: on('education', content.educations),
    skills: on('skills', content.skills),
    projects: on('projects', content.projects),
    certifications: on('certifications', content.certifications),
    languages: on('languages', content.languages),
    extras: content.extras.filter((x) => enabled.has(EXTRA_KIND_SECTION[x.kind])),
    updatedAt: cv.updatedAt,
  };
}

export type CvDocument = ReturnType<typeof toCvDocument>;

interface CompletionCounts {
  experiences: number;
  educations: number;
  skills: number;
  languages: number;
}

/** 0–100. Personal details count for 60 %, the most complete CV's content for 40 %. */
export function profileCompletion(profile: Partial<ProfileLike> | null, counts: CompletionCounts[]) {
  const p = profile ?? {};
  let score = 0;
  if (p.fullName) score += 10;
  if (p.professionalTitle) score += 10;
  if (p.photo) score += 5;
  if (p.email) score += 5;
  if (p.phone) score += 5;
  if (p.city || p.country) score += 5;
  if (p.linkedin || p.website || p.github || p.portfolio) score += 5;
  if (p.summary && p.summary.length >= 40) score += 15;
  const best = counts.reduce(
    (max, c) => Math.max(max, (c.experiences > 0 ? 15 : 0) + (c.educations > 0 ? 10 : 0) + (c.skills >= 3 ? 10 : 0) + (c.languages > 0 ? 5 : 0)),
    0,
  );
  return Math.min(100, score + best);
}
