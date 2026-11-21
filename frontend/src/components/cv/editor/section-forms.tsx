"use client";

import { Info, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { ImageUpload } from "@/components/wizard/image-upload";
import { emptyExtra, emptyItem, moveItem, newKey } from "@/lib/cv/draft";
import { EMPLOYMENT_TYPES, LANGUAGE_LEVELS, SKILL_CATEGORIES, type CvSectionKey, type ExtraKind } from "@/lib/cv/types";
import { useCollection, useCvEditor } from "./editor-context";
import { FieldError, ItemCard, MonthField, SelectField, SortableList, SortableRow, TextField } from "./fields";

function AddButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button type="button" variant="outline" size="sm" onClick={onClick} className="w-full border-dashed">
      <Plus /> {label}
    </Button>
  );
}

function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex gap-2 rounded-lg bg-primary/5 px-3 py-2 text-xs text-primary">
      <Info className="mt-px size-3.5 shrink-0" /> <span>{children}</span>
    </p>
  );
}

// ─── Personal information (shared profile) ─────────────────────────────

export function PersonalForm() {
  const t = useTranslations("cvEditor.fields");
  const te = useTranslations("cvEditor");
  const { profile, setProfile, profileErrors, draft, setDraft, touched, touch, showAll } = useCvEditor();
  const err = (f: string) => (showAll || touched.has(`profile.${f}`) ? profileErrors[f] : undefined);
  const field = (name: keyof typeof profile, label: string, opts: { type?: string; dir?: "ltr"; placeholder?: string; optional?: boolean } = {}) => (
    <TextField
      id={`p-${name}`}
      label={label}
      value={profile[name]}
      onChange={(v) => setProfile({ [name]: v })}
      onBlur={() => touch(`profile.${name}`)}
      error={err(name)}
      {...opts}
    />
  );
  return (
    <div className="@container grid gap-3.5">
      <Note>{te("sharedNote")}</Note>
      <ImageUpload label={t("photo")} purpose="profile" value={profile.photo} onChange={(photo) => setProfile({ photo })} />
      <div className="grid gap-3.5 @md:grid-cols-2">
        {field("fullName", t("fullName"))}
        <TextField
          id="cv-name"
          label={t("nameOverride")}
          value={draft.fullName}
          onChange={(fullName) => setDraft((d) => ({ ...d, fullName }))}
          placeholder={profile.fullName}
          hint={t("nameOverrideHint")}
          maxLength={120}
          optional
        />
      </div>
      <div className="grid gap-3.5 @md:grid-cols-2">
        {field("professionalTitle", t("professionalTitle"))}
        <TextField
          id="headline"
          label={t("headlineOverride")}
          value={draft.headline}
          onChange={(headline) => setDraft((d) => ({ ...d, headline }))}
          placeholder={profile.professionalTitle}
          hint={t("headlineHint")}
          optional
        />
      </div>
      <div className="grid gap-3.5 @md:grid-cols-2">
        {field("email", t("email"), { type: "email", dir: "ltr" })}
        {field("phone", t("phone"), { type: "tel", dir: "ltr" })}
      </div>
      {field("address", t("address"), { optional: true })}
      <div className="grid gap-3.5 @md:grid-cols-2">
        {field("city", t("city"))}
        {field("country", t("country"))}
      </div>
      <div className="grid gap-3.5 @md:grid-cols-2">
        {field("website", t("website"), { dir: "ltr", placeholder: "https://" })}
        {field("portfolio", t("portfolio"), { dir: "ltr", placeholder: "https://" })}
        {field("linkedin", t("linkedin"), { dir: "ltr", placeholder: "https://linkedin.com/in/…" })}
        {field("github", t("github"), { dir: "ltr", placeholder: "https://github.com/…" })}
      </div>
    </div>
  );
}

// ─── Summary ───────────────────────────────────────────────────────────

