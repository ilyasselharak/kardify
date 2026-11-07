"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Label } from "./label";
import { cn } from "@/lib/utils";

/**
 * Label + control + translated error. Validation messages are translation keys
 * (e.g. "required") resolved from the `validation` namespace.
 */
export function FormField({
  id,
  label,
  error,
  hint,
  optional,
  className,
  children,
}: {
  id: string;
  label?: React.ReactNode;
  error?: string;
  hint?: React.ReactNode;
  optional?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const t = useTranslations("validation");
  const tc = useTranslations("common");
  return (
    <div className={cn("grid gap-2", className)}>
      {label && (
        <Label htmlFor={id} className="justify-between">
          <span>{label}</span>
          {optional && <span className="text-xs font-normal text-muted-foreground">{tc("optional")}</span>}
        </Label>
      )}
      {children}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-[13px] text-destructive">
          {t.has(error) ? t(error) : error}
        </p>
      ) : hint ? (
        <p className="text-[13px] text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}
