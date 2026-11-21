import { BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AppConfig } from '../config/app-config.js';
import { randomId } from '../common/utils/crypto.js';
import { slugify } from '../common/utils/slug.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  CV_SECTION_KEYS,
  CV_SLUG_RE,
  DEFAULT_ENABLED_SECTIONS,
  defaultSectionOrder,
  MAX_CVS_PER_USER,
  RESERVED_CV_SLUGS,
  type CvSectionKey,
  type CvTemplateId,
} from './cv.constants.js';
import {
  CV_CONTENT_INCLUDE,
  profileCompletion,
  profileDefaults,
  serializeCv,
  serializeProfile,
  toCvDocument,
  type CvWithContent,
} from './cv.mapper.js';
import type {
  CreateCvDto,
  CvCertificationDto,
  CvEducationDto,
  CvExperienceDto,
  CvExtraItemDto,
  CvLanguageDto,
  CvProjectDto,
  CvSectionDto,
  CvSkillDto,
  UpdateCvDto,
  UpdateCvProfileDto,
  UpdateCvSharingDto,
} from './dto/cv.dto.js';

type Tx = Prisma.TransactionClient;

const notFound = () => new NotFoundException({ code: 'CV_NOT_FOUND', message: 'CV not found' });

@Injectable()
export class CvService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
  ) {}

  // ─── Profile ─────────────────────────────────────────────────────────

  /** Returns the user's profile, creating it (pre-filled from the account) on first use. */
  async ensureProfile(userId: string) {
    const existing = await this.prisma.cvProfile.findUnique({ where: { userId } });
    if (existing) return existing;
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    return this.prisma.cvProfile.upsert({ where: { userId }, update: {}, create: { userId, ...profileDefaults(user) } });
  }

  async getProfile(userId: string) {
    return serializeProfile(await this.ensureProfile(userId));
  }

  async updateProfile(userId: string, dto: UpdateCvProfileDto) {
    await this.ensureProfile(userId);
    const profile = await this.prisma.cvProfile.update({ where: { userId }, data: dto });
    return serializeProfile(profile);
  }

  // ─── CVs ─────────────────────────────────────────────────────────────

  async list(userId: string) {
    const [cvs, profile] = await Promise.all([
      this.prisma.cv.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        include: {
          publicLink: true,
          _count: { select: { experiences: true, educations: true, skills: true, languages: true, projects: true } },
        },
      }),
      this.prisma.cvProfile.findUnique({ where: { userId } }),
    ]);
    const items = cvs.map(({ userId: _u, publicLink, _count, ...cv }) => ({
      id: cv.id,
      title: cv.title,
      template: cv.template,
      language: cv.language,
      visibility: cv.visibility,
      allowDownload: cv.allowDownload,
      createdAt: cv.createdAt,
      updatedAt: cv.updatedAt,
      counts: _count,
      publicLink: publicLink ? { slug: publicLink.slug, enabled: publicLink.enabled, url: `${this.config.frontendUrl}/cv/${publicLink.slug}` } : null,
      isPublic: cv.visibility !== 'PRIVATE' && !!publicLink?.enabled,
    }));
    return {
      items,
      stats: {
        total: items.length,
        public: items.filter((c) => c.isPublic).length,
        lastUpdated: items[0]?.updatedAt ?? null,
        completion: profileCompletion(profile, items.map((c) => c.counts)),
      },
    };
  }

  async get(userId: string, id: string) {
    return serializeCv(await this.findOwned(userId, id), this.config.frontendUrl);
  }

  async create(userId: string, dto: CreateCvDto) {
    const count = await this.prisma.cv.count({ where: { userId } });
    if (count >= MAX_CVS_PER_USER) {
      throw new ForbiddenException({ code: 'CV_LIMIT', message: `You can have up to ${MAX_CVS_PER_USER} CVs` });
    }
    await this.ensureProfile(userId);
    if (dto.copyFromId) return this.copy(userId, dto.copyFromId, { title: dto.title, template: dto.template, language: dto.language });

    const template: CvTemplateId = dto.template ?? 'modern';
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId }, select: { preferredLanguage: true } });
    const cv = await this.prisma.cv.create({
      data: {
        userId,
        title: dto.title,
        template,
        language: dto.language ?? user.preferredLanguage,
        headline: null,
        sections: {
          create: defaultSectionOrder(template).map((key, position) => ({ key, position, enabled: DEFAULT_ENABLED_SECTIONS.has(key) || (template === 'academic' && key === 'publications') })),
        },
      },
      include: CV_CONTENT_INCLUDE,
    });
    return serializeCv(cv, this.config.frontendUrl);
  }

  async duplicate(userId: string, id: string) {
    const count = await this.prisma.cv.count({ where: { userId } });
    if (count >= MAX_CVS_PER_USER) {
      throw new ForbiddenException({ code: 'CV_LIMIT', message: `You can have up to ${MAX_CVS_PER_USER} CVs` });
    }
    const src = await this.findOwned(userId, id);
    return this.copy(userId, id, { title: `${src.title} (copy)`.slice(0, 120) });
  }

  /** Copies a CV's content into a new private CV (no public link). */
  private async copy(userId: string, sourceId: string, overrides: { title: string; template?: CvTemplateId; language?: 'en' | 'ar' }) {
    const src = await this.findOwned(userId, sourceId);
    const cv = await this.prisma.$transaction(async (tx) => {
      const created = await tx.cv.create({
        data: {
          userId,
          title: overrides.title,
          template: overrides.template ?? src.template,
          language: overrides.language ?? src.language,
          fullName: src.fullName,
          headline: src.headline,
          summary: src.summary,
          design: overrides.template && overrides.template !== src.template ? {} : (src.design as Prisma.InputJsonValue),
          visibility: 'PRIVATE',
          allowDownload: src.allowDownload,
        },
      });
      await this.replaceContent(tx, created.id, {
        sections: src.sections.map(({ key, enabled, title }) => ({ key, enabled, title })),
        experiences: src.experiences,
        educations: src.educations,
        skills: src.skills,
        projects: src.projects,
        certifications: src.certifications,
        languages: src.languages as CvLanguageDto[],
        extras: src.extras,
      });
      return tx.cv.findUniqueOrThrow({ where: { id: created.id }, include: CV_CONTENT_INCLUDE });
    });
    return serializeCv(cv, this.config.frontendUrl);
  }

  async update(userId: string, id: string, dto: UpdateCvDto) {
    const existing = await this.findOwned(userId, id);
    validateDates(dto);
    const { title, template, language, fullName, headline, summary, design, ...content } = dto;
    const cv = await this.prisma.$transaction(async (tx) => {
      await tx.cv.update({
        where: { id: existing.id },
        data: {
          ...(title !== undefined ? { title } : {}),
          ...(template !== undefined ? { template } : {}),
          ...(language !== undefined ? { language } : {}),
          ...(fullName !== undefined ? { fullName } : {}),
          ...(headline !== undefined ? { headline } : {}),
          ...(summary !== undefined ? { summary } : {}),
          ...(design !== undefined ? { design: stripUndefined(design) as Prisma.InputJsonValue } : {}),
          // Touch updatedAt even when only child rows change.
          updatedAt: new Date(),
        },
      });
      await this.replaceContent(tx, existing.id, content);
      return tx.cv.findUniqueOrThrow({ where: { id: existing.id }, include: CV_CONTENT_INCLUDE });
    });
    return serializeCv(cv, this.config.frontendUrl);
  }

  async remove(userId: string, id: string) {
    const cv = await this.findOwned(userId, id);
    await this.prisma.cv.delete({ where: { id: cv.id } });
  }

  async updateSharing(userId: string, id: string, dto: UpdateCvSharingDto) {
    const existing = await this.findOwned(userId, id);
    if (dto.slug !== undefined) assertValidSlug(dto.slug);
    try {
      const cv = await this.prisma.$transaction(async (tx) => {
        await tx.cv.update({
          where: { id: existing.id },
          data: {
            ...(dto.visibility ? { visibility: dto.visibility } : {}),
            ...(dto.allowDownload !== undefined ? { allowDownload: dto.allowDownload } : {}),
          },
        });
        const visibility = dto.visibility ?? existing.visibility;
        const link = existing.publicLink;
        if (link) {
          await tx.cvPublicLink.update({
            where: { id: link.id },
            data: {
              ...(dto.slug ? { slug: dto.slug } : {}),
              ...(dto.linkEnabled !== undefined ? { enabled: dto.linkEnabled } : {}),
            },
          });
        } else if (visibility !== 'PRIVATE' || dto.slug || dto.linkEnabled) {
          const slug = dto.slug ?? (await this.generateSlug(tx, userId, existing.title));
          await tx.cvPublicLink.create({ data: { cvId: existing.id, slug, enabled: dto.linkEnabled ?? true } });
        }
        return tx.cv.findUniqueOrThrow({ where: { id: existing.id }, include: CV_CONTENT_INCLUDE });
      });
      return serializeCv(cv, this.config.frontendUrl);
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException({ code: 'CV_SLUG_TAKEN', message: 'This link is already taken' });
      }
      throw err;
    }
  }

  /** Checks whether a slug is free (for live feedback in the sharing dialog). */
  async slugAvailable(userId: string, id: string, slug: string) {
    const cv = await this.findOwned(userId, id);
    const normalised = slug.trim().toLowerCase();
    if (!CV_SLUG_RE.test(normalised) || RESERVED_CV_SLUGS.has(normalised)) return { available: false, valid: false };
    const taken = await this.prisma.cvPublicLink.findUnique({ where: { slug: normalised }, select: { cvId: true } });
    return { available: !taken || taken.cvId === cv.id, valid: true };
  }

  // ─── Public / rendering ──────────────────────────────────────────────

  /**
   * Public access is decided here, on every request (no caching): the link must exist and be
   * enabled and the CV must be PUBLIC or UNLISTED. Anything else is indistinguishable from 404.
   */
  async getPublic(slug: string) {
    if (!/^[a-z0-9-]{3,60}$/.test(slug)) throw notFound();
    const link = await this.prisma.cvPublicLink.findUnique({
      where: { slug },
      include: { cv: { include: { ...CV_CONTENT_INCLUDE, user: { select: { cvProfile: true, suspendedAt: true } } } } },
    });
    const cv = link?.cv;
    if (!link || !link.enabled || !cv || cv.visibility === 'PRIVATE' || cv.user.suspendedAt) throw notFound();
    const profile = cv.user.cvProfile ?? emptyProfile();
    return {
      url: `${this.config.frontendUrl}/cv/${link.slug}`,
      slug: link.slug,
      indexable: cv.visibility === 'PUBLIC',
      allowDownload: cv.allowDownload,
      document: toCvDocument(cv, profile),
      cvId: cv.id,
      /** Changes whenever the rendered output could change (PDF cache key). */
      version: `${cv.updatedAt.getTime()}-${profile.updatedAt.getTime()}`,
    };
  }

  /** Full document for the PDF renderer (authorised by a short-lived render token). */
  async getDocument(cvId: string) {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      include: { ...CV_CONTENT_INCLUDE, user: { select: { cvProfile: true } } },
    });
    if (!cv) throw notFound();
    return toCvDocument(cv, cv.user.cvProfile ?? emptyProfile());
  }

  async findOwned(userId: string, id: string): Promise<CvWithContent> {
    const cv = await this.prisma.cv.findFirst({ where: { id, userId }, include: CV_CONTENT_INCLUDE });
    if (!cv) throw notFound();
    return cv;
  }

  // ─── Internals ───────────────────────────────────────────────────────

  private async generateSlug(tx: Tx, userId: string, title: string) {
    const profile = await tx.cvProfile.findUnique({ where: { userId }, select: { fullName: true } });
    let base = slugify(profile?.fullName || title);
    if (base === 'card') base = 'cv';
    base = base.slice(0, 50).replace(/-+$/, '');
    for (let i = 0; i < 5; i++) {
      // A random suffix keeps unlisted links unguessable; owners can pick a vanity slug later.
      const slug = `${base}-${randomId(6 + i)}`.toLowerCase().replace(/[^a-z0-9-]/g, '');
      const taken = await tx.cvPublicLink.findUnique({ where: { slug }, select: { id: true } });
      if (!taken && CV_SLUG_RE.test(slug)) return slug;
    }
    throw new Error('Could not generate a unique CV slug');
  }

  /** Replaces each collection present in `content` (positions follow array order). */
  private async replaceContent(tx: Tx, cvId: string, content: ContentInput) {
    const seq = <T extends object>(rows: T[]) => rows.map((row, position) => ({ ...withoutIds(row), cvId, position }));

    if (content.sections) {
      await tx.cvSection.deleteMany({ where: { cvId } });
      await tx.cvSection.createMany({ data: seq(normaliseSections(content.sections)) });
    }
    if (content.experiences) {
      await tx.cvExperience.deleteMany({ where: { cvId } });
      await tx.cvExperience.createMany({
        data: seq(content.experiences.map((e) => ({ ...e, endDate: e.current ? null : (e.endDate ?? null), current: !!e.current }))),
      });
    }
    if (content.educations) {
      await tx.cvEducation.deleteMany({ where: { cvId } });
      await tx.cvEducation.createMany({ data: seq(content.educations) });
    }
    if (content.skills) {
      await tx.cvSkill.deleteMany({ where: { cvId } });
      await tx.cvSkill.createMany({ data: seq(content.skills) });
    }
    if (content.projects) {
      await tx.cvProject.deleteMany({ where: { cvId } });
      await tx.cvProject.createMany({ data: seq(content.projects) });
    }
    if (content.certifications) {
      await tx.cvCertification.deleteMany({ where: { cvId } });
      await tx.cvCertification.createMany({ data: seq(content.certifications) });
    }
    if (content.languages) {
      await tx.cvLanguage.deleteMany({ where: { cvId } });
      await tx.cvLanguage.createMany({ data: seq(content.languages) });
    }
    if (content.extras) {
      await tx.cvExtraItem.deleteMany({ where: { cvId } });
      // Positions are per kind so each section keeps its own order.
      const counters = new Map<string, number>();
      await tx.cvExtraItem.createMany({
        data: content.extras.map((x) => {
          const position = counters.get(x.kind) ?? 0;
          counters.set(x.kind, position + 1);
          return { ...withoutIds(x), cvId, position };
        }),
      });
    }
  }
}

