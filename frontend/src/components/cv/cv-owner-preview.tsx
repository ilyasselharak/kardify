"use client";

import { ArrowLeft, Eye, Pencil, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useParams, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { ErrorState } from "@/components/dashboard/empty-state";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@/i18n/navigation";
import { buildCvDocument } from "@/lib/cv/document";
import { useCv, useCvProfile } from "@/lib/hooks/use-cv";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { useCvPdf } from "./cv-actions";
import { CvShareDialog } from "./cv-share-dialog";
import { PublicCvView } from "./public-cv-view";

/** "Preview before publishing": exactly what visitors will see, rendered from the owner's data. */
export function CvOwnerPreview() {
  const { id } = useParams<{ id: string }>();
  const params = useSearchParams();
  const t = useTranslations("cvPreview");
  const tc = useTranslations("common");
  const errorMessage = useErrorMessage();
  const cv = useCv(id);
  const profile = useCvProfile();
  const pdf = useCvPdf();
  const [shareOpen, setShareOpen] = useState(false);
  const doc = useMemo(() => (cv.data && profile.data ? buildCvDocument(cv.data, profile.data) : null), [cv.data, profile.data]);

  if (cv.isLoading || profile.isLoading) return <Skeleton className="h-[80dvh] rounded-2xl" />;
  if (!cv.data || !doc) return <ErrorState message={errorMessage(cv.error ?? profile.error)} onRetry={() => cv.refetch()} retryLabel={tc("retry")} />;
  const data = cv.data;
  const status = data.isPublic ? t(`status.${data.visibility}`) : t("status.PRIVATE");

  const banner = (
    <div className="no-print flex flex-wrap items-center gap-3 border-b border-primary/15 bg-primary/5 px-4 py-3">
      <Button asChild variant="ghost" size="icon-sm" aria-label={tc("back")}>
        <Link href={`/dashboard/cv/${data.id}/edit`}><ArrowLeft className="rtl-flip" /></Link>
      </Button>
      <Eye className="size-4 text-primary" />
      <p className="min-w-0 flex-1 text-sm">
        <span className="font-semibold text-navy">{t("title")}</span> <span className="text-muted-foreground">· {status}</span>
      </p>
      <Button asChild size="sm" variant="outline"><Link href={`/dashboard/cv/${data.id}/edit`}><Pencil /> {t("edit")}</Link></Button>
      <Button size="sm" onClick={() => setShareOpen(true)}><Share2 /> {t("publish")}</Button>
    </div>
  );

  return (
    <div className="-mx-4 -my-6 sm:-mx-6 sm:-my-8 lg:-mx-8">
      <title>{`${t("title")} · ${data.title} · Kardify`}</title>
      <PublicCvView
        doc={doc}
        url={data.publicLink?.url ?? ""}
        allowDownload
        mode="preview"
        stickyHeader={false}
        onDownload={() => pdf.download(data.id, data.title)}
        autoPrint={params.get("print") === "1"}
        banner={banner}
      />
      <CvShareDialog cv={data} name={doc.profile.fullName || data.title} open={shareOpen} onOpenChange={setShareOpen} onChange={() => void cv.refetch()} />
    </div>
  );
}