export function SummaryForm() {
  const t = useTranslations("cvEditor.fields");
  const { profile, setProfile, draft, setDraft, profileErrors, errors } = useCvEditor();
  const [custom, setCustom] = useState(!!draft.summary);
  return (
    <div className="grid gap-3.5">
      <TextField id="summary" label={t("summary")} multiline rows={5} maxLength={2000} value={profile.summary} onChange={(summary) => setProfile({ summary })} error={profileErrors.summary} hint={t("summaryHint")} />
      <label className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
        {t("customSummary")}
        <Switch
          checked={custom}
          onCheckedChange={(on) => {
            setCustom(on);
            if (!on) setDraft((d) => ({ ...d, summary: "" }));
          }}
        />
      </label>
      {custom && (
        <TextField id="cv-summary" label={t("cvSummary")} multiline rows={5} maxLength={2000} value={draft.summary} onChange={(summary) => setDraft((d) => ({ ...d, summary }))} error={errors.summary} placeholder={profile.summary} />
      )}
      <TextField id="objectives" label={t("objectives")} multiline rows={3} maxLength={1000} value={profile.objectives} onChange={(objectives) => setProfile({ objectives })} optional />
      <TextField id="achievements" label={t("achievements")} multiline rows={4} maxLength={2000} value={profile.achievements} onChange={(achievements) => setProfile({ achievements })} hint={t("bulletsHint")} optional />
    </div>
  );
}

// ─── Experience ────────────────────────────────────────────────────────

export function ExperienceForm() {
  const t = useTranslations("cvEditor.fields");
  const te = useTranslations("cvEditor");
  const c = useCollection("experiences");
  const [openKey, setOpenKey] = useState<string>();
  return (
    <div className="grid gap-2.5">
      <SortableList items={c.rows.map((r) => ({ id: r._key }))} onMove={(a, b) => c.setAll(moveItem(c.rows, a, b))}>
        {c.rows.map((r, i) => (
          <SortableRow key={r._key} id={r._key}>
            {(handle) => (
              <ItemCard
                title={r.jobTitle}
                subtitle={r.company}
                handle={handle}
                index={i}
                count={c.rows.length}
                onMove={(a, b) => c.setAll(moveItem(c.rows, a, b))}
                onRemove={() => c.remove(r._key)}
                defaultOpen={openKey === r._key}
                hasError={c.hasError(r._key)}
              >
                <div className="@container grid gap-3.5">
                  <div className="grid gap-3.5 @md:grid-cols-2">
                    <TextField id={`${r._key}-jt`} label={t("jobTitle")} value={r.jobTitle} onChange={(jobTitle) => c.update(r._key, { jobTitle })} onBlur={() => c.touch(r._key, "jobTitle")} error={c.error(r._key, "jobTitle")} maxLength={120} />
                    <TextField id={`${r._key}-co`} label={t("company")} value={r.company} onChange={(company) => c.update(r._key, { company })} onBlur={() => c.touch(r._key, "company")} error={c.error(r._key, "company")} maxLength={120} />
                    <TextField id={`${r._key}-loc`} label={t("location")} value={r.location ?? ""} onChange={(location) => c.update(r._key, { location })} optional />
                    <SelectField
                      id={`${r._key}-type`}
                      label={t("employmentType")}
                      value={r.employmentType as (typeof EMPLOYMENT_TYPES)[number] | null}
                      placeholder="—"
                      options={EMPLOYMENT_TYPES.map((v) => ({ value: v, label: t(`employment.${v}`) }))}
                      onChange={(v) => c.update(r._key, { employmentType: v || null })}
                    />
                    <MonthField id={`${r._key}-sd`} label={t("startDate")} value={r.startDate} onChange={(startDate) => c.update(r._key, { startDate })} />
                    <MonthField id={`${r._key}-ed`} label={t("endDate")} value={r.current ? null : r.endDate} disabled={r.current} onChange={(endDate) => c.update(r._key, { endDate })} error={c.error(r._key, "endDate")} />
                  </div>
                  <label className="flex items-center gap-2 text-sm">
                    <Checkbox checked={r.current} onCheckedChange={(v) => c.update(r._key, { current: v === true, endDate: v === true ? null : r.endDate })} />
                    {t("currentlyWorking")}
                  </label>
                  <TextField id={`${r._key}-resp`} label={t("responsibilities")} multiline rows={5} maxLength={3000} value={r.responsibilities} onChange={(responsibilities) => c.update(r._key, { responsibilities })} hint={t("bulletsHint")} />
                  <TextField id={`${r._key}-ach`} label={t("achievementsList")} multiline rows={3} maxLength={2000} value={r.achievements} onChange={(achievements) => c.update(r._key, { achievements })} optional />
                </div>
              </ItemCard>
            )}
          </SortableRow>
        ))}
      </SortableList>
      <AddButton
        label={te("add.experience")}
        onClick={() => {
          const key = newKey();
          setOpenKey(key);
          c.add({ ...emptyItem.experiences(), _key: key });
        }}
      />
    </div>
  );
}

