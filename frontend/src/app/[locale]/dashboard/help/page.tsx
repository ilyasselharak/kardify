import type { Metadata } from "next";
import { pageTitle } from "@/i18n/server";
import { Suspense } from "react";
import { HelpView } from "@/components/dashboard/views/help-view";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("help", "title") };
}

export default function Page() {
  return (
    <Suspense>
      <HelpView />
    </Suspense>
  );
}
