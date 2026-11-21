"use client";

import { Check, Languages, LayoutTemplate, Palette, Ruler, Type } from "lucide-react";
import { useTranslations } from "next-intl";
import { memo } from "react";
import { CvPaged } from "@/components/cv/render/cv-document";
import { PanelSection } from "@/components/editor/panel-section";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ColorInput } from "@/components/wizard/color-input";
import { OptionGroup } from "@/components/wizard/option-group";
import { sampleCvDocument } from "@/lib/cv/document";
import { CV_TEMPLATES, normalizeCvDesign } from "@/lib/cv/templates";
import {
  CV_DATE_FORMATS, CV_FONT_SCALES, CV_FONTS, CV_MARGINS, CV_SKILL_STYLES, CV_SPACINGS, CV_TEMPLATE_IDS, type CvDesign, type CvLang, type CvTemplateId,
} from "@/lib/cv/types";
import { cn } from "@/lib/utils";
import { useCvEditor } from "./editor-context";

/** Page-1 thumbnail of a template filled with sample content. */
export const CvTemplateThumb = memo(function CvTemplateThumb({ id, lang, width = 150 }: { id: CvTemplateId; lang: CvLang; width?: number }) {
  return (
    <div className="pointer-events-none overflow-hidden rounded-md ring-1 ring-border" style={{ width, height: width * 1.414 }}>
      <CvPaged doc={{ ...sampleCvDocument(lang), template: id }} zoom={width / 794} maxPages={1} links={false} />
    </div>
  );
});

export function CvTemplatePicker({ value, lang, onSelect, columns = 2, thumb = 130 }: { value?: CvTemplateId; lang: CvLang; onSelect: (id: CvTemplateId) => void; columns?: number; thumb?: number }) {
  const t = useTranslations("templates");
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {CV_TEMPLATE_IDS.map((id) => {
        const active = value === id;
        return (
          <button key={id} type="button" aria-pressed={active} onClick={() => onSelect(id)} className={cn("relative grid justify-items-center gap-1.5 rounded-xl p-2 text-xs font-medium transition", active ? "bg-primary/5 ring-2 ring-primary" : "hover:bg-muted")}>
            <CvTemplateThumb id={id} lang={lang} width={thumb} />
            <span className="flex w-full items-center justify-between gap-1">
              <span className={active ? "text-primary" : ""}>{t(`cvNames.${id}`)}</span>
              {CV_TEMPLATES[id].ats && <span className="rounded bg-success/10 px-1 text-[10px] font-semibold text-success">ATS</span>}
            </span>
            {active && <span className="absolute end-3 top-3 flex size-5 items-center justify-center rounded-full bg-primary text-white shadow"><Check className="size-3" /></span>}
          </button>
        );
      })}
    </div>
  );
}

