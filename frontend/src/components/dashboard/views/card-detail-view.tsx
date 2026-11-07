"use client";

import { ArrowLeft, BarChart3, Copy, ExternalLink, Pencil, Power, PowerOff, RefreshCw, Share2, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { ViewsChart } from "@/components/analytics/views-chart";
import { FlippableCard } from "@/components/cards/business-card";
import { DeleteCardDialog, useCardActionHandlers } from "@/components/cards/card-actions";
import { QrPanel } from "@/components/cards/qr-dialog";
import { ShareDialog } from "@/components/cards/share-dialog";
import { StatusBadge } from "@/components/cards/status-badge";
import { WalletButtons } from "@/components/cards/wallet-buttons";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "@/i18n/navigation";
import type { BusinessCard } from "@/lib/api/types";
import { useCardAnalytics } from "@/lib/hooks/use-analytics";
import { useCard, useRegenerateLink, useShareLinks } from "@/lib/hooks/use-cards";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { copyText, ownerQrUrl, vcardUrl } from "@/lib/public-card";
import { formatNumber } from "@/lib/utils";
import { ErrorState } from "../empty-state";

export function CardDetailView() {
  const { id } = useParams<{ id: string }>();
  const t = useTranslations("cards");
  const tc = useTranslations("common");
  const errorMessage = useErrorMessage();
  const query = useCard(id);

  if (query.isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        <Skeleton className="h-96 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }
  if (query.isError || !query.data) {
    return <ErrorState message={errorMessage(query.error)} onRetry={() => query.refetch()} retryLabel={tc("retry")} />;
  }
  return <CardDetail card={query.data} backLabel={t("detail.back")} />;
}

function CardDetail({ card, backLabel }: { card: BusinessCard; backLabel: string }) {
  const t = useTranslations("cards");
  const ta = useTranslations("analytics");
  const tc = useTranslations("common");
  const locale = useLocale();
  const errorMessage = useErrorMessage();
  const a = useCardActionHandlers(card);
  const regenerate = useRegenerateLink();
  const [side, setSide] = useState<"front" | "back">("front");
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [regenOpen, setRegenOpen] = useState(false);
  const share = useShareLinks(card.id, card.status === "ACTIVE");
  const stats = useCardAnalytics(card.id, "30d");

  return (
    <>
      <title>{`${card.name} · Kardify`}</title>
      <Link href="/dashboard/cards" className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground">
        <ArrowLeft className="rtl-flip size-4" /> {backLabel}
      </Link>
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <h1 dir="auto" className="truncate text-2xl font-bold tracking-tight text-navy">{card.name}</h1>
            <StatusBadge status={card.status} />
          </div>
          <p dir="auto" className="mt-1 text-muted-foreground">{[card.jobTitle, card.companyName].filter(Boolean).join(" · ")}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={a.toggle} disabled={a.pending}>
            {a.isActive ? <><PowerOff /> {t("actions.deactivate")}</> : <><Power /> {t("actions.activate")}</>}
          </Button>
          <Button variant="outline" onClick={a.duplicate} disabled={a.pending}><Copy /> {t("actions.duplicate")}</Button>
          <Button asChild><Link href={`/dashboard/cards/${card.id}/edit`}><Pencil /> {t("actions.edit")}</Link></Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="grid min-w-0 content-start gap-6">
          <Card>
            <CardContent className="bg-[radial-gradient(circle_at_top,#eaf2ff,transparent_70%)] py-10">
              <FlippableCard card={card} url={card.publicUrl} side={side} className="mx-auto max-w-lg" />
              <div className="mt-6 flex justify-center">
                <Tabs value={side} onValueChange={(v) => setSide(v as typeof side)}>
                  <TabsList>
                    <TabsTrigger value="front" className="px-5">{t("detail.front")}</TabsTrigger>
                    <TabsTrigger value="back" className="px-5">{t("detail.backSide")}</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex-row items-center justify-between">
              <CardTitle>{t("detail.performance")}</CardTitle>
              <Button asChild variant="ghost" size="sm"><Link href={`/dashboard/analytics?card=${card.id}`}><BarChart3 /> {t("actions.analytics")}</Link></Button>
            </CardHeader>
            <CardContent>
              {stats.data ? (
                <>
                  <dl className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {[
                      { label: ta("views"), value: stats.data.totals.VIEW },
                      { label: ta("visitors"), value: stats.data.totals.uniqueVisitors },
                      { label: ta("scans"), value: stats.data.totals.QR_SCAN },
                      { label: ta("events.CONTACT_DOWNLOAD"), value: stats.data.totals.CONTACT_DOWNLOAD },
                    ].map((s) => (
                      <div key={s.label}>
                        <dt className="text-xs text-muted-foreground">{s.label}</dt>
                        <dd className="mt-1 text-2xl font-bold tabular-nums text-navy">{formatNumber(s.value, locale)}</dd>
                      </div>
                    ))}
                  </dl>
                  <ViewsChart data={stats.data.series} height={220} />
                </>
              ) : (
                <Skeleton className="h-64" />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid min-w-0 content-start gap-6">
          <Card>
            <CardHeader><CardTitle>{t("detail.publicLink")}</CardTitle></CardHeader>
            <CardContent className="grid gap-3">
              {a.isActive ? (
                <>
                  <p dir="ltr" className="truncate rounded-lg bg-muted px-3 py-2 text-start font-mono text-sm text-primary">{card.publicUrl}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <Button variant="outline" size="sm" onClick={async () => (await copyText(card.publicUrl)) && toast.success(tc("copied"))}><Copy /> {tc("copy")}</Button>
                    <Button variant="outline" size="sm" asChild><a href={card.publicUrl} target="_blank" rel="noopener noreferrer"><ExternalLink /> {tc("view")}</a></Button>
                    <Button size="sm" onClick={() => setShareOpen(true)} disabled={!share.data}><Share2 /> {t("detail.share")}</Button>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 text-center">
                  <p className="text-sm text-muted-foreground">{t("detail.notPublished")}</p>
                  <Button size="sm" className="mt-3" onClick={a.toggle} loading={a.pending}><Power /> {t("detail.publishNow")}</Button>
                </div>
              )}
              <Button variant="ghost" size="sm" className="justify-start text-muted-foreground" onClick={() => setRegenOpen(true)}>
                <RefreshCw /> {t("detail.regenerate")}
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("detail.qrCode")}</CardTitle></CardHeader>
            <CardContent><QrPanel card={card} /></CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>{t("detail.wallet")}</CardTitle></CardHeader>
            <CardContent>
              {a.isActive ? <WalletButtons publicId={card.publicId} /> : <p className="text-sm text-muted-foreground">{t("mustPublish")}</p>}
            </CardContent>
          </Card>

          <Button variant="ghost" className="justify-start text-destructive hover:bg-destructive/10 hover:text-destructive" onClick={() => setDeleteOpen(true)}>
            <Trash2 /> {t("actions.delete")}
          </Button>
        </div>
      </div>

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
      <DeleteCardDialog card={card} open={deleteOpen} onOpenChange={setDeleteOpen} cancelLabel={tc("cancel")} onConfirm={() => a.remove(() => a.router.replace("/dashboard/cards"))} />
      <AlertDialog open={regenOpen} onOpenChange={setRegenOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("detail.regenerateTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("detail.regenerateBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{tc("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() =>
                regenerate.mutate(card.id, { onSuccess: () => toast.success(t("toasts.linkRegenerated")), onError: (e) => toast.error(errorMessage(e)) })
              }
            >
              {t("detail.regenerateConfirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
