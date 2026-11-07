import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden className={cn("size-8 shrink-0", className)}>
      <rect width="64" height="64" rx="14" fill="#006afe" />
      <rect x="14" y="18" width="36" height="28" rx="5" fill="none" stroke="#fff" strokeWidth="4" />
      <path d="M22 27v10M22 32l7-5M22 32l7 5" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      <path d="M34 28h9M34 34h7" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark />
      <span dir="ltr" className={cn("text-lg font-bold tracking-tight", light ? "text-white" : "text-navy")}>
        Kardify
      </span>
    </span>
  );
}