// ─── Education ─────────────────────────────────────────────────────────

export function EducationForm() {
  const t = useTranslations("cvEditor.fields");
  const te = useTranslations("cvEditor");
  const c = useCollection("educations");
  const [openKey, setOpenKey] = useState<string>();
  return (
    <div className="grid gap-2.5">
      <SortableList items={c.rows.map((r) => ({ id: r._key }))} onMove={(a, b) => c.setAll(moveItem(c.rows, a, b))}>
        {c.rows.map((r, i) => (
          <SortableRow key={r._key} id={r._key}>
            {(handle) => (
              <ItemCard title={r.degree} subtitle={r.institution} handle={handle} index={i} count={c.rows.length} onMove={(a, b) => c.setAll(moveItem(c.rows, a, b))} onRemove={() => c.remove(r._key)} defaultOpen={openKey === r._key} hasError={c.hasError(r._key)}>
                <div className="@container grid gap-3.5">
                  <div className="grid gap-3.5 @md:grid-cols-2">
                    <TextField id={`${r._key}-deg`} label={t("degree")} value={r.degree} onChange={(degree) => c.update(r._key, { degree })} onBlur={() => c.touch(r._key, "degree")} error={c.error(r._key, "degree")} maxLength={160} />
                    <TextField id={`${r._key}-ins`} label={t("institution")} value={r.institution} onChange={(institution) => c.update(r._key, { institution })} onBlur={() => c.touch(r._key, "institution")} error={c.error(r._key, "institution")} maxLength={160} />
                    <TextField id={`${r._key}-loc`} label={t("location")} value={r.location ?? ""} onChange={(location) => c.update(r._key, { location })} optional />
                    <TextField id={`${r._key}-gr`} label={t("grade")} value={r.grade ?? ""} onChange={(grade) => c.update(r._key, { grade })} maxLength={40} optional />
                    <MonthField id={`${r._key}-sd`} label={t("startDate")} value={r.startDate} onChange={(startDate) => c.update(r._key, { startDate })} />
                    <MonthField id={`${r._key}-ed`} label={t("endDate")} value={r.endDate} onChange={(endDate) => c.update(r._key, { endDate })} error={c.error(r._key, "endDate")} />
                  </div>
                  <TextField id={`${r._key}-desc`} label={t("description")} multiline rows={3} maxLength={1500} value={r.description} onChange={(description) => c.update(r._key, { description })} optional />
                </div>
              </ItemCard>
            )}
          </SortableRow>
        ))}
      </SortableList>
      <AddButton label={te("add.education")} onClick={() => { const key = newKey(); setOpenKey(key); c.add({ ...emptyItem.educations(), _key: key }); }} />
    </div>
  );
}

// ─── Skills ────────────────────────────────────────────────────────────

