import { redirect } from "@/i18n/navigation";
import { locale } from "next/root-params";

export default async function SettingsIndex() {
  redirect({ href: "/dashboard/settings/profile", locale: (await locale()) as "en" | "ar" });
}
