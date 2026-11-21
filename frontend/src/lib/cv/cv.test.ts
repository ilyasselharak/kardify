import { describe, expect, it } from "vitest";
import { buildCvDocument, completeSections, sampleCvDocument } from "./document";
import { cvToDraft, draftToPayload, emptyItem, moveItem, newKey, validateDraft } from "./draft";
import { formatMonth, formatRange, sectionTitle, splitLines } from "./labels";
import { MM, PAGE_H, pageGeometry, paginateColumn, paginateDocument } from "./paginate";
import { CV_TEMPLATES, normalizeCvDesign } from "./templates";
import { CV_SECTION_KEYS, CV_TEMPLATE_IDS, type Cv } from "./types";

describe("A4 pagination", () => {
  const cap = () => 100;

  it("fills pages greedily and starts a new page when a block does not fit", () => {
    expect(paginateColumn([{ height: 40 }, { height: 40 }, { height: 40 }], cap)).toEqual([[0, 1], [2]]);
  });

  it("keeps a heading with the block that follows it", () => {
    const blocks = [{ height: 70 }, { height: 10, keepWithNext: true }, { height: 30 }];
    // Heading (10) fits after 70, but heading + entry (40) does not → both move.
    expect(paginateColumn(blocks, cap)).toEqual([[0], [1, 2]]);
  });

  it("breaks a keep-with-next chain that cannot fit on an empty page", () => {
    const blocks = [{ height: 60, keepWithNext: true }, { height: 60 }];
    expect(paginateColumn(blocks, cap)).toEqual([[0], [1]]);
  });

  it("never drops a block taller than a page", () => {
    const pages = paginateColumn([{ height: 20 }, { height: 250 }, { height: 20 }], cap);
    expect(pages.flat()).toEqual([0, 1, 2]);
    expect(pages).toEqual([[0], [1], [2]]);
  });

  it("uses the reduced first-page height under a full-width header and equalises columns", () => {
    const geometry = pageGeometry({ margins: "normal" }, "full");
    const header = 200;
    expect(geometry.columnHeight(0, header)).toBeCloseTo(PAGE_H - header - 15 * MM);
    expect(geometry.columnHeight(1, header)).toBeCloseTo(PAGE_H - 30 * MM);
    const pages = paginateDocument({ main: Array.from({ length: 30 }, () => ({ height: 100 })), side: [{ height: 50 }], headerHeight: header, geometry });
    expect(pages.length).toBeGreaterThan(2);
    expect(pages[0].side).toEqual([0]);
    expect(pages.flatMap((p) => p.main)).toHaveLength(30);
  });
});

describe("CV labels & formatting", () => {
  it("formats months in the CV language with Latin digits", () => {
    expect(formatMonth("2024-03", "en", "short")).toBe("Mar 2024");
    expect(formatMonth("2024-03", "en", "numeric")).toBe("03/2024");
    expect(formatMonth("2024-03", "ar", "year")).toBe("2024");
    expect(formatMonth("2024-03", "ar", "short")).toMatch(/2024/);
    expect(formatMonth("2024-03", "ar", "short")).toMatch(/مارس/);
  });

  it("formats ranges with Present / حتى الآن", () => {
    expect(formatRange("2020-01", null, true, "en", "short")).toBe("Jan 2020 – Present");
    expect(formatRange("2020-01", null, true, "ar", "year")).toBe("2020 – حتى الآن");
    expect(formatRange(null, null, false, "en", "short")).toBe("");
  });

  it("uses custom section headings when set", () => {
    expect(sectionTitle("en", "experience")).toBe("Experience");
    expect(sectionTitle("ar", "experience")).toBe("الخبرات المهنية");
    expect(sectionTitle("en", "experience", "Career")).toBe("Career");
  });

  it("splits text into paragraphs and bullets", () => {
    expect(splitLines("Intro\n- one\n• two\n\n")).toEqual([
      { bullet: false, text: "Intro" },
      { bullet: true, text: "one" },
      { bullet: true, text: "two" },
    ]);
  });
});

describe("CV templates", () => {
  it("defines 8 structurally different templates", () => {
    expect(CV_TEMPLATE_IDS).toHaveLength(8);
    const signatures = new Set(CV_TEMPLATE_IDS.map((id) => {
      const t = CV_TEMPLATES[id];
      return `${t.header}/${t.title}/${t.entry}/${t.sidebar?.side ?? "none"}`;
    }));
    expect(signatures.size).toBe(8);
    expect(CV_TEMPLATE_IDS.filter((id) => CV_TEMPLATES[id].ats).every((id) => !CV_TEMPLATES[id].sidebar)).toBe(true);
  });

  it("defaults Arabic CVs to an Arabic typeface but respects explicit choices", () => {
    expect(normalizeCvDesign("modern", {}, "ar").fontFamily).toBe("cairo");
    expect(normalizeCvDesign("modern", { fontFamily: "lora" }, "ar").fontFamily).toBe("lora");
    expect(normalizeCvDesign("modern", {}, "en").fontFamily).toBe("inter");
  });
});

describe("CV draft & document", () => {
  const cv: Cv = {
    ...sampleCvDocument("en"),
    id: "1", title: "Dev CV", fullName: null, headline: null, summary: null, visibility: "PRIVATE", allowDownload: true, publicLink: null,
    isPublic: false, createdAt: "", updatedAt: "",
    sections: completeSections([{ key: "experience", enabled: true, title: null }, { key: "projects", enabled: false, title: null }]),
    projects: [{ ...emptyItem.projects(), name: "Secret" }],
  };

  it("round-trips without leaking client keys into the API payload", () => {
    const draft = cvToDraft(cv);
    expect(draft.sections).toHaveLength(CV_SECTION_KEYS.length);
    const payload = draftToPayload(draft);
    expect(JSON.stringify(payload)).not.toContain("_key");
    expect(payload.experiences).toEqual(cv.experiences);
  });

  it("hides disabled sections from the rendered document", () => {
    const doc = buildCvDocument(cv, sampleCvDocument("en").profile);
    expect(doc.projects).toEqual([]);
    expect(doc.sections.map((s) => s.key)).toEqual(["experience"]);
  });

  it("validates required fields, URLs and date order", () => {
    const draft = cvToDraft(cv);
    const key = newKey();
    draft.experiences.push({ ...emptyItem.experiences(), _key: key, startDate: "2024-05", endDate: "2023-01" });
    draft.projects[0].url = "not a url";
    const errors = validateDraft(draft);
    expect(errors[`experiences.${key}.jobTitle`]).toBe("required");
    expect(errors[`experiences.${key}.endDate`]).toBe("dateOrder");
    expect(errors[`projects.${draft.projects[0]._key}.url`]).toBe("urlInvalid");
    draft.experiences[draft.experiences.length - 1] = { ...draft.experiences[draft.experiences.length - 1], jobTitle: "Dev", company: "Acme", current: true };
    draft.projects[0].url = "https://example.com";
    expect(validateDraft(draft)).toEqual({});
  });

  it("moves items for drag & drop", () => {
    expect(moveItem(["a", "b", "c"], 0, 2)).toEqual(["b", "c", "a"]);
    expect(moveItem(["a", "b"], 1, 5)).toEqual(["a", "b"]);
  });
});
