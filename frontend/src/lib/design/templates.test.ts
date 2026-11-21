import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { normalizeDesign, switchTemplate, TEMPLATE_CATEGORY, TEMPLATES, TEMPLATES_BY_CATEGORY, templateDesign } from "./templates";
import { TEMPLATE_CATEGORIES, TEMPLATE_IDS } from "./types";

describe("business card templates", () => {
  it("offers at least 12 templates across all 8 categories", () => {
    expect(TEMPLATE_IDS.length).toBeGreaterThanOrEqual(12);
    for (const c of TEMPLATE_CATEGORIES) expect(TEMPLATES_BY_CATEGORY[c]?.length, c).toBeGreaterThan(0);
  });

  it("is identical to the backend presets (used for wallet colours and defaults)", () => {
    const backend = readFileSync(resolve(__dirname, "../../../../backend/src/card-design/templates.ts"), "utf8");
    for (const id of TEMPLATE_IDS) {
      const t = TEMPLATES[id];
      for (const value of [t.primaryColor, t.secondaryColor, t.backgroundColor, t.textColor, t.layout, t.fontFamily, t.back.layout]) {
        expect(backend, `${id}: ${value}`).toContain(`'${value}'`);
      }
      expect(backend).toContain(`${id}: '${TEMPLATE_CATEGORY[id]}'`);
    }
  });

  it("uses many distinct layouts (not recolours of one design)", () => {
    expect(new Set(Object.values(TEMPLATES).map((t) => t.layout)).size).toBeGreaterThanOrEqual(10);
    expect(new Set(Object.values(TEMPLATES).map((t) => t.back.layout)).size).toBe(4);
  });

  it("switching template keeps the user's background image and tagline", () => {
    const current = { ...templateDesign("classic"), backgroundImage: "https://res.cloudinary.com/x.webp", backgroundOverlay: 30, back: { ...templateDesign("classic").back, tagline: "Hello" } };
    const next = switchTemplate(current, "luxe");
    expect(next.layout).toBe("frame");
    expect(next.backgroundImage).toBe(current.backgroundImage);
    expect(next.backgroundOverlay).toBe(30);
    expect(next.back.tagline).toBe("Hello");
  });

  it("completes legacy stored designs and rejects unknown templates", () => {
    const legacy = normalizeDesign({ template: "dark", primaryColor: "#123456" } as never);
    expect(legacy.primaryColor).toBe("#123456");
    expect(legacy.pattern).toBe(TEMPLATES.dark.pattern);
    expect(legacy.back.layout).toBe(TEMPLATES.dark.back.layout);
    expect(normalizeDesign({ template: "nope" } as never).template).toBe("classic");
  });
});
