"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { CardWizard } from "@/components/wizard/card-wizard";
import { Skeleton } from "@/components/ui/skeleton";
import { useCard } from "@/lib/hooks/use-cards";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { ErrorState } from "../empty-state";
import { PageHeader } from "../page-header";

export function EditCardView() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations("wizard");
  const tc = useTranslations("common");
  const errorMessage = useErrorMessage();
  const query = useCard(id);
  return (
    <>
      <title>{`${t("editTitle")} · Kardify`}</title>
      <PageHeader title={t("editTitle")} description={query.data?.name} />
      {query.isLoading ? (
        <Skeleton className="h-[600px] rounded-2xl" />
      ) : query.isError || !query.data ? (
        <ErrorState message={errorMessage(query.error)} onRetry={() => query.refetch()} retryLabel={tc("retry")} />
      ) : (
        // Keyed by id so the form re-initialises when navigating between cards.
        <CardWizard key={query.data.id} card={query.data} />
      )}
    </>
  );
}

export function NewCardView() {
  const t = useTranslations("wizard");
  return (
    <>
      <PageHeader title={t("createTitle")} />
      <CardWizard />
    </>
  );
}
