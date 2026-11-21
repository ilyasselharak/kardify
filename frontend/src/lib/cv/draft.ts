import { z } from "zod";
import { completeSections } from "./document";
import {
  EMPLOYMENT_TYPES, EXTRA_KINDS, LANGUAGE_LEVELS, SKILL_CATEGORIES,
  type Cv, type CvCertification, type CvDesign, type CvEducation, type CvExperience, type CvExtraItem, type CvLanguage,
  type CvProfile, type CvProject, type CvSection, type CvSkill, type CvTemplateId,
} from "./types";

/** Editor rows carry a stable client key for React lists and drag & drop. */
export type Keyed<T> = T & { _key: string };

export interface CvDraft {
  title: string;
  template: CvTemplateId;
  language: "en" | "ar";
  fullName: string;
  headline: string;
  summary: string;
  design: Partial<CvDesign>;
  sections: CvSection[];
  experiences: Keyed<CvExperience>[];
  educations: Keyed<CvEducation>[];
  skills: Keyed<CvSkill>[];
  projects: Keyed<CvProject>[];
  certifications: Keyed<CvCertification>[];
  languages: Keyed<CvLanguage>[];
  extras: Keyed<CvExtraItem>[];
}

export type ItemCollection = "experiences" | "educations" | "skills" | "projects" | "certifications" | "languages" | "extras";

export const newKey = () => (typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : Math.random().toString(36).slice(2));
const keyed = <T extends object>(rows: T[]): Keyed<T>[] => rows.map((r) => ({ ...r, _key: newKey() }));

export function cvToDraft(cv: Cv): CvDraft {
  return {
    title: cv.title,
    template: cv.template,
    language: cv.language,
    fullName: cv.fullName ?? "",
    headline: cv.headline ?? "",
    summary: cv.summary ?? "",
    design: cv.design ?? {},
    sections: completeSections(cv.sections),
    experiences: keyed(cv.experiences),
    educations: keyed(cv.educations),
    skills: keyed(cv.skills),
    projects: keyed(cv.projects),
    certifications: keyed(cv.certifications),
    languages: keyed(cv.languages),
    extras: keyed(cv.extras),
  };
}

const strip = <T extends { _key: string }>(rows: T[]): Omit<T, "_key">[] =>
  rows.map((row) => {
    const copy: Partial<T> = { ...row };
    delete copy._key;
    return copy as Omit<T, "_key">;
  });

/** PATCH /cvs/:id payload (whole document). */
export function draftToPayload(d: CvDraft) {
  return {
    title: d.title.trim(),
    template: d.template,
    language: d.language,
    fullName: d.fullName,
    headline: d.headline,
    summary: d.summary,
    design: d.design,
    sections: d.sections,
    experiences: strip(d.experiences),
    educations: strip(d.educations),
    skills: strip(d.skills),
    projects: strip(d.projects),
    certifications: strip(d.certifications),
    languages: strip(d.languages),
    extras: strip(d.extras),
  };
}

export const emptyItem = {
  experiences: (): CvExperience => ({ jobTitle: "", company: "", location: null, employmentType: null, startDate: null, endDate: null, current: false, responsibilities: "", achievements: "" }),
  educations: (): CvEducation => ({ degree: "", institution: "", location: null, startDate: null, endDate: null, description: "", grade: null }),
  skills: (): CvSkill => ({ name: "", category: "TECHNICAL", level: null }),
  projects: (): CvProject => ({ name: "", description: "", technologies: "", url: null, githubUrl: null, startDate: null, endDate: null, image: null }),
  certifications: (): CvCertification => ({ name: "", issuer: "", issueDate: null, expirationDate: null, credentialUrl: null }),
  languages: (): CvLanguage => ({ language: "", proficiency: "intermediate" }),
};

export const emptyExtra = (kind: CvExtraItem["kind"]): CvExtraItem => ({ kind, title: "", subtitle: null, date: null, url: null, description: "" });

// ─── Validation (mirrors the API's DTO rules) ───────────────────────────

const text = (max: number) => z.string().max(max, "tooLong");
const required = (max: number) => z.string().trim().min(1, "required").max(max, "tooLong");
const nullableText = (max: number) => z.string().max(max, "tooLong").nullable();
const httpUrl = z
  .string()
  .trim()
  .max(500, "tooLong")
  .refine((v) => v === "" || /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(v), "urlInvalid")
  .nullable();
const httpsImage = z.string().refine((v) => v === "" || v.startsWith("https://"), "urlInvalid").nullable();
const month = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "dateInvalid").nullable().or(z.literal(""));
const order = (a?: string | null, b?: string | null) => !a || !b || a <= b;

export const experienceSchema = z
  .object({
    jobTitle: required(120), company: required(120), location: nullableText(120), employmentType: z.enum(EMPLOYMENT_TYPES).nullable().or(z.literal("")),
    startDate: month, endDate: month, current: z.boolean(), responsibilities: text(3000), achievements: text(2000),
  })
  .refine((e) => e.current || order(e.startDate, e.endDate), { message: "dateOrder", path: ["endDate"] });

export const educationSchema = z
  .object({
    degree: required(160), institution: required(160), location: nullableText(120), startDate: month, endDate: month,
    description: text(1500), grade: nullableText(40),
  })
  .refine((e) => order(e.startDate, e.endDate), { message: "dateOrder", path: ["endDate"] });

