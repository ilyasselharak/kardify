import { FileX2 } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";
import { currentLocale } from "@/i18n/server";

/** Same response for missing, private and disabled CVs, so nothing about them leaks. */
export async function PublicCvNotFound() {
  const t = await getTranslations({ locale: await currentLocale(), namespace: "cvPublic" });
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        <FileX2 className="size-8" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">{t("notFoundTitle")}</h1>
      <p className="mt-2 max-w-sm text-muted-foreground">{t("notFoundBody")}</p>
      <Button asChild className="mt-6">
        <Link href="/">{t("home")}</Link>
      </Button>
    </div>
  );
}
