"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, ExternalLink, Eye, Globe, Palette, Power, PowerOff, RotateCcw, SlidersHorizontal } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { CardActionsMenu } from "@/components/cards/card-actions";
import { StatusBadge } from "@/components/cards/status-badge";
import { PublicCardView } from "@/components/public-card/public-card-view";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LivePreview } from "@/components/wizard/live-preview";
import { StepContact } from "@/components/wizard/step-contact";
import { StepPersonal } from "@/components/wizard/step-personal";
import { StepPublish } from "@/components/wizard/step-publish";
import { StepSocial } from "@/components/wizard/step-social";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import type { BusinessCard } from "@/lib/api/types";
import { cardToFormValues, formValuesToPayload, formValuesToPreview } from "@/lib/card-form";
import { templateDesign } from "@/lib/design/templates";
import { useAutosave } from "@/lib/hooks/use-autosave";
import { useDuplicateCard, usePublishCard, useUnpublishCard } from "@/lib/hooks/use-cards";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { queryKeys } from "@/lib/hooks/query-keys";
import { cardFormSchema, type CardFormValues } from "@/lib/validation/card";
import { cn } from "@/lib/utils";
import { CardDesignPanel } from "./card-design-panel";
import { SaveIndicator } from "./save-indicator";

/**
 * Three-panel visual editor: design (left), live preview (centre), details (right).
 * Every valid change is saved automatically.
 */
