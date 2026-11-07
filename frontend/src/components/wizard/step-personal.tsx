"use client";

import { useTranslations } from "next-intl";
import { Controller, useFormContext } from "react-hook-form";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import type { CardFormValues } from "@/lib/validation/card";
import { ImageUpload } from "./image-upload";
import { StepHeading } from "./step-heading";

export function StepPersonal() {
  const t = useTranslations("wizard.personal");
  const tc = useTranslations("common");
  const { register, control, formState: { errors } } = useFormContext<CardFormValues>();
  return (
    <div className="grid gap-6">
      <StepHeading title={t("title")} subtitle={t("subtitle")} />
      <div className="grid gap-6 sm:grid-cols-2">
        <Controller control={control} name="profileImage" render={({ field }) => (
          <ImageUpload label={t("profilePhoto")} purpose="profile" value={field.value} onChange={field.onChange} />
        )} />
        <Controller control={control} name="companyLogo" render={({ field }) => (
          <ImageUpload label={t("companyLogo")} purpose="logo" shape="square" value={field.value} onChange={field.onChange} />
        )} />
      </div>
      <FormField id="name" label={t("name")} error={errors.name?.message}>
        <Input id="name" dir="auto" placeholder={t("namePlaceholder")} aria-invalid={!!errors.name} {...register("name")} />
      </FormField>
      <div className="grid gap-6 sm:grid-cols-2">
        <FormField id="jobTitle" label={t("jobTitle")} optional error={errors.jobTitle?.message}>
          <Input id="jobTitle" dir="auto" placeholder={t("jobTitlePlaceholder")} {...register("jobTitle")} />
        </FormField>
        <FormField id="companyName" label={t("company")} optional error={errors.companyName?.message}>
          <Input id="companyName" dir="auto" placeholder={t("companyPlaceholder")} {...register("companyName")} />
        </FormField>
      </div>
      <FormField id="description" label={t("description")} optional error={errors.description?.message}>
        <Textarea id="description" dir="auto" rows={3} maxLength={600} placeholder={t("descriptionPlaceholder")} {...register("description")} />
      </FormField>
      <FormField id="language" label={t("cardLanguage")} hint={t("cardLanguageHint")}>
        <Controller control={control} name="language" render={({ field }) => (
          <Tabs value={field.value} onValueChange={field.onChange}>
            <TabsList>
              <TabsTrigger value="en" className="px-5">{tc("english")}</TabsTrigger>
              <TabsTrigger value="ar" className="px-5">{tc("arabic")}</TabsTrigger>
            </TabsList>
          </Tabs>
        )} />
      </FormField>
    </div>
  );
}
