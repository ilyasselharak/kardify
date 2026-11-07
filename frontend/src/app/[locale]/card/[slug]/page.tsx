import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { currentLocale } from "@/i18n/server";
import { Suspense } from "react";
import { PublicCardNotFound } from "@/components/public-card/public-card-not-found";
import { PublicCardSkeleton } from "@/components/public-card/public-card-skeleton";
import { PublicCardView } from "@/components/public-card/public-card-view";
import { getPublicCard } from "@/lib/server/public-card";

type Props = PageProps<"/[locale]/card/[slug]">;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const card = await getPublicCard(slug);
  if (!card) {
    const t = await getTranslations({ locale: await currentLocale(), namespace: "publicCard" });
    return { title: t("notFoundTitle"), robots: { index: false } };
  }
  const subtitle = [card.jobTitle, card.companyName].filter(Boolean).join(" · ");
  const images = card.profileImage ? [{ url: card.profileImage }] : [{ url: "/brand/kardify-mark.png" }];
  return {
    title: card.name,
    description: card.description ?? subtitle,
    openGraph: { title: card.name, description: subtitle || card.description || undefined, images, type: "profile", url: card.url },
    twitter: { card: "summary", title: card.name, description: subtitle },
    alternates: { canonical: card.url },
  };
}

async function CardContent({ params, searchParams }: Pick<Props, "params" | "searchParams">) {
  const [{ slug }, query] = await Promise.all([params, searchParams]);
  const card = await getPublicCard(slug);
  if (!card) return <PublicCardNotFound />;
  const src = typeof query.src === "string" ? query.src : undefined;
  return <PublicCardView card={card} source={src} />;
}

export default function PublicCardPage({ params, searchParams }: Props) {
  return (
    <main className="min-h-dvh bg-background">
      <Suspense fallback={<PublicCardSkeleton />}>
        <CardContent params={params} searchParams={searchParams} />
      </Suspense>
    </main>
  );
}
