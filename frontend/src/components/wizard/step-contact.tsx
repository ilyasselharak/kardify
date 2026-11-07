"use client";

import { Globe, Mail, MapPin, MessageCircle, Navigation, Phone } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormContext } from "react-hook-form";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import type { CardFormValues } from "@/lib/validation/card";
import { StepHeading } from "./step-heading";

function IconInput({ icon: Icon, ...props }: React.ComponentProps<typeof Input> & { icon: typeof Mail }) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="ps-9" {...props} />
    </div>
  );
}

export function StepContact() {
  const t = useTranslations("wizard.contact");
  const { register, formState: { errors } } = useFormContext<CardFormValues>();
  return (
    <div className="grid gap-6">
      <StepHeading title={t("title")} subtitle={t("subtitle")} />
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField id="email" label={t("email")} optional error={errors.email?.message}>
          <IconInput icon={Mail} id="email" type="email" dir="ltr" placeholder="you@company.com" {...register("email")} />
        </FormField>
        <FormField id="phone" label={t("phone")} optional error={errors.phone?.message}>
          <IconInput icon={Phone} id="phone" type="tel" dir="ltr" placeholder="+212 600 000 000" {...register("phone")} />
        </FormField>
        <FormField id="whatsapp" label={t("whatsapp")} optional error={errors.whatsapp?.message}>
          <IconInput icon={MessageCircle} id="whatsapp" type="tel" dir="ltr" placeholder="+212 600 000 000" {...register("whatsapp")} />
        </FormField>
        <FormField id="website" label={t("website")} optional error={errors.website?.message}>
          <IconInput icon={Globe} id="website" type="url" dir="ltr" placeholder="https://" {...register("website")} />
        </FormField>
      </div>
      <FormField id="address" label={t("address")} optional error={errors.address?.message}>
        <IconInput icon={MapPin} id="address" dir="auto" {...register("address")} />
      </FormField>
      <FormField id="mapsUrl" label={t("maps")} optional hint={t("mapsHint")} error={errors.mapsUrl?.message}>
        <IconInput icon={Navigation} id="mapsUrl" type="url" dir="ltr" placeholder="https://maps.google.com/…" {...register("mapsUrl")} />
      </FormField>
    </div>
  );
}