export function CardEditor({ card }: { card: BusinessCard }) {
  const t = useTranslations("editor");
  const tc = useTranslations("cards");
  const errorMessage = useErrorMessage();
  const router = useRouter();
  const qc = useQueryClient();
  const [current, setCurrent] = useState(card);
  const [mobilePanel, setMobilePanel] = useState<"design" | "details">("design");
  const [previewOpen, setPreviewOpen] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: cardToFormValues(card),
    mode: "onChange",
  });
  const values = useWatch({ control: form.control }) as CardFormValues;
  const publish = usePublishCard();
  const unpublish = useUnpublishCard();
  const duplicate = useDuplicateCard();

  const autosave = useAutosave({
    value: values,
    isValid: (v) => cardFormSchema.safeParse(v).success,
    save: async (v) => {
      try {
        const saved = await api.patch<BusinessCard>(`/cards/${card.id}`, formValuesToPayload(v));
        setCurrent(saved);
        qc.setQueryData(queryKeys.card(saved.id), saved);
        void qc.invalidateQueries({ queryKey: queryKeys.cardsAll, refetchType: "none" });
      } catch (e) {
        toast.error(errorMessage(e));
        throw e;
      }
    },
  });

  const isActive = current.status === "ACTIVE";
  const busy = publish.isPending || unpublish.isPending || duplicate.isPending;

  const togglePublish = async () => {
    if (!(await autosave.flush())) {
      void form.trigger();
      return toast.error(t("fixErrors"));
    }
    const m = isActive ? unpublish : publish;
    m.mutate(current.id, {
      onSuccess: (c) => {
        if (c) setCurrent(c);
        toast.success(isActive ? tc("toasts.deactivated") : tc("toasts.published"));
      },
      onError: (e) => toast.error(errorMessage(e)),
    });
  };

  const onDuplicate = async () => {
    await autosave.flush();
    duplicate.mutate(current.id, {
      onSuccess: (copy) => {
        toast.success(tc("toasts.duplicated"), {
          action: copy ? { label: t("openCopy"), onClick: () => router.push(`/dashboard/cards/${copy.id}/edit`) } : undefined,
        });
      },
      onError: (e) => toast.error(errorMessage(e)),
    });
  };

  const resetDesign = () => {
    const d = values.designSettings;
    const fresh = templateDesign(d.template);
    form.setValue("designSettings", { ...fresh, back: { ...fresh.back, tagline: d.back.tagline } }, { shouldDirty: true, shouldValidate: true });
    setResetOpen(false);
    toast.success(t("resetDone"));
  };

  const preview = formValuesToPreview(values);

  return (
    <FormProvider {...form}>
      {/* Toolbar */}
      <div className="sticky top-16 z-20 -mx-4 mb-5 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-lg sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Button asChild variant="ghost" size="icon-sm" aria-label={t("back")}>
            <Link href={`/dashboard/cards/${card.id}`}><ArrowLeft className="rtl-flip" /></Link>
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <h1 className="truncate text-base font-semibold text-navy sm:text-lg" dir="auto">{values.name || current.name}</h1>
            <StatusBadge status={current.status} />
            <SaveIndicator state={autosave.state} onRetry={() => void autosave.flush()} className="hidden sm:inline-flex" />
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button type="button" variant="ghost" size="sm" onClick={() => setResetOpen(true)}><RotateCcw /> <span className="hidden md:inline">{t("reset")}</span></Button>
            <Button type="button" variant="ghost" size="sm" onClick={onDuplicate} loading={duplicate.isPending} disabled={busy}><Copy /> <span className="hidden md:inline">{t("duplicate")}</span></Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setPreviewOpen(true)}><Eye /> {t("preview")}</Button>
            {isActive && (
              <Button asChild variant="outline" size="sm" className="hidden lg:inline-flex">
                <a href={current.publicUrl} target="_blank" rel="noopener noreferrer"><ExternalLink /> {t("viewLive")}</a>
              </Button>
            )}
            <Button type="button" size="sm" variant={isActive ? "outline" : "default"} onClick={togglePublish} loading={publish.isPending || unpublish.isPending} disabled={busy}>
              {isActive ? <><PowerOff /> {t("unpublish")}</> : <><Power /> {t("publish")}</>}
            </Button>
            <CardActionsMenu card={current} hideEdit onDeleted={() => router.replace("/dashboard/cards")} />
          </div>
        </div>
        <SaveIndicator state={autosave.state} onRetry={() => void autosave.flush()} className="mt-1 sm:hidden" />
      </div>

      {/* Mobile / tablet panel switcher */}
      <div className="mb-4 xl:hidden">
        <Tabs value={mobilePanel} onValueChange={(v) => setMobilePanel(v as typeof mobilePanel)}>
          <TabsList className="w-full">
            <TabsTrigger value="design" className="flex-1"><Palette /> {t("designPanel")}</TabsTrigger>
            <TabsTrigger value="details" className="flex-1"><SlidersHorizontal /> {t("detailsPanel")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_360px] xl:items-start">
        <aside className={cn("rounded-2xl border border-border bg-card px-4 shadow-soft xl:block", mobilePanel !== "design" && "hidden")} aria-label={t("designPanel")}>
          <CardDesignPanel />
        </aside>

        <section className="order-first min-w-0 xl:sticky xl:top-36 xl:order-none" aria-label={t("previewPanel")}>
          <LivePreview values={values} url={current.status === "ACTIVE" ? current.publicUrl : undefined} publicId={current.publicId} slug={current.slug} />
        </section>

        <aside className={cn("rounded-2xl border border-border bg-card p-4 shadow-soft xl:block", mobilePanel !== "details" && "hidden")} aria-label={t("detailsPanel")}>
          <Tabs defaultValue="info">
            <TabsList className="mb-5 grid w-full grid-cols-4">
              <TabsTrigger value="info" className="px-1 text-xs">{t("tabs.info")}</TabsTrigger>
              <TabsTrigger value="contact" className="px-1 text-xs">{t("tabs.contact")}</TabsTrigger>
              <TabsTrigger value="social" className="px-1 text-xs">{t("tabs.social")}</TabsTrigger>
              <TabsTrigger value="publish" className="px-1 text-xs">{t("tabs.publish")}</TabsTrigger>
            </TabsList>
            <TabsContent value="info"><StepPersonal /></TabsContent>
            <TabsContent value="contact"><StepContact /></TabsContent>
            <TabsContent value="social"><StepSocial /></TabsContent>
            <TabsContent value="publish" className="grid gap-5">
              <StepPublish publicUrl={isActive ? current.publicUrl : undefined} />
              <Button type="button" variant={isActive ? "outline" : "default"} onClick={togglePublish} loading={publish.isPending || unpublish.isPending} disabled={busy}>
                {isActive ? <><PowerOff /> {t("unpublish")}</> : <><Globe /> {t("publish")}</>}
              </Button>
            </TabsContent>
          </Tabs>
        </aside>
      </div>

      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-h-[92dvh] max-w-[460px] overflow-hidden p-0">
          <DialogHeader className="border-b border-border px-5 py-4">
            <DialogTitle>{t("previewTitle")}</DialogTitle>
            <DialogDescription>{isActive ? t("previewLive") : t("previewDraft")}</DialogDescription>
          </DialogHeader>
          <div className="max-h-[calc(92dvh-88px)] overflow-y-auto">
            <PublicCardView
              mode="preview"
              card={{ ...preview, slug: current.slug, publicId: current.publicId, url: current.publicUrl, language: values.language } as never}
            />
          </div>
        </DialogContent>
      </Dialog>

      <AlertDialog open={resetOpen} onOpenChange={setResetOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("resetTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("resetBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={resetDesign}>{t("reset")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </FormProvider>
  );
}
