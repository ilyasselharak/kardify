import type { Metadata } from "next";
import { pageTitle } from "@/i18n/server";
import { Suspense } from "react";
import { NewCardView } from "@/components/dashboard/views/edit-card-view";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("wizard", "createTitle") };
}

export default function Page() {
  return (
    <Suspense>
      <NewCardView />
    </Suspense>
  );
}
