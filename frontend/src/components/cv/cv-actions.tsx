"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "@/i18n/navigation";
import { downloadPdf, ownerCvPdfUrl } from "@/lib/cv/pdf";
import { useFeatures } from "@/lib/hooks/use-account";
import { useDeleteCv, useDuplicateCv } from "@/lib/hooks/use-cv";
import { useErrorMessage } from "@/lib/hooks/use-error-message";

/** PDF download with a browser-print fallback when server rendering is unavailable. */
export function useCvPdf() {
  const t = useTranslations("cv");
  const errorMessage = useErrorMessage();
  const router = useRouter();
  const { data: features } = useFeatures();
  const [pending, setPending] = useState(false);
  const download = async (id: string, name: string) => {
    if (features && features.cvPdf === false) {
      router.push(`/dashboard/cv/${id}/preview?print=1`);
      return;
    }
    setPending(true);
    const toastId = toast.loading(t("pdfGenerating"));
    try {
      await downloadPdf(ownerCvPdfUrl(id), name);
      toast.success(t("pdfReady"), { id: toastId });
    } catch (e) {
      toast.error(errorMessage(e), {
        id: toastId,
        action: { label: t("printInstead"), onClick: () => router.push(`/dashboard/cv/${id}/preview?print=1`) },
      });
    } finally {
      setPending(false);
    }
  };
  return { download, pending };
}

export function useCvActions() {
  const t = useTranslations("cv");
  const errorMessage = useErrorMessage();
  const router = useRouter();
  const duplicate = useDuplicateCv();
  const remove = useDeleteCv();
  return {
    pending: duplicate.isPending || remove.isPending,
    duplicate: (id: string, open = false) =>
      duplicate.mutate(id, {
        onSuccess: (copy) => {
          toast.success(t("toasts.duplicated"));
          if (copy && open) router.push(`/dashboard/cv/${copy.id}/edit`);
        },
        onError: (e) => toast.error(errorMessage(e)),
      }),
    remove: (id: string, after?: () => void) =>
      remove.mutate(id, {
        onSuccess: () => {
          toast.success(t("toasts.deleted"));
          after?.();
        },
        onError: (e) => toast.error(errorMessage(e)),
      }),
  };
}

export function DeleteCvDialog({ title, open, onOpenChange, onConfirm }: { title: string; open: boolean; onOpenChange: (o: boolean) => void; onConfirm: () => void }) {
  const t = useTranslations("cv");
  const tc = useTranslations("common");
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{t("deleteTitle")}</AlertDialogTitle>
          <AlertDialogDescription>{t("deleteBody", { title })}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
          <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={onConfirm}>{tc("delete")}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
