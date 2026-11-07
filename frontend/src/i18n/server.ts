import { hasLocale } from "next-intl";
import { locale as rootLocale } from "next/root-params";
import { routing, type AppLocale } from "./routing";

/** Current locale from the `[locale]` root param (no request headers, so it is cache-safe). */
export async function currentLocale(): Promise<AppLocale> {
  const l = await rootLocale();
  return hasLocale(routing.locales, l) ? l : routing.defaultLocale;
}

/** Cached, translated page title. Takes only plain strings so it never captures route params. */
export async function pageTitle(namespace: string, key: string): Promise<string> {
  return translated(await currentLocale(), namespace, key);
}

async function translated(locale: AppLocale, namespace: string, key: string): Promise<string> {
  "use cache";
  const { getTranslations } = await import("next-intl/server");
  const t = await getTranslations({ locale, namespace });
  return t(key as never);
}

/** Localized default title + description for public (indexable) sections. */
export async function localizedSiteMetadata() {
  const [title, description] = await Promise.all([pageTitle("meta", "title"), pageTitle("meta", "description")]);
  return {
    title: { default: title, template: "%s · Kardify" },
    description,
    openGraph: { siteName: "Kardify", type: "website" as const, title, description },
  };
}