export function SkillsForm() {
  const t = useTranslations("cvEditor.fields");
  const te = useTranslations("cvEditor");
  const c = useCollection("skills");
  const [name, setName] = useState("");
  const [category, setCategory] = useState<(typeof SKILL_CATEGORIES)[number]>("TECHNICAL");
  const add = () => {
    const names = name.split(",").map((n) => n.trim()).filter(Boolean);
    if (!names.length) return;
    for (const n of names) c.add({ name: n.slice(0, 80), category, level: null, _key: newKey() });
    setName("");
  };
  return (
    <div className="grid gap-3">
      <div className="grid gap-2 rounded-xl border border-dashed border-border p-3">
        <div className="flex gap-2">
          <Input
            dir="auto"
            value={name}
            placeholder={t("skillPlaceholder")}
            aria-label={t("skillName")}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
          />
          <Button type="button" onClick={add} disabled={!name.trim()} aria-label={te("add.skills")}><Plus /></Button>
        </div>
        <SelectField id="skill-cat" label={t("skillCategory")} value={category} options={SKILL_CATEGORIES.map((v) => ({ value: v, label: t(`skillCategories.${v}`) }))} onChange={(v) => v && setCategory(v)} />
      </div>
      <SortableList items={c.rows.map((r) => ({ id: r._key }))} onMove={(a, b) => c.setAll(moveItem(c.rows, a, b))}>
        <div className="grid gap-1.5">
          {c.rows.map((r) => (
            <SortableRow key={r._key} id={r._key}>
              {(handle) => (
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 rounded-lg border border-border bg-card p-1.5">
                  {handle}
                  <div className="grid min-w-0 gap-1.5 sm:grid-cols-[minmax(0,1fr)_auto_auto]">
                    <Input dir="auto" className="h-8" value={r.name} aria-label={t("skillName")} aria-invalid={!!c.error(r._key, "name")} onBlur={() => c.touch(r._key, "name")} onChange={(e) => c.update(r._key, { name: e.target.value })} maxLength={80} />
                    <select aria-label={t("skillCategory")} className="h-8 rounded-md border border-input bg-card px-1.5 text-xs" value={r.category} onChange={(e) => c.update(r._key, { category: e.target.value as typeof r.category })}>
                      {SKILL_CATEGORIES.map((v) => <option key={v} value={v}>{t(`skillCategories.${v}`)}</option>)}
                    </select>
                    <select aria-label={t("level")} className="h-8 rounded-md border border-input bg-card px-1.5 text-xs" value={r.level ?? ""} onChange={(e) => c.update(r._key, { level: e.target.value ? Number(e.target.value) : null })}>
                      <option value="">{t("noLevel")}</option>
                      {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{t(`levels.${n}`)}</option>)}
                    </select>
                  </div>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={te("removeItem")} onClick={() => c.remove(r._key)}>×</Button>
                  <div className="col-span-3"><FieldError error={c.error(r._key, "name")} /></div>
                </div>
              )}
            </SortableRow>
          ))}
        </div>
      </SortableList>
      {c.rows.length === 0 && <p className="text-center text-xs text-muted-foreground">{te("emptySkills")}</p>}
    </div>
  );
}

// ─── Projects ──────────────────────────────────────────────────────────

