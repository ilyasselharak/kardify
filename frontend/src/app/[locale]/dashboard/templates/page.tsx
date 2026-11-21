import type { Metadata } from "next";
import { Suspense } from "react";
import { TemplatesView } from "@/components/templates/templates-view";
import { pageTitle } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("templates", "title") };
}

export default function Page() {
  return (
    <Suspense>
      <TemplatesView />
    </Suspense>
  );
}
