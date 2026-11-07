import { useTranslations } from "next-intl";
import { PageHeader } from "@/components/dashboard/page-header";
import { SettingsNav } from "@/components/settings/settings-nav";

export default function SettingsLayout({ children }: LayoutProps<"/[locale]/dashboard/settings">) {
  const t = useTranslations("settings");
  return (
    <>
      <PageHeader title={t("title")} description={t("subtitle")} className="mb-6" />
      <SettingsNav />
      {children}
    </>
  );
}