export function ProjectsForm() {
  const t = useTranslations("cvEditor.fields");
  const te = useTranslations("cvEditor");
  const c = useCollection("projects");
  const [openKey, setOpenKey] = useState<string>();
  return (
    <div className="grid gap-2.5">
      <SortableList items={c.rows.map((r) => ({ id: r._key }))} onMove={(a, b) => c.setAll(moveItem(c.rows, a, b))}>
        {c.rows.map((r, i) => (
          <SortableRow key={r._key} id={r._key}>
            {(handle) => (
              <ItemCard title={r.name} subtitle={r.technologies} handle={handle} index={i} count={c.rows.length} onMove={(a, b) => c.setAll(moveItem(c.rows, a, b))} onRemove={() => c.remove(r._key)} defaultOpen={openKey === r._key} hasError={c.hasError(r._key)}>
                <div className="@container grid gap-3.5">
                  <TextField id={`${r._key}-n`} label={t("projectName")} value={r.name} onChange={(name) => c.update(r._key, { name })} onBlur={() => c.touch(r._key, "name")} error={c.error(r._key, "name")} maxLength={120} />
                  <TextField id={`${r._key}-d`} label={t("description")} multiline rows={4} maxLength={2000} value={r.description} onChange={(description) => c.update(r._key, { description })} hint={t("bulletsHint")} />
                  <TextField id={`${r._key}-t`} label={t("technologies")} value={r.technologies} onChange={(technologies) => c.update(r._key, { technologies })} maxLength={300} placeholder="React, Node.js, PostgreSQL" optional />
                  <div className="grid gap-3.5 @md:grid-cols-2">
                    <TextField id={`${r._key}-u`} label={t("projectUrl")} dir="ltr" value={r.url ?? ""} onChange={(url) => c.update(r._key, { url })} onBlur={() => c.touch(r._key, "url")} error={c.error(r._key, "url")} placeholder="https://" optional />
                    <TextField id={`${r._key}-g`} label={t("githubUrl")} dir="ltr" value={r.githubUrl ?? ""} onChange={(githubUrl) => c.update(r._key, { githubUrl })} onBlur={() => c.touch(r._key, "githubUrl")} error={c.error(r._key, "githubUrl")} placeholder="https://github.com/…" optional />
                    <MonthField id={`${r._key}-sd`} label={t("startDate")} value={r.startDate} onChange={(startDate) => c.update(r._key, { startDate })} />
                    <MonthField id={`${r._key}-ed`} label={t("endDate")} value={r.endDate} onChange={(endDate) => c.update(r._key, { endDate })} error={c.error(r._key, "endDate")} />
                  </div>
                  <ImageUpload label={t("projectImage")} purpose="project" shape="square" value={r.image ?? ""} onChange={(image) => c.update(r._key, { image: image || null })} />
                </div>
              </ItemCard>
            )}
          </SortableRow>
        ))}
      </SortableList>
      <AddButton label={te("add.projects")} onClick={() => { const key = newKey(); setOpenKey(key); c.add({ ...emptyItem.projects(), _key: key }); }} />
    </div>
  );
}

// ─── Certifications ────────────────────────────────────────────────────

export function CertificationsForm() {
  const t = useTranslations("cvEditor.fields");
  const te = useTranslations("cvEditor");
  const c = useCollection("certifications");
  const [openKey, setOpenKey] = useState<string>();
  return (
    <div className="grid gap-2.5">
      <SortableList items={c.rows.map((r) => ({ id: r._key }))} onMove={(a, b) => c.setAll(moveItem(c.rows, a, b))}>
        {c.rows.map((r, i) => (
          <SortableRow key={r._key} id={r._key}>
            {(handle) => (
              <ItemCard title={r.name} subtitle={r.issuer} handle={handle} index={i} count={c.rows.length} onMove={(a, b) => c.setAll(moveItem(c.rows, a, b))} onRemove={() => c.remove(r._key)} defaultOpen={openKey === r._key} hasError={c.hasError(r._key)}>
                <div className="@container grid gap-3.5 @md:grid-cols-2">
                  <TextField id={`${r._key}-n`} label={t("certName")} value={r.name} onChange={(name) => c.update(r._key, { name })} onBlur={() => c.touch(r._key, "name")} error={c.error(r._key, "name")} maxLength={160} />
                  <TextField id={`${r._key}-i`} label={t("issuer")} value={r.issuer} onChange={(issuer) => c.update(r._key, { issuer })} onBlur={() => c.touch(r._key, "issuer")} error={c.error(r._key, "issuer")} maxLength={160} />
                  <MonthField id={`${r._key}-id`} label={t("issueDate")} value={r.issueDate} onChange={(issueDate) => c.update(r._key, { issueDate })} />
                  <MonthField id={`${r._key}-xd`} label={t("expirationDate")} value={r.expirationDate} onChange={(expirationDate) => c.update(r._key, { expirationDate })} error={c.error(r._key, "expirationDate")} />
                  <TextField className="@md:col-span-2" id={`${r._key}-u`} label={t("credentialUrl")} dir="ltr" value={r.credentialUrl ?? ""} onChange={(credentialUrl) => c.update(r._key, { credentialUrl })} onBlur={() => c.touch(r._key, "credentialUrl")} error={c.error(r._key, "credentialUrl")} placeholder="https://" optional />
                </div>
              </ItemCard>
            )}
          </SortableRow>
        ))}
      </SortableList>
      <AddButton label={te("add.certifications")} onClick={() => { const key = newKey(); setOpenKey(key); c.add({ ...emptyItem.certifications(), _key: key }); }} />
    </div>
  );
}

