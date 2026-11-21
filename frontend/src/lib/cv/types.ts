/** CV builder types. Mirrors backend/src/cv (DTOs + mapper). */
export const CV_TEMPLATE_IDS = ["modern", "minimal", "corporate", "creative", "executive", "technical", "academic", "elegant"] as const;
export type CvTemplateId = (typeof CV_TEMPLATE_IDS)[number];

export const CV_SECTION_KEYS = [
  "summary", "experience", "education", "skills", "projects", "certifications", "languages",
  "awards", "publications", "volunteer", "interests", "references",
] as const;
export type CvSectionKey = (typeof CV_SECTION_KEYS)[number];

export const CV_FONTS = ["inter", "poppins", "montserrat", "lora", "playfair", "spacegrotesk", "cairo", "tajawal"] as const;
export const CV_FONT_SCALES = ["sm", "md", "lg"] as const;
export const CV_SPACINGS = ["compact", "normal", "relaxed"] as const;
export const CV_MARGINS = ["narrow", "normal", "wide"] as const;
export const CV_SKILL_STYLES = ["tags", "bars", "list"] as const;
export const CV_DATE_FORMATS = ["short", "numeric", "year"] as const;
export const EMPLOYMENT_TYPES = ["full-time", "part-time", "contract", "freelance", "internship", "temporary", "volunteer"] as const;
export const LANGUAGE_LEVELS = ["native", "fluent", "advanced", "intermediate", "basic"] as const;
export const SKILL_CATEGORIES = ["TECHNICAL", "SOFT", "LANGUAGE", "TOOL"] as const;
export const EXTRA_KINDS = ["AWARD", "PUBLICATION", "VOLUNTEER", "INTEREST", "REFERENCE"] as const;

export type CvFont = (typeof CV_FONTS)[number];
export type CvVisibility = "PRIVATE" | "UNLISTED" | "PUBLIC";
export type CvLang = "en" | "ar";
export type ExtraKind = (typeof EXTRA_KINDS)[number];

export const EXTRA_KIND_SECTION: Record<ExtraKind, CvSectionKey> = {
  AWARD: "awards",
  PUBLICATION: "publications",
  VOLUNTEER: "volunteer",
  INTEREST: "interests",
  REFERENCE: "references",
};
export const SECTION_EXTRA_KIND: Partial<Record<CvSectionKey, ExtraKind>> = {
  awards: "AWARD",
  publications: "PUBLICATION",
  volunteer: "VOLUNTEER",
  interests: "INTEREST",
  references: "REFERENCE",
};

export interface CvDesign {
  accentColor: string;
  textColor: string;
  fontFamily: CvFont;
  headingFont: CvFont;
  fontScale: (typeof CV_FONT_SCALES)[number];
  spacing: (typeof CV_SPACINGS)[number];
  margins: (typeof CV_MARGINS)[number];
  skillStyle: (typeof CV_SKILL_STYLES)[number];
  dateFormat: (typeof CV_DATE_FORMATS)[number];
  showPhoto: boolean;
  showIcons: boolean;
}

export interface CvProfile {
  fullName: string;
  professionalTitle: string;
  photo: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  website: string | null;
  linkedin: string | null;
  github: string | null;
  portfolio: string | null;
  summary: string;
  objectives: string;
  achievements: string;
  updatedAt?: string;
}

export interface CvSection {
  key: CvSectionKey;
  enabled: boolean;
  title: string | null;
}

export interface CvExperience {
  jobTitle: string;
  company: string;
  location: string | null;
  employmentType: string | null;
  startDate: string | null;
  endDate: string | null;
  current: boolean;
  responsibilities: string;
  achievements: string;
}

export interface CvEducation {
  degree: string;
  institution: string;
  location: string | null;
  startDate: string | null;
  endDate: string | null;
  description: string;
  grade: string | null;
}

export interface CvSkill {
  name: string;
  category: (typeof SKILL_CATEGORIES)[number];
  level: number | null;
}

export interface CvProject {
  name: string;
  description: string;
  technologies: string;
  url: string | null;
  githubUrl: string | null;
  startDate: string | null;
  endDate: string | null;
  image: string | null;
}

export interface CvCertification {
  name: string;
  issuer: string;
  issueDate: string | null;
  expirationDate: string | null;
  credentialUrl: string | null;
}

export interface CvLanguage {
  language: string;
  proficiency: (typeof LANGUAGE_LEVELS)[number];
}

export interface CvExtraItem {
  kind: ExtraKind;
  title: string;
  subtitle: string | null;
  date: string | null;
  url: string | null;
  description: string;
}

export interface CvContent {
  sections: CvSection[];
  experiences: CvExperience[];
  educations: CvEducation[];
  skills: CvSkill[];
  projects: CvProject[];
  certifications: CvCertification[];
  languages: CvLanguage[];
  extras: CvExtraItem[];
}

export interface CvPublicLink {
  slug: string;
  enabled: boolean;
  url: string;
}

/** Owner view returned by GET/PATCH /cvs/:id. */
export interface Cv extends CvContent {
  id: string;
  title: string;
  template: CvTemplateId;
  language: CvLang;
  /** Per-version name (e.g. written in Arabic); falls back to the profile name. */
  fullName: string | null;
  headline: string | null;
  summary: string | null;
  design: Partial<CvDesign>;
  visibility: CvVisibility;
  allowDownload: boolean;
  publicLink: CvPublicLink | null;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CvListItem {
  id: string;
  title: string;
  template: CvTemplateId;
  language: CvLang;
  visibility: CvVisibility;
  allowDownload: boolean;
  createdAt: string;
  updatedAt: string;
  counts: { experiences: number; educations: number; skills: number; languages: number; projects: number };
  publicLink: CvPublicLink | null;
  isPublic: boolean;
}

export interface CvList {
  items: CvListItem[];
  stats: { total: number; public: number; lastUpdated: string | null; completion: number };
}

/** What a template renders (same shape as the backend's toCvDocument). */
export interface CvDocument extends Omit<CvContent, "sections"> {
  profile: CvProfile;
  template: CvTemplateId;
  language: CvLang;
  design: Partial<CvDesign>;
  sections: CvSection[];
  updatedAt?: string;
}

export interface PublicCv {
  url: string;
  slug: string;
  indexable: boolean;
  allowDownload: boolean;
  document: CvDocument;
}
