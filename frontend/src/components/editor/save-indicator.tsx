"use client";

import { AlertCircle, Check, CloudUpload, Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import type { SaveState } from "@/lib/hooks/use-autosave";
import { cn } from "@/lib/utils";

export function SaveIndicator({ state, onRetry, className }: { state: SaveState; onRetry?: () => void; className?: string }) {
  const t = useTranslations("editor.save");
  const map = {
    saved: { icon: Check, cls: "text-success" },
    dirty: { icon: CloudUpload, cls: "text-muted-foreground" },
    saving: { icon: Loader2, cls: "text-primary" },
    invalid: { icon: AlertCircle, cls: "text-warning" },
    error: { icon: AlertCircle, cls: "text-destructive" },
  } as const;
  const { icon: Icon, cls } = map[state];
  return (
    <span role="status" aria-live="polite" className={cn("inline-flex items-center gap-1.5 text-xs font-medium", cls, className)}>
      <Icon className={cn("size-3.5", state === "saving" && "animate-spin")} />
      {t(state)}
      {state === "error" && onRetry && (
        <button type="button" onClick={onRetry} className="underline underline-offset-2">{t("retry")}</button>
      )}
    </span>
  );
}
