import type { Metadata } from "next";
import { pageTitle } from "@/i18n/server";
import { Suspense } from "react";
import { CardsListView } from "@/components/dashboard/views/cards-list-view";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("cards", "title") };
}

export default function Page() {
  return (
    <Suspense>
      <CardsListView />
    </Suspense>
  );
}
