import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminUsersView } from "@/components/admin/admin-users-view";
import { pageTitle } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("admin", "tabs.users") };
}

export default function Page() {
  return (
    <Suspense>
      <AdminUsersView />
    </Suspense>
  );
}
