"use client";

import { CheckCircle2, Circle, Link2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";
import type { CardFormValues } from "@/lib/validation/card";
import { cn } from "@/lib/utils";
import { StepHeading } from "./step-heading";

export function StepPublish({ publicUrl }: { publicUrl?: string }) {
  const t = useTranslations("wizard.publish");
  const { control } = useFormContext<CardFormValues>();
  const v = useWatch({ control }) as CardFormValues;
  const checks = [
    { ok: !!v.name?.trim(), label: t("checkName") },
    { ok: !!(v.email || v.phone || v.whatsapp || v.website), label: t("checkContact") },
    { ok: !!(v.profileImage || v.companyLogo), label: t("checkPhoto") },
    { ok: (v.socialLinks ?? []).some((l) => l.url), label: t("checkSocial") },
  ];
  return (
    <div className="grid gap-6">
      <StepHeading title={t("title")} subtitle={t("subtitle")} />
      <div className="rounded-xl border border-border bg-muted/40 p-4">
        <p className="flex items-center gap-2 text-sm font-medium"><Link2 className="size-4 text-primary" /> {t("publicUrl")}</p>
        {publicUrl ? (
          <p dir="ltr" className="mt-2 truncate text-start font-mono text-sm text-primary">{publicUrl}</p>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">{t("urlAfterPublish")}</p>
        )}
      </div>
      <div>
        <p className="mb-3 text-sm font-semibold">{t("checklist")}</p>
        <ul className="grid gap-2">
          {checks.map((c) => (
            <li key={c.label} className={cn("flex items-center gap-2.5 text-sm", c.ok ? "text-foreground" : "text-muted-foreground")}>
              {c.ok ? <CheckCircle2 className="size-4 text-success" /> : <Circle className="size-4" />}
              {c.label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
