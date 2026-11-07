import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminOverviewView } from "@/components/admin/admin-overview-view";
import { pageTitle } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("admin", "title") };
}

export default function Page() {
  return (
    <Suspense>
      <AdminOverviewView />
    </Suspense>
  );
}