// ─── Languages ─────────────────────────────────────────────────────────

export function LanguagesForm() {
  const t = useTranslations("cvEditor.fields");
  const te = useTranslations("cvEditor");
  const c = useCollection("languages");
  return (
    <div className="grid gap-2">
      <SortableList items={c.rows.map((r) => ({ id: r._key }))} onMove={(a, b) => c.setAll(moveItem(c.rows, a, b))}>
        <div className="grid gap-1.5">
          {c.rows.map((r) => (
            <SortableRow key={r._key} id={r._key}>
              {(handle) => (
                <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-1.5 rounded-lg border border-border bg-card p-1.5">
                  {handle}
                  <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] gap-1.5">
                    <Input dir="auto" className="h-8" value={r.language} placeholder={t("language")} aria-label={t("language")} aria-invalid={!!c.error(r._key, "language")} onBlur={() => c.touch(r._key, "language")} onChange={(e) => c.update(r._key, { language: e.target.value })} maxLength={60} />
                    <select aria-label={t("proficiency")} className="h-8 rounded-md border border-input bg-card px-1.5 text-xs" value={r.proficiency} onChange={(e) => c.update(r._key, { proficiency: e.target.value as typeof r.proficiency })}>
                      {LANGUAGE_LEVELS.map((v) => <option key={v} value={v}>{t(`proficiencyLevels.${v}`)}</option>)}
                    </select>
                  </div>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={te("removeItem")} onClick={() => c.remove(r._key)}>×</Button>
                  <div className="col-span-3"><FieldError error={c.error(r._key, "language")} /></div>
                </div>
              )}
            </SortableRow>
          ))}
        </div>
      </SortableList>
      <AddButton label={te("add.languages")} onClick={() => c.add({ ...emptyItem.languages(), _key: newKey() })} />
    </div>
  );
}

// ─── Awards, publications, volunteering, interests, references ─────────

