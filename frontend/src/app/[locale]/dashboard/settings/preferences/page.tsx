import type { Metadata } from "next";
import { pageTitle } from "@/i18n/server";
import { Suspense } from "react";
import { PreferencesSettings } from "@/components/settings/preferences-settings";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("settings.tabs", "preferences") };
}

export default function Page() {
  return (
    <Suspense>
      <PreferencesSettings />
    </Suspense>
  );
}
