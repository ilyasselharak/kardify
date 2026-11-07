import { AlertCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function FormAlert({ children, variant = "error", className }: { children: React.ReactNode; variant?: "error" | "success" | "info"; className?: string }) {
  if (!children) return null;
  const Icon = variant === "success" ? CheckCircle2 : AlertCircle;
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-xl border px-3.5 py-3 text-sm",
        variant === "error" && "border-destructive/20 bg-destructive/5 text-destructive",
        variant === "success" && "border-success/20 bg-success/5 text-success",
        variant === "info" && "border-primary/20 bg-primary/5 text-primary",
        className,
      )}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <div>{children}</div>
    </div>
  );
}
