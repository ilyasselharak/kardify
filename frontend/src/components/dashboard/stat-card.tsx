import type { LucideIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function StatCard({ label, value, icon: Icon, hint, loading, className }: { label: string; value: string; icon: LucideIcon; hint?: string; loading?: boolean; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-border bg-card p-5 shadow-soft transition hover:shadow-lifted", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{label}</span>
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="size-[18px]" />
        </span>
      </div>
      {loading ? <Skeleton className="mt-3 h-8 w-20" /> : <p className="mt-2 text-[28px] font-bold tracking-tight text-navy tabular-nums">{value}</p>}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
