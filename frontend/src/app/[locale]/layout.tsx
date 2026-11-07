import type { Metadata, Viewport } from "next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { locale as rootLocale } from "next/root-params";
import { notFound } from "next/navigation";
import { Providers } from "@/components/providers";
import { directionFor, routing } from "@/i18n/routing";
import { localizedSiteMetadata } from "@/i18n/server";
import { fontVariables } from "../fonts";
import "../globals.css";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata(): Promise<Metadata> {
  const site = await localizedSiteMetadata();
  return {
    ...site,
    metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
    applicationName: "Kardify",
    icons: { apple: "/brand/apple-touch-icon.png" },
  };
}

export const viewport: Viewport = {
  themeColor: "#0d1e37",
  width: "device-width",
  initialScale: 1,
};

export default async function LocaleLayout({ children }: LayoutProps<"/[locale]">) {
  const locale = await rootLocale();
  if (!hasLocale(routing.locales, locale)) notFound();
  const dir = directionFor(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={fontVariables}
      style={{ ["--font-ui" as string]: dir === "rtl" ? "var(--font-ui-arabic), var(--font-card-inter)" : "var(--font-card-inter), var(--font-ui-arabic)" }}
      suppressHydrationWarning
    >
      <body className="min-h-dvh">
        <NextIntlClientProvider>
          <Providers dir={dir}>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
