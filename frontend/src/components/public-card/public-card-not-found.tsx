import { IdCard } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { currentLocale } from "@/i18n/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export async function PublicCardNotFound() {
  const t = await getTranslations({ locale: await currentLocale(), namespace: "publicCard" });
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <IdCard className="size-8" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">{t("notFoundTitle")}</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">{t("notFoundBody")}</p>
      <Button asChild className="mt-6">
        <Link href="/">{t("home")}</Link>
      </Button>
    </div>
  );
}