export const skillSchema = z.object({ name: required(80), category: z.enum(SKILL_CATEGORIES), level: z.number().int().min(1).max(5).nullable() });

export const projectSchema = z
  .object({
    name: required(120), description: text(2000), technologies: text(300), url: httpUrl, githubUrl: httpUrl,
    startDate: month, endDate: month, image: httpsImage,
  })
  .refine((p) => order(p.startDate, p.endDate), { message: "dateOrder", path: ["endDate"] });

export const certificationSchema = z
  .object({ name: required(160), issuer: required(160), issueDate: month, expirationDate: month, credentialUrl: httpUrl })
  .refine((c) => order(c.issueDate, c.expirationDate), { message: "dateOrder", path: ["expirationDate"] });

export const languageSchema = z.object({ language: required(60), proficiency: z.enum(LANGUAGE_LEVELS) });

export const extraSchema = z.object({
  kind: z.enum(EXTRA_KINDS), title: required(160), subtitle: nullableText(160), date: nullableText(40), url: httpUrl, description: text(1500),
});

const ITEM_SCHEMAS: Record<ItemCollection, z.ZodType> = {
  experiences: experienceSchema, educations: educationSchema, skills: skillSchema, projects: projectSchema,
  certifications: certificationSchema, languages: languageSchema, extras: extraSchema,
};

const ITEM_LIMITS: Record<ItemCollection, number> = { experiences: 30, educations: 20, skills: 80, projects: 20, certifications: 30, languages: 20, extras: 60 };

/** Field errors keyed by "collection.<row key>.field" (or "title", "headline", "summary"). */
export function validateDraft(d: CvDraft): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!d.title.trim()) errors.title = "required";
  else if (d.title.length > 120) errors.title = "tooLong";
  if (d.headline.length > 120) errors.headline = "tooLong";
  if (d.fullName.length > 120) errors.fullName = "tooLong";
  if (d.summary.length > 2000) errors.summary = "tooLong";
  for (const col of Object.keys(ITEM_SCHEMAS) as ItemCollection[]) {
    const rows = d[col] as Keyed<object>[];
    if (rows.length > ITEM_LIMITS[col]) errors[col] = "tooMany";
    for (const row of rows) {
      const res = ITEM_SCHEMAS[col].safeParse(row);
      if (!res.success) for (const issue of res.error.issues) errors[`${col}.${row._key}.${issue.path.join(".")}`] ??= issue.message;
    }
  }
  return errors;
}

// ─── Profile ───────────────────────────────────────────────────────────

const optionalUrl = z.string().trim().max(500, "tooLong").refine((v) => v === "" || /^https?:\/\/[^\s.]+\.[^\s]{2,}$/i.test(v), "urlInvalid");
export const profileSchema = z.object({
  fullName: z.string().max(120, "tooLong"),
  professionalTitle: z.string().max(120, "tooLong"),
  photo: z.string(),
  email: z.string().trim().max(254, "tooLong").refine((v) => v === "" || z.email().safeParse(v).success, "emailInvalid"),
  phone: z.string().trim().refine((v) => v === "" || /^\+?[0-9\s().-]{5,25}$/.test(v), "phoneInvalid"),
  address: z.string().max(200, "tooLong"),
  city: z.string().max(100, "tooLong"),
  country: z.string().max(100, "tooLong"),
  website: optionalUrl,
  linkedin: optionalUrl,
  github: optionalUrl,
  portfolio: optionalUrl,
  summary: z.string().max(2000, "tooLong"),
  objectives: z.string().max(1000, "tooLong"),
  achievements: z.string().max(2000, "tooLong"),
});
export type ProfileForm = z.infer<typeof profileSchema>;

export function profileToForm(p: CvProfile): ProfileForm {
  return {
    fullName: p.fullName, professionalTitle: p.professionalTitle, photo: p.photo ?? "", email: p.email ?? "", phone: p.phone ?? "",
    address: p.address ?? "", city: p.city ?? "", country: p.country ?? "", website: p.website ?? "", linkedin: p.linkedin ?? "",
    github: p.github ?? "", portfolio: p.portfolio ?? "", summary: p.summary, objectives: p.objectives, achievements: p.achievements,
  };
}

export function formToProfile(f: ProfileForm): CvProfile {
  const n = (v: string) => (v.trim() === "" ? null : v.trim());
  return {
    fullName: f.fullName.trim(), professionalTitle: f.professionalTitle.trim(), photo: n(f.photo), email: n(f.email), phone: n(f.phone),
    address: n(f.address), city: n(f.city), country: n(f.country), website: n(f.website), linkedin: n(f.linkedin), github: n(f.github),
    portfolio: n(f.portfolio), summary: f.summary, objectives: f.objectives, achievements: f.achievements,
  };
}

/** Moves an item within an array (drag & drop / up-down buttons). */
export function moveItem<T>(rows: T[], from: number, to: number): T[] {
  if (to < 0 || to >= rows.length || from === to) return rows;
  const next = rows.slice();
  const [item] = next.splice(from, 1);
  next.splice(to, 0, item);
  return next;
}
