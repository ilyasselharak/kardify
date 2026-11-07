import type { Metadata } from "next";
import { pageTitle } from "@/i18n/server";
import { Suspense } from "react";
import { AccountSettings } from "@/components/settings/account-settings";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("settings.tabs", "account") };
}

export default function Page() {
  return (
    <Suspense>
      <AccountSettings />
    </Suspense>
  );
}
