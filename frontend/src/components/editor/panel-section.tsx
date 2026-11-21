"use client";

import { ChevronDown, type LucideIcon } from "lucide-react";
import { useId, useState } from "react";
import { cn } from "@/lib/utils";

/** Collapsible group used in editor side panels. */
export function PanelSection({ title, icon: Icon, defaultOpen = false, children, className, actions }: {
  title: string;
  icon?: LucideIcon;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();
  return (
    <section className={cn("border-b border-border last:border-b-0", className)}>
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="flex flex-1 items-center gap-2.5 py-3.5 text-start text-sm font-semibold transition hover:text-primary"
        >
          {Icon && <Icon className="size-4 text-muted-foreground" />}
          <span className="flex-1">{title}</span>
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
        {actions}
      </div>
      <div id={id} hidden={!open} className="pb-5">
        {open && children}
      </div>
    </section>
  );
}
