import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function StatusPanel({
  icon: Icon,
  title,
  body,
  tone = "primary",
  children,
}: {
  icon: LucideIcon;
  title: string;
  body?: React.ReactNode;
  tone?: "primary" | "success" | "destructive";
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div
        className={cn(
          "flex size-16 items-center justify-center rounded-2xl",
          tone === "primary" && "bg-primary/10 text-primary",
          tone === "success" && "bg-success/10 text-success",
          tone === "destructive" && "bg-destructive/10 text-destructive",
        )}
      >
        <Icon className="size-8" />
      </div>
      <h1 className="mt-6 text-2xl font-bold tracking-tight">{title}</h1>
      {body && <p className="mt-2 text-muted-foreground">{body}</p>}
      {children && <div className="mt-8 grid w-full gap-3">{children}</div>}
    </div>
  );
}
