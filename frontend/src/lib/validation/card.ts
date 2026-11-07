import { z } from "zod";
import { SOCIAL_PLATFORMS } from "@/lib/api/types";
import {
  BACKGROUND_TYPES, FONT_FAMILIES, FONT_SIZES, LAYOUTS, LOGO_POSITIONS, PHOTO_SHAPES, SOCIAL_ICON_STYLES, TEMPLATE_IDS,
} from "@/lib/design/types";

const optionalText = (max: number) => z.string().trim().max(max, "tooLong");
const optionalUrl = z
  .string()
  .trim()
  .max(1000, "tooLong")
  .refine((v) => v === "" || /^https?:\/\/[^\s.]+\.[^\s]{2,}/i.test(v), "urlInvalid");
const optionalPhone = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\+?[0-9\s().-]{5,25}$/.test(v), "phoneInvalid");
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, "colorInvalid");

const face = {
  backgroundType: z.enum(BACKGROUND_TYPES),
  backgroundColor: hex,
  gradientFrom: hex,
  gradientTo: hex,
  gradientAngle: z.number().int().min(0).max(360),
  textColor: hex,
};

export const designSchema = z.object({
  ...face,
  template: z.enum(TEMPLATE_IDS),
  primaryColor: hex,
  fontFamily: z.enum(FONT_FAMILIES),
  fontSize: z.enum(FONT_SIZES),
  borderRadius: z.number().int().min(0).max(40),
  layout: z.enum(LAYOUTS),
  photoShape: z.enum(PHOTO_SHAPES),
  logoPosition: z.enum(LOGO_POSITIONS),
  socialIconStyle: z.enum(SOCIAL_ICON_STYLES),
  back: z.object({ ...face, showQr: z.boolean(), tagline: z.string().max(120, "tooLong") }),
});

export const socialLinkSchema = z.object({
  platform: z.enum(SOCIAL_PLATFORMS),
  url: optionalUrl,
  visible: z.boolean(),
  label: z.string().max(40, "tooLong").optional(),
});

/** Wizard form values. Empty strings are converted to null when sent to the API. */
export const cardFormSchema = z.object({
  // Step 1
  name: z.string().trim().min(1, "required").max(120, "tooLong"),
  jobTitle: optionalText(120),
  companyName: optionalText(120),
  description: optionalText(600),
  profileImage: z.string(),
  companyLogo: z.string(),
  language: z.enum(["en", "ar"]),
  // Step 2
  email: z.string().trim().max(254, "tooLong").refine((v) => v === "" || z.email().safeParse(v).success, "emailInvalid"),
  phone: optionalPhone,
  whatsapp: optionalPhone,
  website: optionalUrl,
  address: optionalText(300),
  mapsUrl: optionalUrl,
  // Step 3
  socialLinks: z.array(socialLinkSchema).max(20),
  // Step 4
  designSettings: designSchema,
});
export type CardFormValues = z.infer<typeof cardFormSchema>;

export const STEP_FIELDS: (keyof CardFormValues)[][] = [
  ["name", "jobTitle", "companyName", "description", "profileImage", "companyLogo", "language"],
  ["email", "phone", "whatsapp", "website", "address", "mapsUrl"],
  ["socialLinks"],
  ["designSettings"],
  [],
];
