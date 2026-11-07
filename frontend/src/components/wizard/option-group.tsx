"use client";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

/** Segmented control used throughout the design editor. */
export function OptionGroup<T extends string>({ label, value, options, onChange, columns }: {
  label: string;
  value: T;
  options: { value: T; label: string; preview?: React.ReactNode }[];
  onChange: (v: T) => void;
  columns?: number;
}) {
  return (
    <div className="grid gap-2">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div role="radiogroup" aria-label={label} className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns ?? options.length}, minmax(0, 1fr))` }}>
        {options.map((o) => {
          const active = o.value === value;
          return (
            <button
              key={o.value}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onChange(o.value)}
              className={cn(
                "flex min-h-10 flex-col items-center justify-center gap-1.5 rounded-lg border px-2 py-2 text-xs font-medium transition",
                active ? "border-primary bg-primary/5 text-primary ring-2 ring-primary/15" : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
              )}
            >
              {o.preview}
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
