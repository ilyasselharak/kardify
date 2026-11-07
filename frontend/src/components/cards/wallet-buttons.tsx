"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useFeatures } from "@/lib/hooks/use-account";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { appleWalletUrl, googleWalletSaveUrl } from "@/lib/public-card";
import { cn } from "@/lib/utils";

function AppleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M16.37 12.6c-.03-2.6 2.13-3.86 2.22-3.92-1.21-1.77-3.1-2.01-3.77-2.04-1.6-.16-3.13.94-3.94.94-.82 0-2.07-.92-3.4-.9-1.75.03-3.36 1.02-4.26 2.58-1.82 3.15-.47 7.81 1.3 10.37.87 1.25 1.9 2.65 3.25 2.6 1.31-.05 1.8-.84 3.38-.84 1.57 0 2.02.84 3.4.81 1.4-.02 2.29-1.27 3.15-2.53.99-1.45 1.4-2.86 1.42-2.93-.03-.01-2.72-1.04-2.75-4.14zM13.77 4.97c.72-.87 1.2-2.08 1.07-3.29-1.03.04-2.29.69-3.03 1.56-.66.77-1.25 2-1.09 3.18 1.15.09 2.32-.58 3.05-1.45z" />
    </svg>
  );
}

function GoogleWalletGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <rect x="2" y="5" width="20" height="14" rx="3" fill="#fff" />
      <path d="M2 9.5h20" stroke="#4285F4" strokeWidth="2.2" />
      <path d="M2 12.5h20" stroke="#EA4335" strokeWidth="2.2" />
      <path d="M2 15.5h20" stroke="#FBBC04" strokeWidth="2.2" />
      <path d="M13 13.5a3 3 0 0 0 6 0" stroke="#34A853" strokeWidth="2" fill="none" />
    </svg>
  );
}

/** Official-style "Add to Apple Wallet" / "Add to Google Wallet" buttons backed by real pass endpoints. */
export function WalletButtons({ publicId, className, disabled, compact }: { publicId: string; className?: string; disabled?: boolean; compact?: boolean }) {
  const t = useTranslations("wallet");
  const errorMessage = useErrorMessage();
  const [googleLoading, setGoogleLoading] = useState(false);
  const { data: features } = useFeatures();

  const addGoogle = async () => {
    if (features && !features.googleWallet) {
      toast.error(t("notConfigured"));
      return;
    }
    setGoogleLoading(true);
    try {
      window.location.href = await googleWalletSaveUrl(publicId);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  const base = cn(
    "inline-flex items-center justify-center gap-2.5 rounded-xl bg-black px-4 font-medium text-white transition hover:bg-black/85 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    compact ? "h-10 text-[13px]" : "h-12 text-sm",
  );

  return (
    <div className={cn("@container", className)}>
    <div className="grid gap-2.5 @sm:grid-cols-2">
      <a
        href={disabled ? undefined : appleWalletUrl(publicId)}
        aria-disabled={disabled}
        className={cn(base, disabled && "pointer-events-none opacity-50")}
        onClick={(e) => {
          // Direct navigation to the .pkpass is what iOS Safari needs to show "Add to Apple Wallet".
          if (features && !features.appleWallet) {
            e.preventDefault();
            toast.error(t("notConfigured"));
          }
        }}
      >
        <AppleGlyph />
        {t("apple")}
      </a>
      <button type="button" className={base} onClick={addGoogle} disabled={disabled || googleLoading}>
        <GoogleWalletGlyph />
        {googleLoading ? t("opening") : t("google")}
      </button>
    </div>
    </div>
  );
}
