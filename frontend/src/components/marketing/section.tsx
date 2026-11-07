import { cn } from "@/lib/utils";

export function Section({ id, className, children }: { id?: string; className?: string; children: React.ReactNode }) {
  return (
    <section id={id} className={cn("scroll-mt-20 py-20 sm:py-28", className)}>
      <div className="container-page">{children}</div>
    </section>
  );
}

export function SectionHeading({ eyebrow, title, subtitle, center = true, light }: { eyebrow?: string; title: string; subtitle?: string; center?: boolean; light?: boolean }) {
  return (
    <div className={cn("max-w-2xl", center && "mx-auto text-center")}>
      {eyebrow && <p className={cn("text-sm font-semibold", light ? "text-primary" : "text-primary")}>{eyebrow}</p>}
      <h2 className={cn("mt-3 text-3xl font-bold tracking-tight text-balance sm:text-4xl", light ? "text-white" : "text-navy")}>{title}</h2>
      {subtitle && <p className={cn("mt-4 text-lg text-pretty", light ? "text-white/70" : "text-muted-foreground")}>{subtitle}</p>}
    </div>
  );
}
