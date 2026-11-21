import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { PublicCvView } from "@/components/cv/public-cv-view";
import { PublicCvNotFound } from "@/components/cv/public-cv-not-found";
import { Skeleton } from "@/components/ui/skeleton";
import { currentLocale } from "@/i18n/server";
import { getPublicCv } from "@/lib/server/public-cv";

type Props = PageProps<"/[locale]/cv/[slug]">;

/**
 * Public CV page. Rendered per request without caching, so privacy changes apply instantly.
 * PUBLIC CVs are indexable; UNLISTED ones carry noindex (the API also sends X-Robots-Tag).
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const cv = await getPublicCv(slug);
  if (!cv) {
    const t = await getTranslations({ locale: await currentLocale(), namespace: "cvPublic" });
    return { title: t("notFoundTitle"), robots: { index: false, follow: false } };
  }
  const p = cv.document.profile;
  const title = [p.fullName, p.professionalTitle].filter(Boolean).join(" — ") || "CV";
  const description = (p.summary || p.professionalTitle || "").slice(0, 200);
  const images = p.photo ? [{ url: p.photo }] : [{ url: "/brand/kardify-mark.png" }];
  return {
    title,
    description,
    robots: cv.indexable ? { index: true, follow: true } : { index: false, follow: false, nocache: true },
    openGraph: { title, description, url: cv.url, type: "profile", images },
    twitter: { card: "summary", title, description },
    alternates: cv.indexable ? { canonical: cv.url } : undefined,
  };
}

async function CvContent({ params }: Pick<Props, "params">) {
  const { slug } = await params;
  const cv = await getPublicCv(slug);
  if (!cv) return <PublicCvNotFound />;
  return <PublicCvView doc={cv.document} url={cv.url} slug={cv.slug} allowDownload={cv.allowDownload} />;
}

export default function PublicCvPage({ params }: Props) {
  return (
    <Suspense fallback={<div className="mx-auto max-w-4xl p-6"><Skeleton className="h-[80dvh] rounded-2xl" /></div>}>
      <CvContent params={params} />
    </Suspense>
  );
}
