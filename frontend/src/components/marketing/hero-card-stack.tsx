"use client";

import { useTranslations } from "next-intl";
import { BusinessCardBack, BusinessCardFront, type CardPreviewData } from "@/components/cards/business-card";
import { templateDesign } from "@/lib/design/templates";
import { cn } from "@/lib/utils";

/** Decorative stack of sample cards for the landing & auth pages. */
export function HeroCardStack({ compact }: { compact?: boolean }) {
  const t = useTranslations("landing.previewCard");
  const base: Omit<CardPreviewData, "designSettings"> = {
    name: t("name"),
    jobTitle: t("title"),
    companyName: t("company"),
    email: "sara@atlas.vc",
    phone: "+212 600 123 456",
    website: "https://atlas.vc",
    socialLinks: [
      { platform: "linkedin", url: "https://linkedin.com", visible: true },
      { platform: "x", url: "https://x.com", visible: true },
      { platform: "instagram", url: "https://instagram.com", visible: true },
    ],
  };
  return (
    <div className={cn("relative", compact ? "h-56" : "h-[340px] sm:h-[420px]")} aria-hidden>
      <div className={cn("absolute w-[78%] rotate-[-8deg] opacity-90", compact ? "start-0 top-6" : "start-0 top-12")}>
        <BusinessCardBack card={{ ...base, designSettings: templateDesign("gradient") }} url="https://kardify.com/card/sara" />
      </div>
      <div className={cn("absolute w-[78%] rotate-[4deg]", compact ? "end-0 top-0" : "end-0 top-0")}>
        <BusinessCardFront card={{ ...base, designSettings: templateDesign("corporate") }} />
      </div>
      {!compact && (
        <div className="absolute start-[12%] bottom-0 w-[70%] rotate-[-2deg]">
          <BusinessCardFront card={{ ...base, designSettings: templateDesign("classic") }} />
        </div>
      )}
    </div>
  );
}
