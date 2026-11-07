import type { Metadata } from "next";
import { pageTitle } from "@/i18n/server";
import { Suspense } from "react";
import { VerifyEmailView } from "@/components/auth/verify-email-view";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("auth.verify", "pendingTitle"), robots: { index: false } };
}

export default function Page() {
  return (
    <Suspense>
      <VerifyEmailView />
    </Suspense>
  );
}
