"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { ErrorState } from "@/components/dashboard/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { useCv, useCvProfile } from "@/lib/hooks/use-cv";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { CvEditor } from "./editor/cv-editor";

export function CvEditView() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations("cvEditor");
  const tc = useTranslations("common");
  const errorMessage = useErrorMessage();
  const cv = useCv(id);
  const profile = useCvProfile();
  const error = cv.error ?? profile.error;
  return (
    <>
      <title>{`${cv.data?.title ?? t("pageTitle")} · Kardify`}</title>
      {cv.isLoading || profile.isLoading ? (
        <div className="grid gap-5 xl:grid-cols-[380px_1fr_300px]">
          <Skeleton className="h-[640px] rounded-2xl" />
          <Skeleton className="h-[720px] rounded-2xl" />
          <Skeleton className="h-[640px] rounded-2xl" />
        </div>
      ) : error || !cv.data || !profile.data ? (
        <ErrorState message={errorMessage(error)} onRetry={() => { void cv.refetch(); void profile.refetch(); }} retryLabel={tc("retry")} />
      ) : (
        // Keyed by id so state resets when switching between CVs. Mounted once with server data.
        <CvEditor key={cv.data.id} cv={cv.data} profile={profile.data} />
      )}
    </>
  );
}
