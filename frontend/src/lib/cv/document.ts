import { CV_SECTION_KEYS, EXTRA_KIND_SECTION, type Cv, type CvContent, type CvDocument, type CvProfile, type CvSection, type CvSectionKey } from "./types";

/**
 * Builds the render document from the editor state — the same rules as the backend's
 * `toCvDocument`, so the live preview matches the public page and PDF exactly.
 */
export function buildCvDocument(cv: Pick<Cv, "template" | "language" | "design" | "headline" | "summary" | "updatedAt"> & Partial<Pick<Cv, "fullName">> & CvContent, profile: CvProfile): CvDocument {
  const enabled = new Set(cv.sections.filter((s) => s.enabled).map((s) => s.key));
  const on = <T,>(key: CvSectionKey, rows: T[]) => (enabled.has(key) ? rows : []);
  const hasSummary = enabled.has("summary");
  return {
    profile: {
      ...profile,
      fullName: cv.fullName || profile.fullName,
      professionalTitle: cv.headline || profile.professionalTitle,
      summary: hasSummary ? cv.summary || profile.summary : "",
      objectives: hasSummary ? profile.objectives : "",
      achievements: hasSummary ? profile.achievements : "",
    },
    template: cv.template,
    language: cv.language,
    design: cv.design,
    sections: cv.sections.filter((s) => s.enabled),
    experiences: on("experience", cv.experiences),
    educations: on("education", cv.educations),
    skills: on("skills", cv.skills),
    projects: on("projects", cv.projects),
    certifications: on("certifications", cv.certifications),
    languages: on("languages", cv.languages),
    extras: cv.extras.filter((x) => enabled.has(EXTRA_KIND_SECTION[x.kind])),
    updatedAt: cv.updatedAt,
  };
}

/** Every key exactly once, keeping the stored order. */
export function completeSections(sections: CvSection[]): CvSection[] {
  const seen = new Set(sections.map((s) => s.key));
  return [...sections, ...CV_SECTION_KEYS.filter((k) => !seen.has(k)).map((key) => ({ key, enabled: false, title: null }))];
}

export const EMPTY_PROFILE: CvProfile = {
  fullName: "", professionalTitle: "", photo: null, email: null, phone: null, address: null, city: null, country: null,
  website: null, linkedin: null, github: null, portfolio: null, summary: "", objectives: "", achievements: "",
};

/** Whether a section has anything to print (empty sections are skipped). */
export function sectionHasContent(doc: CvDocument, key: CvSectionKey) {
  switch (key) {
    case "summary":
      return !!(doc.profile.summary || doc.profile.objectives || doc.profile.achievements);
    case "experience":
      return doc.experiences.length > 0;
    case "education":
      return doc.educations.length > 0;
    case "skills":
      return doc.skills.length > 0;
    case "projects":
      return doc.projects.length > 0;
    case "certifications":
      return doc.certifications.length > 0;
    case "languages":
      return doc.languages.length > 0;
    default:
      return doc.extras.some((x) => EXTRA_KIND_SECTION[x.kind] === key);
  }
}

/** Sample document used for template thumbnails and the template gallery. */
export function sampleCvDocument(lang: "en" | "ar" = "en"): CvDocument {
  const ar = lang === "ar";
  return {
    template: "modern",
    language: lang,
    design: {},
    profile: {
      fullName: ar ? "سارة العلمي" : "Sara Alami",
      professionalTitle: ar ? "مهندسة برمجيات أولى" : "Senior Software Engineer",
      photo: null,
      email: "sara@example.com",
      phone: "+212 600 000 000",
      address: null,
      city: ar ? "الرباط" : "Rabat",
      country: ar ? "المغرب" : "Morocco",
      website: "https://sara.dev",
      linkedin: "https://linkedin.com/in/sara",
      github: "https://github.com/sara",
      portfolio: null,
      summary: ar
        ? "مهندسة برمجيات بخبرة ثماني سنوات في بناء منصات ويب قابلة للتوسع، مع تركيز على الجودة وتجربة المستخدم."
        : "Software engineer with eight years of experience building scalable web platforms, focused on quality, performance and great user experience.",
      objectives: "",
      achievements: "",
    },
    sections: (["summary", "experience", "education", "skills", "languages", "certifications"] as CvSectionKey[]).map((key) => ({ key, enabled: true, title: null })),
    experiences: [
      {
        jobTitle: ar ? "مهندسة برمجيات أولى" : "Senior Software Engineer", company: "Atlas Cloud", location: ar ? "الرباط" : "Rabat",
        employmentType: "full-time", startDate: "2021-03", endDate: null, current: true,
        responsibilities: ar ? "- قيادة فريق من خمسة مطورين\n- تصميم واجهات برمجية عالية الأداء" : "- Lead a team of five engineers\n- Designed high-throughput APIs serving 2M requests a day",
        achievements: "",
      },
      {
        jobTitle: ar ? "مطورة واجهات" : "Frontend Developer", company: "Nova Studio", location: ar ? "الدار البيضاء" : "Casablanca",
        employmentType: "full-time", startDate: "2017-09", endDate: "2021-02", current: false,
        responsibilities: ar ? "- بناء تطبيقات React لعملاء دوليين" : "- Built React applications for international clients\n- Introduced automated testing",
        achievements: "",
      },
    ],
    educations: [
      { degree: ar ? "ماستر في هندسة البرمجيات" : "MSc Software Engineering", institution: ar ? "جامعة محمد الخامس" : "Mohammed V University", location: null, startDate: "2015-09", endDate: "2017-06", description: "", grade: null },
    ],
    skills: ["TypeScript", "React", "Node.js", "PostgreSQL", "Docker", ar ? "القيادة" : "Leadership"].map((name, i) => ({ name, category: i === 5 ? "SOFT" : "TECHNICAL", level: 5 - (i % 3) })),
    projects: [],
    certifications: [{ name: "AWS Solutions Architect", issuer: "Amazon Web Services", issueDate: "2023-04", expirationDate: null, credentialUrl: null }],
    languages: [
      { language: ar ? "العربية" : "Arabic", proficiency: "native" },
      { language: ar ? "الإنجليزية" : "English", proficiency: "fluent" },
      { language: ar ? "الفرنسية" : "French", proficiency: "advanced" },
    ],
    extras: [],
  };
}
