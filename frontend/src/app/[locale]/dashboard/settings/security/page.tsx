import type { Metadata } from "next";
import { pageTitle } from "@/i18n/server";
import { Suspense } from "react";
import { SecuritySettings } from "@/components/settings/security-settings";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("settings.tabs", "security") };
}

export default function Page() {
  return (
    <Suspense>
      <SecuritySettings />
    </Suspense>
  );
}
