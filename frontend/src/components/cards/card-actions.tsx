"use client";

import {
  BarChart3, Copy, Download, ExternalLink, Eye, MoreHorizontal, Pencil, Power, PowerOff, Share2, Smartphone, Trash2, Wallet,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "@/i18n/navigation";
import type { BusinessCard } from "@/lib/api/types";
import { useFeatures } from "@/lib/hooks/use-account";
import {
  useDeleteCard, useDuplicateCard, usePublishCard, useShareLinks, useUnpublishCard,
} from "@/lib/hooks/use-cards";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { appleWalletUrl, googleWalletSaveUrl, ownerQrUrl, vcardUrl } from "@/lib/public-card";
import { QrDialog } from "./qr-dialog";
import { ShareDialog } from "./share-dialog";

/** Every action available on a card, shared by the grid and the detail page. */
export function useCardActionHandlers(card: BusinessCard) {
  const t = useTranslations("cards");
  const tw = useTranslations("wallet");
  const errorMessage = useErrorMessage();
  const router = useRouter();
  const { data: features } = useFeatures();
  const duplicate = useDuplicateCard();
  const publish = usePublishCard();
  const unpublish = useUnpublishCard();
  const remove = useDeleteCard();
  const isActive = card.status === "ACTIVE";
  const onError = (e: unknown) => toast.error(errorMessage(e));

  return {
    isActive,
    pending: duplicate.isPending || publish.isPending || unpublish.isPending || remove.isPending,
    duplicate: () => duplicate.mutate(card.id, { onSuccess: () => toast.success(t("toasts.duplicated")), onError }),
    toggle: () =>
      isActive
        ? unpublish.mutate(card.id, { onSuccess: () => toast.success(t("toasts.deactivated")), onError })
        : publish.mutate(card.id, { onSuccess: () => toast.success(t("toasts.activated")), onError }),
    remove: (after?: () => void) =>
      remove.mutate(card.id, {
        onSuccess: () => {
          toast.success(t("toasts.deleted"));
          after?.();
        },
        onError,
      }),
    requirePublished: (fn: () => void) => () => (isActive ? fn() : toast.info(t("mustPublish"))),
    apple: () => {
      if (!isActive) return toast.info(t("mustPublish"));
      if (features && !features.appleWallet) return toast.error(tw("notConfigured"));
      window.location.href = appleWalletUrl(card.publicId);
    },
    google: async () => {
      if (!isActive) return toast.info(t("mustPublish"));
      if (features && !features.googleWallet) return toast.error(tw("notConfigured"));
      try {
        window.open(await googleWalletSaveUrl(card.publicId), "_blank", "noopener");
      } catch (e) {
        onError(e);
      }
    },
    router,
  };
}

export function CardActionsMenu({ card, align = "end" }: { card: BusinessCard; align?: "start" | "end" }) {
  const t = useTranslations("cards");
  const tc = useTranslations("common");
  const a = useCardActionHandlers(card);
  const [shareOpen, setShareOpen] = useState(false);
  const [qrOpen, setQrOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const share = useShareLinks(card.id, shareOpen);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon-sm" aria-label={t("actions.menu")} disabled={a.pending}>
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="w-56">
          <DropdownMenuItem onSelect={() => a.router.push(`/dashboard/cards/${card.id}`)}><Eye /> {t("actions.view")}</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => a.router.push(`/dashboard/cards/${card.id}/edit`)}><Pencil /> {t("actions.edit")}</DropdownMenuItem>
          <DropdownMenuItem onSelect={a.duplicate}><Copy /> {t("actions.duplicate")}</DropdownMenuItem>
          <DropdownMenuItem onSelect={a.requirePublished(() => setShareOpen(true))}><Share2 /> {t("actions.share")}</DropdownMenuItem>
          <DropdownMenuItem onSelect={() => setQrOpen(true)}><Download /> {t("actions.downloadQr")}</DropdownMenuItem>
          {a.isActive && (
            <DropdownMenuItem asChild>
              <a href={card.publicUrl} target="_blank" rel="noopener noreferrer"><ExternalLink /> {t("actions.openPublic")}</a>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onSelect={() => a.router.push(`/dashboard/analytics?card=${card.id}`)}><BarChart3 /> {t("actions.analytics")}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={a.apple}><Smartphone /> {t("actions.appleWallet")}</DropdownMenuItem>
          <DropdownMenuItem onSelect={a.google}><Wallet /> {t("actions.googleWallet")}</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={a.toggle}>
            {a.isActive ? <><PowerOff /> {t("actions.deactivate")}</> : <><Power /> {t("actions.activate")}</>}
          </DropdownMenuItem>
          <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}><Trash2 /> {t("actions.delete")}</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {share.data && (
        <ShareDialog
          open={shareOpen}
          onOpenChange={setShareOpen}
          targets={{
            name: card.name,
            slug: card.slug,
            links: share.data,
            qrPngUrl: ownerQrUrl(card.id, { format: "png", size: 2048, download: 1 }),
            qrSvgUrl: ownerQrUrl(card.id, { format: "svg", download: 1 }),
            qrPreviewUrl: ownerQrUrl(card.id, { format: "svg", v: card.slug }),
            vcardUrl: vcardUrl(card.slug),
          }}
        />
      )}
      <QrDialog card={card} open={qrOpen} onOpenChange={setQrOpen} />
      <DeleteCardDialog card={card} open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={() => a.remove()} cancelLabel={tc("cancel")} />
    </>
  );
}

export function DeleteCardDialog({ card, open, onOpenChange, onConfirm, cancelLabel }: {
  card: BusinessCard; open: boolean; onOpenChange: (o: boolean) => void; onConfirm: () => void; cancelLabel: string;
}) {
  const t = useTranslations("cards");
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("deleteBody", { name: card.name })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{cancelLabel}</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>{t("actions.delete")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