interface ContentInput {
  sections?: Pick<CvSectionDto, 'key' | 'enabled' | 'title'>[];
  experiences?: CvExperienceDto[];
  educations?: CvEducationDto[];
  skills?: CvSkillDto[];
  projects?: CvProjectDto[];
  certifications?: CvCertificationDto[];
  languages?: CvLanguageDto[];
  extras?: CvExtraItemDto[];
}

/** Drops ids / foreign keys copied from existing rows. */
function withoutIds<T extends object>(row: T): Omit<T, 'id' | 'cvId' | 'position'> {
  const { id: _id, cvId: _cv, position: _p, ...rest } = row as T & { id?: unknown; cvId?: unknown; position?: unknown };
  return stripUndefined(rest);
}

function stripUndefined<T extends object>(obj: T): T {
  return Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined)) as T;
}

/** Unique keys in the given order, then any missing keys appended as disabled. */
export function normaliseSections(sections: Pick<CvSectionDto, 'key' | 'enabled' | 'title'>[]) {
  const seen = new Set<CvSectionKey>();
  const out: { key: CvSectionKey; enabled: boolean; title: string | null }[] = [];
  for (const s of sections) {
    if (seen.has(s.key)) continue;
    seen.add(s.key);
    out.push({ key: s.key, enabled: s.enabled, title: s.title ?? null });
  }
  for (const key of CV_SECTION_KEYS) if (!seen.has(key)) out.push({ key, enabled: false, title: null });
  return out;
}

