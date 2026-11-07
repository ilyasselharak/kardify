import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminAuditView } from "@/components/admin/admin-audit-view";
import { pageTitle } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("admin", "tabs.audit") };
}

export default function Page() {
  return (
    <Suspense>
      <AdminAuditView />
    </Suspense>
  );
}
