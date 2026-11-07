import type { Metadata } from "next";
import { pageTitle } from "@/i18n/server";
import { Suspense } from "react";
import { OverviewView } from "@/components/dashboard/views/overview-view";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("dashboard.nav", "overview") };
}

export default function Page() {
  return (
    <Suspense>
      <OverviewView />
    </Suspense>
  );
}
