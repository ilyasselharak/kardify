"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Copy, Download, Eye, FileText, MoreHorizontal, Palette, Share2, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useDeferredValue, useMemo, useState } from "react";
import { toast } from "sonner";
import { SaveIndicator } from "@/components/editor/save-indicator";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link, useRouter } from "@/i18n/navigation";
import { api } from "@/lib/api/client";
import { buildCvDocument } from "@/lib/cv/document";
import {
  cvToDraft, draftToPayload, formToProfile, profileSchema, profileToForm, validateDraft, type CvDraft, type ProfileForm,
} from "@/lib/cv/draft";
import type { Cv, CvProfile } from "@/lib/cv/types";
import { useAutosave, type SaveState } from "@/lib/hooks/use-autosave";
import { queryKeys } from "@/lib/hooks/query-keys";
import { useErrorMessage } from "@/lib/hooks/use-error-message";
import { cn } from "@/lib/utils";
import { CvShareDialog, type ShareableCv } from "../cv-share-dialog";
import { DeleteCvDialog, useCvActions, useCvPdf } from "../cv-actions";
import { CvPreview } from "./cv-preview";
import { CvDesignPanel } from "./design-panel";
import { CvEditorContext, type CvEditorApi } from "./editor-context";
import { useTouched } from "./fields";
import { SectionsPanel } from "./sections-panel";

const serializeDraft = (d: CvDraft) => JSON.stringify(draftToPayload(d));
const isDraftValid = (d: CvDraft) => Object.keys(validateDraft(d)).length === 0;
const isProfileValid = (p: ProfileForm) => profileSchema.safeParse(p).success;

/** Worst state wins, so the indicator never claims "saved" while something is pending. */
function combine(a: SaveState, b: SaveState): SaveState {
  const rank: SaveState[] = ["error", "invalid", "saving", "dirty", "saved"];
  return rank[Math.min(rank.indexOf(a), rank.indexOf(b))];
}

/**
 * CV editor: sections & forms (left), real-time A4 preview (centre), design (right).
 * The CV version and the shared profile are autosaved independently.
 */
