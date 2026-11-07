"use client";

import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import * as React from "react";
import { Input } from "@/components/ui/input";
import { passwordStrength } from "@/lib/validation/auth";
import { cn } from "@/lib/utils";

export function PasswordInput({ className, ...props }: React.ComponentProps<typeof Input>) {
  const [visible, setVisible] = React.useState(false);
  const t = useTranslations("auth.login");
  return (
    <div className="relative">
      <Input type={visible ? "text" : "password"} dir="ltr" className={cn("pe-10", className)} {...props} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className="absolute inset-y-0 end-0 flex w-10 items-center justify-center text-muted-foreground transition hover:text-foreground"
        aria-label={visible ? t("hidePassword") : t("showPassword")}
        aria-pressed={visible}
      >
        {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
      </button>
    </div>
  );
}

const COLORS = ["bg-destructive", "bg-destructive", "bg-warning", "bg-primary", "bg-success"];

export function PasswordStrength({ value }: { value: string }) {
  const t = useTranslations("auth.register.strength");
  if (!value) return null;
  const score = passwordStrength(value);
  return (
    <div className="grid gap-1.5" aria-live="polite">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <span key={i} className={cn("h-1 flex-1 rounded-full bg-muted transition-colors", i <= score && COLORS[score])} />
        ))}
      </div>
      <span className="text-xs text-muted-foreground">{t(String(score) as "0")}</span>
    </div>
  );
}
