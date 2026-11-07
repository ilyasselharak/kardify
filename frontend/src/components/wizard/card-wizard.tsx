"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeft, ArrowRight, Check, ExternalLink, PartyPopper } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link, useRouter } from "@/i18n/navigation";
import type { BusinessCard, Locale } from "@/lib/api/types";
import { cardToFormValues, formValuesToPayload } from "@/lib/card-form";
import { useMe } from "@/lib/hooks/use-auth";
import { useCreateCard, usePublishCard, useUpdateCard } from "@/lib/hooks/use-cards";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { cardFormSchema, STEP_FIELDS, type CardFormValues } from "@/lib/validation/card";
import { cn } from "@/lib/utils";
import { LivePreview } from "./live-preview";
import { StepContact } from "./step-contact";
import { StepDesign } from "./step-design";
import { StepPersonal } from "./step-personal";
import { StepPublish } from "./step-publish";
import { StepSocial } from "./step-social";

const STEPS = ["personal", "contact", "social", "design", "publish"] as const;

/** Five-step create/edit wizard with live preview. Saving logic lives in the card hooks. */
export function CardWizard({ card }: { card?: BusinessCard }) {
  const t = useTranslations("wizard");
  const tc = useTranslations("common");
  const tcards = useTranslations("cards.toasts");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const errorMessage = useErrorMessage();
  const { data: user } = useMe();
  const [step, setStep] = useState(0);
  const [saved, setSaved] = useState<BusinessCard | undefined>(card);
  const [published, setPublished] = useState<BusinessCard>();

  const form = useForm<CardFormValues>({
    resolver: zodResolver(cardFormSchema),
    defaultValues: cardToFormValues(card, user?.preferences, locale),
    mode: "onTouched",
  });
  const values = useWatch({ control: form.control }) as CardFormValues;
  const create = useCreateCard();
  const update = useUpdateCard();
  const publish = usePublishCard();
  const busy = create.isPending || update.isPending || publish.isPending;

  // Warn before leaving with unsaved changes.
  const dirty = form.formState.isDirty;
  useEffect(() => {
    if (!dirty) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [dirty]);

  const goTo = async (target: number) => {
    if (target > step) {
      for (let i = step; i < target; i++) {
        const ok = await form.trigger(STEP_FIELDS[i] as (keyof CardFormValues)[], { shouldFocus: true });
        if (!ok) return setStep(i);
      }
    }
    setStep(target);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const persist = async (): Promise<BusinessCard | undefined> => {
    const ok = await form.trigger();
    if (!ok) {
      const firstBad = STEP_FIELDS.findIndex((fields) => fields.some((f) => form.getFieldState(f).invalid));
      if (firstBad >= 0) setStep(firstBad);
      return undefined;
    }
    const payload = formValuesToPayload(form.getValues());
    try {
      const result = saved ? await update.mutateAsync({ id: saved.id, data: payload }) : await create.mutateAsync(payload);
      if (!result) return undefined;
      setSaved(result);
      form.reset(form.getValues());
      return result;
    } catch (e) {
      toast.error(errorMessage(e));
      return undefined;
    }
  };

  const saveDraft = async () => {
    const result = await persist();
    if (!result) return;
    toast.success(card ? tcards("saved") : tcards("draftSaved"));
    if (!card) router.replace(`/dashboard/cards/${result.id}/edit`);
  };

  const saveAndPublish = async () => {
    const result = await persist();
    if (!result) return;
    if (result.status === "ACTIVE") {
      toast.success(tcards("saved"));
      return setPublished(result);
    }
    try {
      const live = await publish.mutateAsync(result.id);
      if (live) {
        setSaved(live);
        setPublished(live);
        toast.success(tcards("published"));
      }
    } catch (e) {
      toast.error(errorMessage(e));
    }
  };

  const isLast = step === STEPS.length - 1;

  return (
    <FormProvider {...form}>
      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_480px]">
        <div className="min-w-0">
          {/* Stepper */}
          <ol className="mb-6 flex items-center gap-1 overflow-x-auto pb-1">
            {STEPS.map((s, i) => (
              <li key={s} className="flex flex-1 items-center gap-1">
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  className={cn(
                    "flex w-full min-w-fit items-center gap-2 rounded-lg px-2 py-1.5 text-sm font-medium transition",
                    i === step ? "text-primary" : i < step ? "text-foreground hover:bg-muted" : "text-muted-foreground hover:bg-muted",
                  )}
                  aria-current={i === step ? "step" : undefined}
                >
                  <span className={cn(
                    "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition",
                    i === step ? "bg-primary text-white ring-4 ring-primary/15" : i < step ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}>
                    {i < step ? <Check className="size-3.5" /> : i + 1}
                  </span>
                  <span className="hidden sm:inline">{t(`steps.${s}`)}</span>
                </button>
                {i < STEPS.length - 1 && <span className={cn("h-px min-w-3 flex-1", i < step ? "bg-primary/40" : "bg-border")} />}
              </li>
            ))}
          </ol>
          <p className="mb-4 text-xs font-medium text-muted-foreground sm:hidden">{t("stepOf", { current: step + 1, total: STEPS.length })} · {t(`steps.${STEPS[step]}`)}</p>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (isLast) void saveAndPublish();
              else void goTo(step + 1);
            }}
            noValidate
            className="rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-7"
          >
            <div key={step} className="animate-in fade-in-0 slide-in-from-bottom-2 duration-300">
              {step === 0 && <StepPersonal />}
              {step === 1 && <StepContact />}
              {step === 2 && <StepSocial />}
              {step === 3 && <StepDesign />}
              {step === 4 && <StepPublish publicUrl={saved?.publicUrl} />}
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
              <Button type="button" variant="ghost" onClick={() => goTo(step - 1)} disabled={step === 0 || busy}>
                <ArrowLeft className="rtl-flip" /> {isLast ? t("publish.goBack") : tc("back")}
              </Button>
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={saveDraft} loading={busy && !publish.isPending} disabled={busy}>
                  {card ? t("publish.update") : t("publish.saveDraft")}
                </Button>
                {isLast ? (
                  <Button type="submit" loading={busy} disabled={busy}>
                    {saved?.status === "ACTIVE" ? t("publish.update") : t("publish.publish")}
                  </Button>
                ) : (
                  <Button type="submit" disabled={busy}>
                    {tc("next")} <ArrowRight className="rtl-flip" />
                  </Button>
                )}
              </div>
            </div>
          </form>
        </div>

        <aside className="xl:sticky xl:top-24 xl:self-start">
          <LivePreview values={values} url={saved?.publicUrl} publicId={saved?.publicId} slug={saved?.slug} />
        </aside>
      </div>

      <Dialog open={!!published} onOpenChange={(o) => !o && setPublished(undefined)}>
        <DialogContent className="max-w-md text-center">
          <DialogHeader className="items-center text-center">
            <span className="mb-2 flex size-14 items-center justify-center rounded-2xl bg-success/10 text-success"><PartyPopper className="size-7" /></span>
            <DialogTitle>{t("publish.publishedTitle")}</DialogTitle>
            <DialogDescription>{t("publish.publishedBody")}</DialogDescription>
          </DialogHeader>
          {published && <p dir="ltr" className="truncate rounded-lg bg-muted px-3 py-2 font-mono text-sm text-primary">{published.publicUrl}</p>}
          <div className="grid gap-2 sm:grid-cols-2">
            <Button asChild variant="outline">
              <a href={published?.publicUrl} target="_blank" rel="noopener noreferrer"><ExternalLink /> {t("publish.viewCard")}</a>
            </Button>
            <Button asChild><Link href={published ? `/dashboard/cards/${published.id}` : "/dashboard/cards"}>{t("publish.manageCards")}</Link></Button>
          </div>
        </DialogContent>
      </Dialog>
    </FormProvider>
  );
}
