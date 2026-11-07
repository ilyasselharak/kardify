"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import type { AppLocale } from "@/i18n/routing";
import { cn } from "@/lib/utils";

/** Toggles between English and Arabic, keeping the current path. Layout direction follows automatically. */
export function LocaleSwitcher({ className, onChange, variant = "ghost" }: {
  className?: string;
  onChange?: (locale: AppLocale) => void;
  variant?: "ghost" | "outline";
}) {
  const locale = useLocale() as AppLocale;
  const t = useTranslations("nav");
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [pending, startTransition] = useTransition();
  const next: AppLocale = locale === "en" ? "ar" : "en";

  return (
    <Button
      variant={variant}
      size="sm"
      className={cn("gap-1.5", className)}
      aria-label={t("switchLanguage")}
      disabled={pending}
      onClick={() => {
        onChange?.(next);
        startTransition(() => {
          // @ts-expect-error -- params are the current route's params, valid for the same pathname
          router.replace({ pathname, params }, { locale: next });
        });
      }}
    >
      <Languages className="size-4" />
      <span className={next === "ar" ? "font-[family-name:var(--font-ui-arabic)]" : ""}>{next === "ar" ? "العربية" : "English"}</span>
    </Button>
  );
}
