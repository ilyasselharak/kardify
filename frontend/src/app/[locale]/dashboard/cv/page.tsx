import type { Metadata } from "next";
import { Suspense } from "react";
import { CvDashboardView } from "@/components/cv/cv-dashboard-view";
import { pageTitle } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("cv", "title") };
}

export default function Page() {
  return (
    <Suspense>
      <CvDashboardView />
    </Suspense>
  );
}
