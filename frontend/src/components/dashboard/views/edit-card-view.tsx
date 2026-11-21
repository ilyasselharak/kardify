"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { CardEditor } from "@/components/editor/card-editor";
import { Skeleton } from "@/components/ui/skeleton";
import { useCard } from "@/lib/hooks/use-cards";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { ErrorState } from "../empty-state";

export { NewCardView } from "@/components/editor/new-card-view";

export function EditCardView() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations("wizard");
  const tc = useTranslations("common");
  const errorMessage = useErrorMessage();
  const query = useCard(id);
  return (
    <>
      <title>{`${t("editTitle")} · Kardify`}</title>
      {query.isLoading ? (
        <div className="grid gap-5 xl:grid-cols-[320px_1fr_360px]">
          <Skeleton className="h-[640px] rounded-2xl" />
          <Skeleton className="h-[420px] rounded-2xl" />
          <Skeleton className="h-[640px] rounded-2xl" />
        </div>
      ) : query.isError || !query.data ? (
        <ErrorState message={errorMessage(query.error)} onRetry={() => query.refetch()} retryLabel={tc("retry")} />
      ) : (
        // Keyed by id so the form re-initialises when navigating between cards.
        <CardEditor key={query.data.id} card={query.data} />
      )}
    </>
  );
}
