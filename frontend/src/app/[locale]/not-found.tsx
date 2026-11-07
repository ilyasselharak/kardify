import { useTranslations } from "next-intl";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("notFound");
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-6 text-center">
      <Logo />
      <p className="mt-10 text-7xl font-extrabold tracking-tight text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">{t("body")}</p>
      <Button asChild className="mt-8"><Link href="/">{t("home")}</Link></Button>
    </div>
  );
}
