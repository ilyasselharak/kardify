"use client";

import { ChevronDown, UserRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { moveItem } from "@/lib/cv/draft";
import { EXTRA_KIND_SECTION, type CvSectionKey } from "@/lib/cv/types";
import { cn } from "@/lib/utils";
import { useCvEditor } from "./editor-context";
import { SortableList, SortableRow } from "./fields";
import { PersonalForm, SECTION_FORMS } from "./section-forms";

/** Left panel: personal details + every CV section (reorder, enable/disable, rename, edit). */
export function SectionsPanel() {
  const t = useTranslations("cvEditor");
  const { draft, setDraft, errors } = useCvEditor();
  const [open, setOpen] = useState<CvSectionKey | "personal" | null>("personal");
  const toggle = (k: CvSectionKey | "personal") => setOpen((o) => (o === k ? null : k));

  const count = (key: CvSectionKey) => {
    switch (key) {
      case "experience": return draft.experiences.length;
      case "education": return draft.educations.length;
      case "skills": return draft.skills.length;
      case "projects": return draft.projects.length;
      case "certifications": return draft.certifications.length;
      case "languages": return draft.languages.length;
      case "summary": return null;
      default: return draft.extras.filter((x) => EXTRA_KIND_SECTION[x.kind] === key).length;
    }
  };
  const sectionHasError = (key: CvSectionKey) => {
    const col = { experience: "experiences", education: "educations", skills: "skills", projects: "projects", certifications: "certifications", languages: "languages" }[key as string];
    const prefix = col ? `${col}.` : "extras.";
    if (!col && key === "summary") return !!errors.summary;
    if (!col) {
      return draft.extras.some((x) => EXTRA_KIND_SECTION[x.kind] === key && Object.keys(errors).some((e) => e.startsWith(`${prefix}${x._key}.`)));
    }
    return Object.keys(errors).some((e) => e.startsWith(prefix));
  };

  return (
    <div className="grid gap-2">
      {/* Personal details are always first and always shown. */}
      <div className={cn("rounded-xl border bg-card", open === "personal" ? "border-primary/30 shadow-soft" : "border-border")}>
        <button type="button" onClick={() => toggle("personal")} aria-expanded={open === "personal"} className="flex w-full items-center gap-3 px-3 py-3 text-start">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary/10 text-primary"><UserRound className="size-4" /></span>
          <span className="flex-1">
            <span className="block text-sm font-semibold">{t("personal")}</span>
            <span className="block text-xs text-muted-foreground">{t("personalHint")}</span>
          </span>
          <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", open === "personal" && "rotate-180")} />
        </button>
        {open === "personal" && <div className="border-t border-border p-3.5"><PersonalForm /></div>}
      </div>

      <p className="mt-3 mb-1 px-1 text-xs font-semibold tracking-wide text-muted-foreground uppercase">{t("sectionsTitle")}</p>
      <SortableList
        items={draft.sections.map((s) => ({ id: s.key }))}
        onMove={(a, b) => setDraft((d) => ({ ...d, sections: moveItem(d.sections, a, b) }))}
      >
        <div className="grid gap-2">
          {draft.sections.map((s, i) => {
            const isOpen = open === s.key;
            const n = count(s.key);
            const bad = sectionHasError(s.key);
            return (
              <SortableRow key={s.key} id={s.key}>
                {(handle) => (
                  <div className={cn("rounded-xl border bg-card transition", isOpen ? "border-primary/30 shadow-soft" : bad ? "border-destructive/40" : "border-border", !s.enabled && "bg-muted/40")}>
                    <div className="flex items-center gap-1 px-1.5 py-1.5">
                      {handle}
                      <button type="button" onClick={() => toggle(s.key)} aria-expanded={isOpen} className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1.5 text-start">
                        <span className={cn("min-w-0 flex-1 truncate text-sm font-medium", !s.enabled && "text-muted-foreground")}>
                          {s.title || t(`sections.${s.key}`)}
                        </span>
                        {n !== null && n > 0 && <span className="rounded-full bg-muted px-1.5 text-[11px] font-medium tabular-nums text-muted-foreground">{n}</span>}
                        {bad && <span className="size-2 rounded-full bg-destructive" aria-label={t("hasErrors")} />}
                        <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", isOpen && "rotate-180")} />
                      </button>
                      <Switch
                        checked={s.enabled}
                        aria-label={t("showSection", { name: s.title || t(`sections.${s.key}`) })}
                        onCheckedChange={(enabled) => setDraft((d) => ({ ...d, sections: d.sections.map((x, j) => (j === i ? { ...x, enabled } : x)) }))}
                      />
                    </div>
                    {isOpen && (
                      <div className="grid gap-3.5 border-t border-border p-3.5">
                        {!s.enabled && <p className="rounded-lg bg-warning/10 px-3 py-2 text-xs text-amber-800">{t("sectionHidden")}</p>}
                        <div className="grid gap-1.5">
                          <label htmlFor={`title-${s.key}`} className="text-xs font-medium text-muted-foreground">{t("sectionHeading")}</label>
                          <Input
                            id={`title-${s.key}`}
                            dir="auto"
                            maxLength={60}
                            value={s.title ?? ""}
                            placeholder={t(`sections.${s.key}`)}
                            onChange={(e) => setDraft((d) => ({ ...d, sections: d.sections.map((x, j) => (j === i ? { ...x, title: e.target.value || null } : x)) }))}
                          />
                        </div>
                        {SECTION_FORMS[s.key]()}
                      </div>
                    )}
                  </div>
                )}
              </SortableRow>
            );
          })}
        </div>
      </SortableList>
    </div>
  );
}
