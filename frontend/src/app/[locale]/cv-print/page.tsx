import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { CvPrintView } from "@/components/cv/cv-print-view";
import { getRenderDocument } from "@/lib/server/public-cv";

export const metadata: Metadata = { robots: { index: false, follow: false } };

/** Internal route opened by the API's headless browser to print a CV (token-protected). */
async function PrintContent({ searchParams }: Pick<PageProps<"/[locale]/cv-print">, "searchParams">) {
  const { token } = await searchParams;
  const doc = typeof token === "string" ? await getRenderDocument(token) : null;
  if (!doc) notFound();
  return <CvPrintView doc={doc} />;
}

export default function Page({ searchParams }: PageProps<"/[locale]/cv-print">) {
  return (
    <Suspense>
      <PrintContent searchParams={searchParams} />
    </Suspense>
  );
}
