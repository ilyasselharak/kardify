import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminCompaniesView } from "@/components/admin/admin-companies-view";
import { pageTitle } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("admin", "tabs.companies") };
}

export default function Page() {
  return (
    <Suspense>
      <AdminCompaniesView />
    </Suspense>
  );
}