export function ExtrasForm({ kind }: { kind: ExtraKind }) {
  const t = useTranslations("cvEditor.fields");
  const te = useTranslations("cvEditor");
  const c = useCollection("extras");
  const [openKey, setOpenKey] = useState<string>();
  const rows = c.rows.filter((r) => r.kind === kind);
  // Reorder within this kind while keeping the other kinds' rows untouched.
  const move = (a: number, b: number) => {
    const moved = moveItem(rows, a, b);
    let k = 0;
    c.setAll(c.rows.map((r) => (r.kind === kind ? moved[k++] : r)));
  };
  const k = kind.toLowerCase() as "award" | "publication" | "volunteer" | "interest" | "reference";

  if (kind === "INTEREST") {
    return (
      <div className="grid gap-2">
        <div className="flex flex-wrap gap-1.5">
          {rows.map((r) => (
            <span key={r._key} className="inline-flex items-center gap-1 rounded-full border border-border bg-card py-0.5 ps-2.5 pe-1 text-sm">
              <input dir="auto" className="w-[min(12rem,40vw)] bg-transparent outline-none" value={r.title} aria-label={t("interest")} onChange={(e) => c.update(r._key, { title: e.target.value })} maxLength={160} />
              <button type="button" className="flex size-5 items-center justify-center rounded-full text-muted-foreground hover:bg-muted" aria-label={te("removeItem")} onClick={() => c.remove(r._key)}>×</button>
            </span>
          ))}
        </div>
        <InterestAdder onAdd={(title) => c.add({ ...emptyExtra("INTEREST"), title, _key: newKey() })} />
      </div>
    );
  }

  return (
    <div className="grid gap-2.5">
      <SortableList items={rows.map((r) => ({ id: r._key }))} onMove={move}>
        {rows.map((r, i) => (
          <SortableRow key={r._key} id={r._key}>
            {(handle) => (
              <ItemCard title={r.title} subtitle={r.subtitle ?? undefined} handle={handle} index={i} count={rows.length} onMove={move} onRemove={() => c.remove(r._key)} defaultOpen={openKey === r._key} hasError={c.hasError(r._key)}>
                <div className="@container grid gap-3.5 @md:grid-cols-2">
                  <TextField id={`${r._key}-t`} label={t(`extra.${k}.title`)} value={r.title} onChange={(title) => c.update(r._key, { title })} onBlur={() => c.touch(r._key, "title")} error={c.error(r._key, "title")} maxLength={160} />
                  <TextField id={`${r._key}-s`} label={t(`extra.${k}.subtitle`)} value={r.subtitle ?? ""} onChange={(subtitle) => c.update(r._key, { subtitle })} maxLength={160} optional />
                  <TextField id={`${r._key}-d`} label={t("date")} value={r.date ?? ""} onChange={(date) => c.update(r._key, { date })} maxLength={40} placeholder="2024" optional />
                  <TextField id={`${r._key}-u`} label={t("url")} dir="ltr" value={r.url ?? ""} onChange={(url) => c.update(r._key, { url })} onBlur={() => c.touch(r._key, "url")} error={c.error(r._key, "url")} placeholder="https://" optional />
                  <TextField className="@md:col-span-2" id={`${r._key}-desc`} label={t(`extra.${k}.description`)} multiline rows={3} maxLength={1500} value={r.description} onChange={(description) => c.update(r._key, { description })} optional />
                </div>
              </ItemCard>
            )}
          </SortableRow>
        ))}
      </SortableList>
      <AddButton label={te(`add.${k}`)} onClick={() => { const key = newKey(); setOpenKey(key); c.add({ ...emptyExtra(kind), _key: key }); }} />
    </div>
  );
}

function InterestAdder({ onAdd }: { onAdd: (title: string) => void }) {
  const t = useTranslations("cvEditor.fields");
  const [v, setV] = useState("");
  const add = () => {
    for (const s of v.split(",").map((x) => x.trim()).filter(Boolean)) onAdd(s.slice(0, 160));
    setV("");
  };
  return (
    <div className="flex gap-2">
      <Input dir="auto" value={v} placeholder={t("interestPlaceholder")} aria-label={t("interest")} onChange={(e) => setV(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); add(); } }} />
      <Button type="button" onClick={add} disabled={!v.trim()}><Plus /></Button>
    </div>
  );
}

export const SECTION_FORMS: Record<CvSectionKey, () => React.ReactNode> = {
  summary: () => <SummaryForm />,
  experience: () => <ExperienceForm />,
  education: () => <EducationForm />,
  skills: () => <SkillsForm />,
  projects: () => <ProjectsForm />,
  certifications: () => <CertificationsForm />,
  languages: () => <LanguagesForm />,
  awards: () => <ExtrasForm kind="AWARD" />,
  publications: () => <ExtrasForm kind="PUBLICATION" />,
  volunteer: () => <ExtrasForm kind="VOLUNTEER" />,
  interests: () => <ExtrasForm kind="INTEREST" />,
  references: () => <ExtrasForm kind="REFERENCE" />,
};
