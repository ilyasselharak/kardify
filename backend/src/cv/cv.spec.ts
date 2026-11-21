import { BadRequestException } from '@nestjs/common';
import { pdfDisposition } from './cv-pdf.service.js';
import { profileCompletion, toCvDocument, type CvWithContent } from './cv.mapper.js';
import { assertValidSlug, normaliseSections, validateDates } from './cv.service.js';
import { CV_SECTION_KEYS } from './cv.constants.js';

const row = { cvId: 'cv', position: 0 };

function makeCv(overrides: Partial<CvWithContent> = {}): CvWithContent {
  return {
    id: 'cv',
    userId: 'user',
    title: 'Frontend CV',
    template: 'modern',
    language: 'en',
    fullName: null,
    headline: null,
    summary: null,
    design: {},
    visibility: 'PUBLIC',
    allowDownload: true,
    createdAt: new Date(),
    updatedAt: new Date(),
    publicLink: { id: 'l', cvId: 'cv', slug: 'jane-doe', enabled: true, createdAt: new Date(), updatedAt: new Date() },
    sections: CV_SECTION_KEYS.map((key, position) => ({ id: key, cvId: 'cv', key, position, enabled: key !== 'projects', title: null })),
    experiences: [{ ...row, id: 'e1', jobTitle: 'Engineer', company: 'Acme', location: null, employmentType: null, startDate: '2020-01', endDate: null, current: true, responsibilities: 'Build', achievements: '' }],
    educations: [],
    skills: [],
    projects: [{ ...row, id: 'p1', name: 'Secret project', description: 'hidden', technologies: '', url: null, githubUrl: null, startDate: null, endDate: null, image: null }],
    certifications: [],
    languages: [],
    extras: [{ ...row, id: 'x1', kind: 'AWARD', title: 'Prize', subtitle: null, date: null, url: null, description: '' }],
    ...overrides,
  };
}

const profile = {
  fullName: 'Jane Doe', professionalTitle: 'Developer', photo: null, email: 'jane@example.com', phone: null, address: null,
  city: 'Rabat', country: 'Morocco', website: null, linkedin: null, github: null, portfolio: null,
  summary: 'Shared summary', objectives: 'Grow', achievements: 'Shipped', updatedAt: new Date(),
};

describe('CV document mapping', () => {
  it('omits disabled sections so hidden content never reaches public pages or PDFs', () => {
    const doc = toCvDocument(makeCv(), profile);
    expect(doc.projects).toEqual([]);
    expect(doc.sections.map((s) => s.key)).not.toContain('projects');
    expect(doc.experiences).toHaveLength(1);
    expect(doc.extras).toHaveLength(1);
    expect(JSON.stringify(doc)).not.toContain('Secret project');
    expect(doc).not.toHaveProperty('userId');
    expect(doc.experiences[0]).not.toHaveProperty('cvId');
  });

  it('prefers per-version headline/summary over the shared profile', () => {
    const doc = toCvDocument(makeCv({ fullName: 'سارة العلمي', headline: 'Frontend Engineer', summary: 'Version summary' }), profile);
    expect(doc.profile.fullName).toBe('سارة العلمي');
    expect(doc.profile.professionalTitle).toBe('Frontend Engineer');
    expect(doc.profile.summary).toBe('Version summary');
    expect(toCvDocument(makeCv(), profile).profile.summary).toBe('Shared summary');
  });

  it('drops summary text when the summary section is disabled', () => {
    const cv = makeCv();
    cv.sections = cv.sections.map((s) => (s.key === 'summary' ? { ...s, enabled: false } : s));
    const doc = toCvDocument(cv, profile);
    expect(doc.profile.summary).toBe('');
    expect(doc.profile.objectives).toBe('');
  });
});

describe('CV helpers', () => {
  it('normalises section lists (dedupe, append missing keys disabled)', () => {
    const out = normaliseSections([
      { key: 'skills', enabled: true },
      { key: 'skills', enabled: false },
      { key: 'experience', enabled: true, title: 'Career' },
    ]);
    expect(out).toHaveLength(CV_SECTION_KEYS.length);
    expect(out[0]).toEqual({ key: 'skills', enabled: true, title: null });
    expect(out[1]).toEqual({ key: 'experience', enabled: true, title: 'Career' });
    expect(out.slice(2).every((s) => !s.enabled)).toBe(true);
  });

  it('rejects start dates after end dates', () => {
    expect(() => validateDates({ experiences: [{ jobTitle: 'a', company: 'b', startDate: '2022-05', endDate: '2021-01' }] })).toThrow(BadRequestException);
    expect(() => validateDates({ experiences: [{ jobTitle: 'a', company: 'b', startDate: '2022-05', endDate: '2021-01', current: true }] })).not.toThrow();
    expect(() => validateDates({ certifications: [{ name: 'a', issuer: 'b', issueDate: '2024-01', expirationDate: '2023-01' }] })).toThrow();
    expect(() => validateDates({ educations: [{ degree: 'a', institution: 'b', startDate: '2018-09', endDate: '2022-06' }] })).not.toThrow();
  });

  it('validates public slugs', () => {
    for (const ok of ['jane-doe', 'abc', 'dev-cv-2026']) expect(() => assertValidSlug(ok)).not.toThrow();
    for (const bad of ['ab', '-jane', 'jane-', 'Jane', 'jane_doe', 'admin', 'a'.repeat(61), 'جين']) {
      expect(() => assertValidSlug(bad), bad).toThrow(BadRequestException);
    }
  });

  it('scores profile completion from personal details and the best CV', () => {
    expect(profileCompletion(null, [])).toBe(0);
    const partial = profileCompletion({ fullName: 'A', professionalTitle: 'B' }, []);
    expect(partial).toBe(20);
    const full = profileCompletion(
      { ...profile, photo: 'https://x', phone: '+1 555', linkedin: 'https://l', summary: 'x'.repeat(50) },
      [{ experiences: 0, educations: 0, skills: 0, languages: 0 }, { experiences: 2, educations: 1, skills: 5, languages: 1 }],
    );
    expect(full).toBe(100);
  });

  it('builds safe PDF file names', () => {
    expect(pdfDisposition('Jane Doe - Dev CV', true)).toMatch(/^attachment; filename="Jane-Doe---Dev-CV.pdf"/);
    expect(pdfDisposition('جين', false)).toMatch(/^inline; filename="cv.pdf"; filename\*=UTF-8''/);
    expect(pdfDisposition('a"b\r\nc', true)).not.toMatch(/[\r\n]/);
  });
});
