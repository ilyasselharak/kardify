"use client";

import { ExternalLink, MoreHorizontal, Power, PowerOff, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { CardStatus } from "@/lib/api/types";
import { useAdminDeleteCard, useAdminSetCardStatus } from "@/lib/hooks/use-admin";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { ConfirmDialog } from "./admin-ui";

export function CardAdminActions({ card }: { card: { id: string; name: string; status: CardStatus; publicUrl?: string } }) {
  const t = useTranslations("admin");
  const errorMessage = useErrorMessage();
  const setStatus = useAdminSetCardStatus();
  const remove = useAdminDeleteCard();
  const [confirm, setConfirm] = useState(false);
  const active = card.status === "ACTIVE";
  const onError = (e: unknown) => toast.error(errorMessage(e));

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t("actions.menu")} disabled={setStatus.isPending || remove.isPending}><MoreHorizontal /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-52">
          {active && card.publicUrl && (
            <DropdownMenuItem asChild>
              <a href={card.publicUrl} target="_blank" rel="noopener noreferrer"><ExternalLink /> {t("actions.openPublic")}</a>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            onSelect={() =>
              setStatus.mutate({ id: card.id, active: !active }, { onSuccess: () => toast.success(t(active ? "toasts.cardDeactivated" : "toasts.cardActivated")), onError })
            }
          >
            {active ? <><PowerOff /> {t("actions.deactivate")}</> : <><Power /> {t("actions.activate")}</>}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive" onSelect={() => setConfirm(true)}><Trash2 /> {t("actions.delete")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <ConfirmDialog
        open={confirm}
        onOpenChange={setConfirm}
        title={t("confirm.deleteCardTitle")}
        description={t("confirm.deleteCardBody", { name: card.name })}
        confirmLabel={t("actions.delete")}
        onConfirm={() => remove.mutate(card.id, { onSuccess: () => toast.success(t("toasts.cardDeleted")), onError })}
      />
    </>
  );
}
