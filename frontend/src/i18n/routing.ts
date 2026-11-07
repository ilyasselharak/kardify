import { defineRouting } from "next-intl/routing";

export const locales = ["en", "ar"] as const;
export type AppLocale = (typeof locales)[number];

export const routing = defineRouting({
  locales,
  defaultLocale: "en",
  localePrefix: "always",
});

export const RTL_LOCALES: readonly AppLocale[] = ["ar"];
export const directionFor = (locale: string) => (RTL_LOCALES.includes(locale as AppLocale) ? "rtl" : "ltr");
