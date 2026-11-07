import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { CardStatus } from "@/lib/api/types";

export function StatusBadge({ status }: { status: CardStatus }) {
  const t = useTranslations("cards.status");
  const variant = status === "ACTIVE" ? "success" : status === "DRAFT" ? "warning" : "muted";
  return (
    <Badge variant={variant}>
      <span className="size-1.5 rounded-full bg-current" />
      {t(status)}
    </Badge>
  );
}
