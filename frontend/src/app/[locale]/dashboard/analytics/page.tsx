import type { Metadata } from "next";
import { pageTitle } from "@/i18n/server";
import { Suspense } from "react";
import { AnalyticsView } from "@/components/dashboard/views/analytics-view";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("analytics", "title") };
}

export default function Page() {
  return (
    <Suspense>
      <AnalyticsView />
    </Suspense>
  );
}
