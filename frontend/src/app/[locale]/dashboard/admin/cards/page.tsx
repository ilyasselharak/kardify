import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminCardsView } from "@/components/admin/admin-cards-view";
import { pageTitle } from "@/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("admin", "tabs.cards") };
}

export default function Page() {
  return (
    <Suspense>
      <AdminCardsView />
    </Suspense>
  );
}
