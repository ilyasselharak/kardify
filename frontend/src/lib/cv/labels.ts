import type { CvDesign, CvLang, CvSectionKey } from "./types";

/**
 * Text printed on the CV itself. It follows the CV's language, not the dashboard's, so an
 * English-speaking user can produce an Arabic CV (and vice versa).
 */
export const CV_LABELS = {
  en: {
    sections: {
      summary: "Profile", experience: "Experience", education: "Education", skills: "Skills", projects: "Projects",
      certifications: "Certifications", languages: "Languages", awards: "Awards", publications: "Publications",
      volunteer: "Volunteering", interests: "Interests", references: "References",
    },
    contact: "Contact",
    objectives: "Career objectives",
    achievements: "Key achievements",
    present: "Present",
    expires: "Expires",
    grade: "Grade",
    technologies: "Technologies",
    keyAchievements: "Achievements",
    skillCategories: { TECHNICAL: "Technical", SOFT: "Soft skills", LANGUAGE: "Languages", TOOL: "Tools & technologies" },
    levels: { native: "Native", fluent: "Fluent", advanced: "Advanced", intermediate: "Intermediate", basic: "Basic" },
    employment: {
      "full-time": "Full-time", "part-time": "Part-time", contract: "Contract", freelance: "Freelance",
      internship: "Internship", temporary: "Temporary", volunteer: "Volunteer",
    },
  },
  ar: {
    sections: {
      summary: "نبذة مهنية", experience: "الخبرات المهنية", education: "التعليم", skills: "المهارات", projects: "المشاريع",
      certifications: "الشهادات", languages: "اللغات", awards: "الجوائز", publications: "المنشورات",
      volunteer: "العمل التطوعي", interests: "الاهتمامات", references: "المراجع",
    },
    contact: "التواصل",
    objectives: "الأهداف المهنية",
    achievements: "أبرز الإنجازات",
    present: "حتى الآن",
    expires: "تنتهي",
    grade: "التقدير",
    technologies: "التقنيات",
    keyAchievements: "الإنجازات",
    skillCategories: { TECHNICAL: "مهارات تقنية", SOFT: "مهارات شخصية", LANGUAGE: "لغات", TOOL: "أدوات وتقنيات" },
    levels: { native: "اللغة الأم", fluent: "طلاقة", advanced: "متقدم", intermediate: "متوسط", basic: "مبتدئ" },
    employment: {
      "full-time": "دوام كامل", "part-time": "دوام جزئي", contract: "عقد", freelance: "عمل حر",
      internship: "تدريب", temporary: "مؤقت", volunteer: "تطوع",
    },
  },
} as const;

export type CvLabels = (typeof CV_LABELS)[CvLang];

export function sectionTitle(lang: CvLang, key: CvSectionKey, custom?: string | null) {
  return custom?.trim() || CV_LABELS[lang].sections[key];
}

/** Formats a YYYY-MM value in the CV's language (Latin digits in Arabic, as is usual on CVs). */
export function formatMonth(value: string | null | undefined, lang: CvLang, format: CvDesign["dateFormat"]) {
  if (!value) return "";
  const m = /^(\d{4})-(\d{2})$/.exec(value);
  if (!m) return value;
  const [, y, mo] = m;
  if (format === "year") return y;
  if (format === "numeric") return `${mo}/${y}`;
  const date = new Date(Date.UTC(Number(y), Number(mo) - 1, 1));
  return new Intl.DateTimeFormat(lang === "ar" ? "ar-u-nu-latn" : "en", { month: "short", year: "numeric", timeZone: "UTC" }).format(date);
}

export function formatRange(start: string | null | undefined, end: string | null | undefined, current: boolean, lang: CvLang, format: CvDesign["dateFormat"]) {
  const s = formatMonth(start, lang, format);
  const e = current ? CV_LABELS[lang].present : formatMonth(end, lang, format);
  if (s && e) return s === e ? s : `${s} – ${e}`;
  return s || e;
}

/** Splits free text into paragraphs/bullets. Lines starting with -, *, • become bullets. */
export function splitLines(text: string | null | undefined) {
  return (text ?? "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((l) => {
      const bullet = /^[-*•·▪]\s*/.test(l);
      return { bullet, text: bullet ? l.replace(/^[-*•·▪]\s*/, "") : l };
    });
}

export const displayUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "");
