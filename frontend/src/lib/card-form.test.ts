import { describe, expect, it } from "vitest";
import { cardToFormValues, formValuesToPayload } from "./card-form";
import { TEMPLATES, normalizeDesign } from "./design/templates";
import { cardFormSchema } from "./validation/card";

describe("card form mapping", () => {
  it("creates defaults from user preferences", () => {
    const v = cardToFormValues(undefined, { defaultTemplate: "dark", defaultPrimaryColor: "#123456", defaultCardLanguage: "ar" }, "en");
    expect(v.designSettings.template).toBe("dark");
    expect(v.designSettings.primaryColor).toBe("#123456");
    expect(v.language).toBe("ar");
  });

  it("converts empty strings to null and drops empty social links", () => {
    const v = cardToFormValues(undefined, undefined, "en");
    v.name = "  Jane Doe ";
    v.website = "https://example.com";
    v.socialLinks = [
      { platform: "linkedin", url: "https://linkedin.com/in/jane", visible: true },
      { platform: "github", url: "  ", visible: false },
    ];
    const p = formValuesToPayload(v);
    expect(p.name).toBe("Jane Doe");
    expect(p.jobTitle).toBeNull();
    expect(p.email).toBeNull();
    expect(p.website).toBe("https://example.com");
    expect(p.socialLinks).toEqual([{ platform: "linkedin", url: "https://linkedin.com/in/jane", visible: true }]);
  });

  it("validates contact fields with translation keys", () => {
    const v = { ...cardToFormValues(undefined, undefined, "en"), name: "Jane", website: "example", phone: "abc", email: "x@" };
    const r = cardFormSchema.safeParse(v);
    const map = Object.fromEntries((r.error?.issues ?? []).map((i) => [i.path.join("."), i.message]));
    expect(map).toMatchObject({ website: "urlInvalid", phone: "phoneInvalid", email: "emailInvalid" });
  });

  it("normalizes partial stored designs from their template", () => {
    const d = normalizeDesign({ template: "elegant", primaryColor: "#000000" });
    expect(d.fontFamily).toBe(TEMPLATES.elegant.fontFamily);
    expect(d.primaryColor).toBe("#000000");
    expect(d.back.showQr).toBe(true);
  });
});