/** Right panel: template, colours, typography, spacing and page settings. */
export function CvDesignPanel() {
  const t = useTranslations("cvEditor.design");
  const tc = useTranslations("common");
  const { draft, setDraft } = useCvEditor();
  const design = normalizeCvDesign(draft.template, draft.design, draft.language);
  const set = (patch: Partial<CvDesign>) => setDraft((d) => ({ ...d, design: { ...d.design, ...patch } }));

  const switchTemplate = (id: CvTemplateId) =>
    setDraft((d) => ({
      ...d,
      template: id,
      // Keep page-level preferences; take the new template's look (colours, fonts, skill style).
      design: Object.fromEntries(
        Object.entries(d.design).filter(([k]) => ["fontScale", "spacing", "margins", "dateFormat", "showPhoto", "showIcons"].includes(k)),
      ) as Partial<CvDesign>,
    }));

  return (
    <div className="grid">
      <PanelSection title={t("template")} icon={LayoutTemplate} defaultOpen>
        <CvTemplatePicker value={draft.template} lang={draft.language} onSelect={switchTemplate} />
        <p className="mt-3 text-xs text-muted-foreground">{t("atsHint")}</p>
      </PanelSection>

      <PanelSection title={t("language")} icon={Languages} defaultOpen>
        <Tabs value={draft.language} onValueChange={(v) => setDraft((d) => ({ ...d, language: v as CvLang }))}>
          <TabsList className="w-full">
            <TabsTrigger value="en" className="flex-1">{tc("english")}</TabsTrigger>
            <TabsTrigger value="ar" className="flex-1">{tc("arabic")}</TabsTrigger>
          </TabsList>
        </Tabs>
        <p className="mt-2 text-xs text-muted-foreground">{t("languageHint")}</p>
      </PanelSection>

      <PanelSection title={t("colors")} icon={Palette} defaultOpen>
        <div className="grid grid-cols-2 gap-3">
          <ColorInput id="cv-accent" label={t("accent")} value={design.accentColor} onChange={(accentColor) => set({ accentColor })} />
          <ColorInput id="cv-text" label={t("text")} value={design.textColor} onChange={(textColor) => set({ textColor })} />
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          {["#006afe", "#0d1e37", "#0f766e", "#7c3aed", "#b91c1c", "#a67c52", "#111827", "#c2410c"].map((c) => (
            <button key={c} type="button" onClick={() => set({ accentColor: c })} aria-label={c} className={cn("size-7 rounded-full ring-offset-2 transition", design.accentColor === c && "ring-2 ring-primary")} style={{ background: c }} />
          ))}
        </div>
      </PanelSection>

      <PanelSection title={t("typography")} icon={Type}>
        <div className="grid gap-4">
          <FontSelect id="cv-font" label={t("bodyFont")} value={design.fontFamily} onChange={(fontFamily) => set({ fontFamily })} />
          <FontSelect id="cv-hfont" label={t("headingFont")} value={design.headingFont} onChange={(headingFont) => set({ headingFont })} />
          <OptionGroup label={t("fontSize")} value={design.fontScale} onChange={(fontScale) => set({ fontScale })} options={CV_FONT_SCALES.map((v) => ({ value: v, label: t(`sizes.${v}`) }))} />
        </div>
      </PanelSection>

      <PanelSection title={t("layout")} icon={Ruler}>
        <div className="grid gap-4">
          <OptionGroup label={t("spacing")} value={design.spacing} onChange={(spacing) => set({ spacing })} options={CV_SPACINGS.map((v) => ({ value: v, label: t(`spacings.${v}`) }))} />
          <OptionGroup label={t("margins")} value={design.margins} onChange={(margins) => set({ margins })} options={CV_MARGINS.map((v) => ({ value: v, label: t(`marginOptions.${v}`) }))} />
          <OptionGroup label={t("skillStyle")} value={design.skillStyle} onChange={(skillStyle) => set({ skillStyle })} options={CV_SKILL_STYLES.map((v) => ({ value: v, label: t(`skillStyles.${v}`) }))} />
          <OptionGroup label={t("dateFormat")} value={design.dateFormat} onChange={(dateFormat) => set({ dateFormat })} options={CV_DATE_FORMATS.map((v) => ({ value: v, label: t(`dateFormats.${v}`) }))} />
          <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm">
            {t("showPhoto")}
            <Switch checked={design.showPhoto} onCheckedChange={(showPhoto) => set({ showPhoto })} />
          </label>
          <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm">
            {t("showIcons")}
            <Switch checked={design.showIcons} onCheckedChange={(showIcons) => set({ showIcons })} />
          </label>
          <p className="text-xs text-muted-foreground">{t("pageHint")}</p>
        </div>
      </PanelSection>
    </div>
  );
}

function FontSelect({ id, label, value, onChange }: { id: string; label: string; value: CvDesign["fontFamily"]; onChange: (v: CvDesign["fontFamily"]) => void }) {
  const t = useTranslations("wizard.design.fonts");
  return (
    <div className="grid gap-1.5">
      <label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</label>
      <select id={id} value={value} onChange={(e) => onChange(e.target.value as CvDesign["fontFamily"])} className="h-10 rounded-lg border border-input bg-card px-2.5 text-sm">
        {CV_FONTS.map((f) => <option key={f} value={f}>{t(f)}</option>)}
      </select>
    </div>
  );
}
