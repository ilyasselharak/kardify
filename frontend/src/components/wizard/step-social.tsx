"use client";

import { Eye, EyeOff, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { SocialIcon, PLATFORM_COLORS } from "@/components/cards/social-icons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/api/types";
import type { CardFormValues } from "@/lib/validation/card";
import { cn } from "@/lib/utils";
import { StepHeading } from "./step-heading";

export function StepSocial() {
  const t = useTranslations("wizard.social");
  const tv = useTranslations("validation");
  const tc = useTranslations("common");
  const { control, register, formState: { errors } } = useFormContext<CardFormValues>();
  const { fields, append, remove } = useFieldArray({ control, name: "socialLinks" });
  const used = new Set(fields.map((f) => f.platform));

  return (
    <div className="grid gap-6">
      <StepHeading title={t("title")} subtitle={t("subtitle")} />

      {fields.length === 0 && <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">{t("empty")}</p>}

      <ul className="grid gap-3">
        {fields.map((field, i) => {
          const err = errors.socialLinks?.[i]?.url?.message;
          return (
            <li key={field.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg text-white" style={{ background: PLATFORM_COLORS[field.platform as SocialPlatform] }}>
                  <SocialIcon platform={field.platform as SocialPlatform} className="size-[18px]" />
                </span>
                <div className="grid min-w-0 flex-1 gap-2">
                  <span className="text-sm font-medium">{t(`platforms.${field.platform}`)}</span>
                  <Input dir="ltr" placeholder={t("urlPlaceholder")} aria-invalid={!!err} aria-label={t(`platforms.${field.platform}`)} {...register(`socialLinks.${i}.url`)} />
                  {field.platform === "custom" && <Input dir="auto" placeholder={t("labelPlaceholder")} {...register(`socialLinks.${i}.label`)} />}
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Controller control={control} name={`socialLinks.${i}.visible`} render={({ field: f }) => (
                    <label className="flex items-center gap-1.5 text-xs text-muted-foreground" title={f.value ? t("visible") : t("hidden")}>
                      {f.value ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                      <Switch checked={f.value} onCheckedChange={f.onChange} aria-label={t("visible")} />
                    </label>
                  )} />
                  <Button type="button" variant="ghost" size="icon-sm" onClick={() => remove(i)} aria-label={tc("remove")}>
                    <Trash2 className="text-muted-foreground" />
                  </Button>
                </div>
              </div>
              {err && <p className="mt-2 text-[13px] text-destructive">{tv(err as "urlInvalid")}</p>}
            </li>
          );
        })}
      </ul>

      <div>
        <p className="mb-3 text-sm font-medium">{t("add")}</p>
        <div className="flex flex-wrap gap-2">
          {SOCIAL_PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              disabled={p !== "custom" && used.has(p)}
              onClick={() => append({ platform: p, url: "", visible: true, label: "" })}
              className={cn(
                "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium transition hover:border-primary hover:text-primary disabled:pointer-events-none disabled:opacity-40",
              )}
            >
              <Plus className="size-3.5" />
              <SocialIcon platform={p} className="size-3.5" />
              {t(`platforms.${p}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
