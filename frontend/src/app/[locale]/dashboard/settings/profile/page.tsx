import type { Metadata } from "next";
import { pageTitle } from "@/i18n/server";
import { Suspense } from "react";
import { ProfileSettings } from "@/components/settings/profile-settings";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("settings.tabs", "profile") };
}

export default function Page() {
  return (
    <Suspense>
      <ProfileSettings />
    </Suspense>
  );
}