const before = (a?: string | null, b?: string | null) => !a || !b || a <= b;

/** Start dates must not be after end dates (YYYY-MM strings compare lexicographically). */
export function validateDates(dto: UpdateCvDto) {
  const bad =
    dto.experiences?.some((e) => !e.current && !before(e.startDate, e.endDate)) ||
    dto.educations?.some((e) => !before(e.startDate, e.endDate)) ||
    dto.projects?.some((p) => !before(p.startDate, p.endDate)) ||
    dto.certifications?.some((c) => !before(c.issueDate, c.expirationDate));
  if (bad) throw new BadRequestException({ code: 'CV_DATE_RANGE', message: 'A start date is after its end date' });
}

export function assertValidSlug(slug: string) {
  if (!CV_SLUG_RE.test(slug) || RESERVED_CV_SLUGS.has(slug)) {
    throw new BadRequestException({ code: 'CV_SLUG_INVALID', message: 'Use 3–60 lowercase letters, numbers or hyphens' });
  }
}

function emptyProfile() {
  return {
    fullName: '', professionalTitle: '', photo: null, email: null, phone: null, address: null, city: null, country: null,
    website: null, linkedin: null, github: null, portfolio: null, summary: '', objectives: '', achievements: '', updatedAt: new Date(0),
  };
}
