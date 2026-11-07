import type { BusinessCard, Locale, SocialLink, UserPreferences } from "@/lib/api/types";
import { normalizeDesign, templateDesign } from "@/lib/design/templates";
import type { TemplateId } from "@/lib/design/types";
import type { CardPayload } from "@/lib/hooks/use-cards";
import type { CardFormValues } from "@/lib/validation/card";

/** Converts a stored card (or user defaults) into wizard form values. */
export function cardToFormValues(card: BusinessCard | undefined, prefs?: UserPreferences, locale: Locale = "en"): CardFormValues {
  if (card) {
    return {
      name: card.name,
      jobTitle: card.jobTitle ?? "",
      companyName: card.companyName ?? "",
      description: card.description ?? "",
      profileImage: card.profileImage ?? "",
      companyLogo: card.companyLogo ?? "",
      language: card.language,
      email: card.email ?? "",
      phone: card.phone ?? "",
      whatsapp: card.whatsapp ?? "",
      website: card.website ?? "",
      address: card.address ?? "",
      mapsUrl: card.mapsUrl ?? "",
      socialLinks: card.socialLinks.map((l) => ({ ...l, visible: l.visible !== false })),
      designSettings: normalizeDesign(card.designSettings),
    };
  }
  const design = templateDesign((prefs?.defaultTemplate as TemplateId) ?? "classic");
  if (prefs?.defaultPrimaryColor) design.primaryColor = prefs.defaultPrimaryColor;
  if (prefs?.defaultBackgroundColor) {
    design.backgroundColor = prefs.defaultBackgroundColor;
    design.gradientFrom = prefs.defaultBackgroundColor;
  }
  if (prefs?.defaultTextColor) design.textColor = prefs.defaultTextColor;
  return {
    name: "", jobTitle: "", companyName: "", description: "", profileImage: "", companyLogo: "",
    language: prefs?.defaultCardLanguage ?? locale,
    email: "", phone: "", whatsapp: "", website: "", address: "", mapsUrl: "",
    socialLinks: [],
    designSettings: design,
  };
}

const nullIfEmpty = (v: string) => (v.trim() === "" ? null : v.trim());

/** Converts wizard values to the API payload (empty strings → null, empty social URLs dropped). */
export function formValuesToPayload(v: CardFormValues): CardPayload {
  return {
    name: v.name.trim(),
    jobTitle: nullIfEmpty(v.jobTitle),
    companyName: nullIfEmpty(v.companyName),
    description: nullIfEmpty(v.description),
    profileImage: nullIfEmpty(v.profileImage),
    companyLogo: nullIfEmpty(v.companyLogo),
    language: v.language,
    email: nullIfEmpty(v.email),
    phone: nullIfEmpty(v.phone),
    whatsapp: nullIfEmpty(v.whatsapp),
    website: nullIfEmpty(v.website),
    address: nullIfEmpty(v.address),
    mapsUrl: nullIfEmpty(v.mapsUrl),
    socialLinks: v.socialLinks
      .filter((l) => l.url.trim() !== "")
      .map((l): SocialLink => ({ platform: l.platform, url: l.url.trim(), visible: l.visible, ...(l.label ? { label: l.label } : {}) })),
    designSettings: v.designSettings,
  };
}

/** Card-like object for the live preview, built from in-progress form values. */
export function formValuesToPreview(v: CardFormValues) {
  const p = formValuesToPayload(v);
  return { ...p, name: p.name || "", socialLinks: p.socialLinks ?? [], designSettings: v.designSettings };
}
