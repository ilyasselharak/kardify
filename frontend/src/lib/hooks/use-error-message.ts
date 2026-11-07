"use client";

import { useTranslations } from "next-intl";
import { errorKey } from "@/lib/errors";

export function useErrorMessage() {
  const t = useTranslations("errors");
  return (error: unknown) => {
    const key = errorKey(error);
    return t.has(key) ? t(key) : t("generic");
  };
}