export function CvEditor({ cv, profile }: { cv: Cv; profile: CvProfile }) {
  const t = useTranslations("cvEditor");
  const qc = useQueryClient();
  const router = useRouter();
  const errorMessage = useErrorMessage();
  const [draft, setDraftState] = useState(() => cvToDraft(cv));
  const [profileForm, setProfileForm] = useState(() => profileToForm(profile));
  const [server, setServer] = useState<ShareableCv & { updatedAt: string }>(cv);
  const [showAll, setShowAll] = useState(false);
  const [panel, setPanel] = useState<"content" | "preview" | "design">("content");
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const { touched, touch } = useTouched();
  const pdf = useCvPdf();
  const actions = useCvActions();

  const errors = useMemo(() => validateDraft(draft), [draft]);
  const profileErrors = useMemo(() => {
    const res = profileSchema.safeParse(profileForm);
    const out: Record<string, string> = {};
    if (!res.success) for (const i of res.error.issues) out[String(i.path[0])] ??= i.message;
    return out;
  }, [profileForm]);

  const cvSave = useAutosave({
    value: draft,
    serialize: serializeDraft,
    isValid: isDraftValid,
    save: async (d) => {
      try {
        const saved = await api.patch<Cv>(`/cvs/${cv.id}`, draftToPayload(d));
        setServer(saved);
        qc.setQueryData(queryKeys.cv(saved.id), saved);
        void qc.invalidateQueries({ queryKey: queryKeys.cvs, refetchType: "none" });
      } catch (e) {
        toast.error(errorMessage(e));
        throw e;
      }
    },
  });
  const profileSave = useAutosave({
    value: profileForm,
    isValid: isProfileValid,
    save: async (f) => {
      try {
        const saved = await api.patch<CvProfile>("/cv-profile", formToProfile(f));
        qc.setQueryData(queryKeys.cvProfile, saved);
      } catch (e) {
        toast.error(errorMessage(e));
        throw e;
      }
    },
  });
  const state = combine(cvSave.state, profileSave.state);
  const flush = async () => (await Promise.all([cvSave.flush(), profileSave.flush()])).every(Boolean);

  const setDraft = useCallback((fn: (d: CvDraft) => CvDraft) => setDraftState((d) => fn(d)), []);
  const setProfile = useCallback((patch: Partial<ProfileForm>) => setProfileForm((p) => ({ ...p, ...patch })), []);

  const api_: CvEditorApi = { draft, setDraft, profile: profileForm, setProfile, errors, profileErrors, showAll, touched, touch };

  const doc = useMemo(
    () => buildCvDocument({ ...draftToPayload(draft), fullName: draft.fullName || null, headline: draft.headline || null, summary: draft.summary || null, updatedAt: server.updatedAt }, formToProfile(profileForm)),
    [draft, profileForm, server.updatedAt],
  );
  const deferredDoc = useDeferredValue(doc);
  const displayName = profileForm.fullName || draft.title;

  const requireValid = async () => {
    if (state === "invalid" || !(await flush())) {
      setShowAll(true);
      toast.error(t("fixErrors"));
      return false;
    }
    return true;
  };

  const onDownload = async () => {
    if (await requireValid()) void pdf.download(cv.id, `${displayName} CV`);
  };

  return (
    <CvEditorContext.Provider value={api_}>
      {/* Toolbar */}
      <div className="sticky top-16 z-20 -mx-4 mb-5 border-b border-border bg-background/90 px-4 py-3 backdrop-blur-lg sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <Button asChild variant="ghost" size="icon-sm" aria-label={t("back")}>
            <Link href="/dashboard/cv"><ArrowLeft className="rtl-flip" /></Link>
          </Button>
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <input
              aria-label={t("cvTitle")}
              value={draft.title}
              maxLength={120}
              onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
              className={cn("min-w-0 flex-1 truncate rounded-md bg-transparent px-1.5 py-1 text-base font-semibold text-navy outline-none hover:bg-muted focus:bg-card focus:ring-2 focus:ring-ring/30 sm:max-w-sm sm:text-lg", errors.title && "ring-2 ring-destructive/40")}
              dir="auto"
            />
            <Badge variant={server.isPublic ? "success" : "muted"} className="hidden sm:inline-flex">{t(`visibility.${server.isPublic ? server.visibility : "PRIVATE"}`)}</Badge>
            <button type="button" onClick={() => state === "invalid" && setShowAll(true)} className="hidden sm:block">
              <SaveIndicator state={state} onRetry={() => void flush()} />
            </button>
          </div>
          <div className="flex flex-wrap items-center gap-1.5">
            <Button asChild variant="ghost" size="sm"><Link href={`/dashboard/cv/${cv.id}/preview`}><Eye /> <span className="hidden md:inline">{t("previewCv")}</span></Link></Button>
            <Button type="button" variant="outline" size="sm" onClick={onDownload} loading={pdf.pending}><Download /> <span className="hidden sm:inline">{t("downloadPdf")}</span></Button>
            <Button type="button" size="sm" onClick={async () => { await flush(); setShareOpen(true); }}><Share2 /> {t("share")}</Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon-sm" aria-label={t("more")} disabled={actions.pending}><MoreHorizontal /></Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={async () => { await flush(); actions.duplicate(cv.id, true); }}><Copy /> {t("duplicate")}</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem variant="destructive" onSelect={() => setDeleteOpen(true)}><Trash2 /> {t("delete")}</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        <div className="mt-1 sm:hidden"><SaveIndicator state={state} onRetry={() => void flush()} /></div>
      </div>

      <div className="mb-4 xl:hidden">
        <Tabs value={panel} onValueChange={(v) => setPanel(v as typeof panel)}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content"><FileText /> {t("panels.content")}</TabsTrigger>
            <TabsTrigger value="preview"><Eye /> {t("panels.preview")}</TabsTrigger>
            <TabsTrigger value="design"><Palette /> {t("panels.design")}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="grid gap-5 xl:grid-cols-[380px_minmax(0,1fr)_300px] xl:items-start">
        <aside aria-label={t("panels.content")} className={cn("min-w-0 xl:block", panel !== "content" && "hidden")}>
          <SectionsPanel />
        </aside>
        <section aria-label={t("panels.preview")} className={cn("min-w-0 xl:sticky xl:top-36 xl:block", panel !== "preview" && "hidden")}>
          <CvPreview doc={deferredDoc} />
        </section>
        <aside aria-label={t("panels.design")} className={cn("min-w-0 rounded-2xl border border-border bg-card px-4 shadow-soft xl:block", panel !== "design" && "hidden")}>
          <CvDesignPanel />
        </aside>
      </div>

      <CvShareDialog cv={server} name={displayName} open={shareOpen} onOpenChange={setShareOpen} onChange={(next) => setServer((s) => ({ ...s, ...next }))} />
      <DeleteCvDialog title={draft.title} open={deleteOpen} onOpenChange={setDeleteOpen} onConfirm={() => actions.remove(cv.id, () => router.replace("/dashboard/cv"))} />
    </CvEditorContext.Provider>
  );
}
