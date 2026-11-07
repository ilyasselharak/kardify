import type { Metadata } from "next";
import { pageTitle } from "@/i18n/server";
import { Suspense } from "react";
import { RegisterForm } from "@/components/auth/register-form";

export async function generateMetadata(): Promise<Metadata> {
  return { title: await pageTitle("auth.register", "title"), robots: { index: false } };
}

export default function Page() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}
