"use client";

import {
  CalendarClock, Copy, Download, Eye, FileText, Globe, Link2, Lock, MoreHorizontal, Pencil, PlusCircle, Share2, Sparkles, Trash2, Type,
} from "lucide-react";
import { useFormatter, useNow, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { EmptyState, ErrorState } from "@/components/dashboard/empty-state";
import { PageHeader } from "@/components/dashboard/page-header";
import { StatCard } from "@/components/dashboard/stat-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link, useRouter } from "@/i18n/navigation";
import { buildCvDocument } from "@/lib/cv/document";
import { CV_TEMPLATE_IDS, type CvListItem, type CvTemplateId } from "@/lib/cv/types";
import { useCv, useCvList, useCvProfile, useRenameCv } from "@/lib/hooks/use-cv";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { cn } from "@/lib/utils";
import { CreateCvDialog } from "./create-cv-dialog";
import { DeleteCvDialog, useCvActions, useCvPdf } from "./cv-actions";
import { CvShareDialog, type ShareableCv } from "./cv-share-dialog";
import { CvTemplateThumb } from "./editor/design-panel";
import { CvPaged } from "./render/cv-document";

function VisibilityBadge({ cv }: { cv: Pick<CvListItem, "visibility" | "isPublic" | "publicLink"> }) {
  const t = useTranslations("cv.visibility");
  if (!cv.isPublic) {
    const off = cv.visibility !== "PRIVATE" && cv.publicLink && !cv.publicLink.enabled;
    return <Badge variant="muted"><Lock className="size-3" /> {off ? t("linkOff") : t("PRIVATE")}</Badge>;
  }
  return cv.visibility === "PUBLIC" ? <Badge variant="success"><Globe className="size-3" /> {t("PUBLIC")}</Badge> : <Badge variant="warning"><Link2 className="size-3" /> {t("UNLISTED")}</Badge>;
}

function CompletionCard({ value, loading }: { value: number; loading: boolean }) {
  const t = useTranslations("cv.stats");
  const tone = value >= 80 ? "bg-success" : value >= 50 ? "bg-primary" : "bg-warning";
  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">{t("completion")}</span>
        <span className="flex size-9 items-center justify-center rounded-xl bg-primary/10 text-primary"><Sparkles className="size-[18px]" /></span>
      </div>
      {loading ? <Skeleton className="mt-3 h-8 w-20" /> : <p className="mt-2 text-[28px] font-bold tracking-tight text-navy tabular-nums">{value}%</p>}
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={100} aria-label={t("completion")}>
        <div className={cn("h-full rounded-full transition-all", tone)} style={{ width: `${value}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted-foreground">{value >= 100 ? t("completeDone") : t("completeHint")}</p>
    </div>
  );
}

/** Real preview of the most recently edited CV. */
function LatestCvPreview({ item }: { item: CvListItem }) {
  const cv = useCv(item.id);
  const profile = useCvProfile();
  const doc = useMemo(() => (cv.data && profile.data ? buildCvDocument(cv.data, profile.data) : null), [cv.data, profile.data]);
  return (
    <div className="flex justify-center rounded-xl bg-[#eef2f8] p-4">
      <div className="h-[340px] w-[240px] overflow-hidden rounded-md shadow-lifted">
        {doc ? <CvPaged doc={doc} zoom={240 / 794} maxPages={1} links={false} /> : <Skeleton className="size-full" />}
      </div>
    </div>
  );
}

export function CvDashboardView() {
  const t = useTranslations("cv");
  const tc = useTranslations("common");
  const tt = useTranslations("templates");
  const format = useFormatter();
  const now = useNow({ updateInterval: 60_000 });
  const params = useSearchParams();
  const router = useRouter();
  const errorMessage = useErrorMessage();
  const list = useCvList();
  const pdf = useCvPdf();
  const actions = useCvActions();
  const rename = useRenameCv();
  const fromQuery = params.get("template");
  const [createOpen, setCreateOpen] = useState(params.get("new") === "1");
  const [share, setShare] = useState<ShareableCv | null>(null);
  const [toDelete, setToDelete] = useState<CvListItem | null>(null);
  const [toRename, setToRename] = useState<CvListItem | null>(null);
  const [newTitle, setNewTitle] = useState("");

  const items = list.data?.items ?? [];
  const stats = list.data?.stats;
  const latest = items[0];
  const when = (d: string | null | undefined) => (d ? format.relativeTime(new Date(d), now) : "—");

  const header = (
    <PageHeader
      title={t("title")}
      description={t("subtitle")}
      actions={<Button onClick={() => setCreateOpen(true)}><PlusCircle /> {t("create")}</Button>}
    />
  );

  if (list.isError) {
    return <>{header}<ErrorState message={errorMessage(list.error)} onRetry={() => list.refetch()} retryLabel={tc("retry")} /></>;
  }

  return (
    <>
      {header}

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <CompletionCard value={stats?.completion ?? 0} loading={list.isLoading} />
        <StatCard label={t("stats.total")} value={String(stats?.total ?? 0)} icon={FileText} loading={list.isLoading} />
        <StatCard label={t("stats.public")} value={String(stats?.public ?? 0)} icon={Globe} loading={list.isLoading} />
        <StatCard label={t("stats.lastUpdated")} value={when(stats?.lastUpdated)} icon={CalendarClock} loading={list.isLoading} valueClassName="text-xl leading-[42px]" />
      </div>

      {list.isLoading ? (
        <Skeleton className="mt-6 h-[400px] rounded-2xl" />
      ) : !latest ? (
        <EmptyState
          className="mt-6"
          icon={FileText}
          title={t("emptyTitle")}
          description={t("emptyBody")}
          action={<Button size="lg" onClick={() => setCreateOpen(true)}><PlusCircle /> {t("emptyCta")}</Button>}
        />
      ) : (
        <>
          <section className="mt-6 grid gap-6 rounded-2xl border border-border bg-card p-5 shadow-soft md:grid-cols-[280px_minmax(0,1fr)]">
            <LatestCvPreview item={latest} />
            <div className="flex min-w-0 flex-col">
              <p className="text-xs font-semibold tracking-wide text-primary uppercase">{t("latest")}</p>
              <h2 dir="auto" className="mt-1 truncate text-xl font-bold text-navy">{latest.title}</h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <VisibilityBadge cv={latest} />
                <span>{tt(`cvNames.${latest.template}`)}</span>
                <span aria-hidden>·</span>
                <span>{latest.language === "ar" ? tc("arabic") : tc("english")}</span>
                <span aria-hidden>·</span>
                <span>{t("updated", { when: when(latest.updatedAt) })}</span>
              </div>
              <dl className="mt-4 grid grid-cols-3 gap-3 sm:grid-cols-5">
                {(["experiences", "educations", "skills", "projects", "languages"] as const).map((k) => (
                  <div key={k} className="rounded-xl bg-muted/60 px-3 py-2">
                    <dt className="text-xs text-muted-foreground">{t(`counts.${k}`)}</dt>
                    <dd className="text-lg font-semibold tabular-nums text-navy">{latest.counts[k]}</dd>
                  </div>
                ))}
              </dl>
              {latest.isPublic && latest.publicLink && (
                <a href={latest.publicLink.url} target="_blank" rel="noopener noreferrer" dir="ltr" className="mt-4 truncate rounded-lg bg-primary/5 px-3 py-2 font-mono text-xs text-primary hover:underline">{latest.publicLink.url}</a>
              )}
              <div className="mt-auto flex flex-wrap gap-2 pt-5">
                <Button asChild><Link href={`/dashboard/cv/${latest.id}/edit`}><Pencil /> {t("actions.edit")}</Link></Button>
                <Button asChild variant="outline"><Link href={`/dashboard/cv/${latest.id}/preview`}><Eye /> {t("actions.preview")}</Link></Button>
                <Button variant="outline" onClick={() => pdf.download(latest.id, latest.title)} loading={pdf.pending}><Download /> {t("actions.download")}</Button>
                <Button variant="outline" onClick={() => setShare(latest)}><Share2 /> {t("actions.share")}</Button>
                <Button variant="ghost" onClick={() => setCreateOpen(true)}><PlusCircle /> {t("create")}</Button>
              </div>
            </div>
          </section>

          <h2 className="mt-10 mb-4 text-lg font-semibold text-navy">{t("allCvs", { count: items.length })}</h2>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {items.map((cv) => (
              <li key={cv.id} className="group flex gap-4 rounded-2xl border border-border bg-card p-4 shadow-soft transition hover:shadow-lifted">
                <Link href={`/dashboard/cv/${cv.id}/edit`} className="shrink-0" aria-label={t("actions.edit")}>
                  <CvTemplateThumb id={cv.template} lang={cv.language} width={92} />
                </Link>
                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex items-start gap-2">
                    <Link href={`/dashboard/cv/${cv.id}/edit`} dir="auto" className="min-w-0 flex-1 truncate font-semibold text-navy hover:text-primary">{cv.title}</Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon-sm" aria-label={t("actions.menu")} disabled={actions.pending}><MoreHorizontal /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-52">
                        <DropdownMenuItem onSelect={() => router.push(`/dashboard/cv/${cv.id}/edit`)}><Pencil /> {t("actions.edit")}</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => router.push(`/dashboard/cv/${cv.id}/preview`)}><Eye /> {t("actions.preview")}</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => pdf.download(cv.id, cv.title)}><Download /> {t("actions.download")}</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => setShare(cv)}><Share2 /> {t("actions.share")}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onSelect={() => { setNewTitle(cv.title); setToRename(cv); }}><Type /> {t("actions.rename")}</DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => actions.duplicate(cv.id)}><Copy /> {t("actions.duplicate")}</DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem variant="destructive" onSelect={() => setToDelete(cv)}><Trash2 /> {t("actions.delete")}</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                    <VisibilityBadge cv={cv} />
                    <span>{cv.language.toUpperCase()}</span>
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">{tt(`cvNames.${cv.template}`)}</p>
                  <p className="mt-auto pt-2 text-xs text-muted-foreground">{t("updated", { when: when(cv.updatedAt) })}</p>
                </div>
              </li>
            ))}
          </ul>
        </>
      )}

      {createOpen && (
        <CreateCvDialog
          open={createOpen}
          onOpenChange={setCreateOpen}
          existing={items}
          initialTemplate={CV_TEMPLATE_IDS.includes(fromQuery as CvTemplateId) ? (fromQuery as CvTemplateId) : undefined}
        />
      )}
      {share && (
        <CvShareDialog
          cv={share}
          name={share.title}
          open={!!share}
          onOpenChange={(o) => !o && setShare(null)}
          onChange={(next) => setShare((s) => (s ? { ...s, ...next } : s))}
        />
      )}
      <DeleteCvDialog title={toDelete?.title ?? ""} open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)} onConfirm={() => toDelete && actions.remove(toDelete.id)} />
      <Dialog open={!!toRename} onOpenChange={(o) => !o && setToRename(null)}>
        <DialogContent className="max-w-sm">
          <form
            className="grid gap-4"
            onSubmit={(e) => {
              e.preventDefault();
              if (!toRename || !newTitle.trim()) return;
              rename.mutate(
                { id: toRename.id, title: newTitle.trim() },
                { onSuccess: () => { toast.success(t("toasts.renamed")); setToRename(null); }, onError: (err) => toast.error(errorMessage(err)) },
              );
            }}
          >
            <DialogHeader><DialogTitle>{t("actions.rename")}</DialogTitle></DialogHeader>
            <Input dir="auto" autoFocus maxLength={120} value={newTitle} onChange={(e) => setNewTitle(e.target.value)} aria-label={t("createDialog.name")} />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setToRename(null)}>{tc("cancel")}</Button>
              <Button type="submit" loading={rename.isPending} disabled={!newTitle.trim()}>{tc("save")}</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
