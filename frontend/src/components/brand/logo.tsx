import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * Brand assets generated from `public/logo.webp` (trimmed, transparent background):
 * - /brand/logo.webp        full logo, dark wordmark (light backgrounds)
 * - /brand/logo-light.webp  full logo, white wordmark (dark backgrounds)
 * - /brand/logo-mark.webp   the "K" mark alone (square)
 */
const FULL = { width: 478, height: 160 };

export function LogoMark({ className }: { className?: string }) {
  return <Image src="/brand/logo-mark.webp" alt="" aria-hidden width={256} height={256} className={cn("size-8 shrink-0", className)} />;
}

function FullLogo({ light, className, priority }: { light?: boolean; className?: string; priority?: boolean }) {
  return (
    <Image
      src={light ? "/brand/logo-light.webp" : "/brand/logo.webp"}
      alt="Kardify"
      width={FULL.width}
      height={FULL.height}
      priority={priority}
      className={cn("h-9 w-auto shrink-0", className)}
    />
  );
}

/**
 * The Kardify logo.
 * - `compact`: the "K" mark only.
 * - `responsive`: the mark on phones, the full logo from the `sm` breakpoint up.
 */
export function Logo({ className, light, compact, responsive, priority }: {
  className?: string;
  light?: boolean;
  compact?: boolean;
  responsive?: boolean;
  priority?: boolean;
}) {
  if (compact) {
    return (
      <span className={cn("inline-flex items-center", className)}>
        <LogoMark className="size-9" />
        <span className="sr-only">Kardify</span>
      </span>
    );
  }
  if (responsive) {
    return (
      <span className={cn("inline-flex items-center", className)}>
        <LogoMark className="size-9 sm:hidden" />
        <span className="sr-only sm:hidden">Kardify</span>
        <FullLogo light={light} priority={priority} className="hidden sm:block" />
      </span>
    );
  }
  return (
    <span className={cn("inline-flex items-center", className)}>
      <FullLogo light={light} priority={priority} />
    </span>
  );
}
