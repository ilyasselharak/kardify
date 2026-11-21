"use client";

import { ImageIcon, LayoutTemplate, Palette, PanelsTopLeft, RectangleHorizontal, Shapes, Type } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { ColorInput } from "@/components/wizard/color-input";
import { ImageUpload } from "@/components/wizard/image-upload";
import { OptionGroup } from "@/components/wizard/option-group";
import { FONT_CLASS, switchTemplate } from "@/lib/design/templates";
import {
  BACK_LAYOUTS, CONTACT_ICON_STYLES, FONT_FAMILIES, FONT_SIZES, LAYOUTS, LOGO_POSITIONS, PATTERNS, PHOTO_SHAPES, SOCIAL_ICON_STYLES,
  type CardFaceDesign, type DesignSettings,
} from "@/lib/design/types";
import type { CardFormValues } from "@/lib/validation/card";
import { cn } from "@/lib/utils";
import { CardTemplateGallery } from "./card-template-gallery";
import { PanelSection } from "./panel-section";

function BackgroundEditor({ face, onChange, prefix }: { face: CardFaceDesign; onChange: (patch: Partial<CardFaceDesign>) => void; prefix: string }) {
  const t = useTranslations("wizard.design");
  return (
    <div className="grid gap-4">
      <OptionGroup
        label={t("background")}
        value={face.backgroundType}
        onChange={(backgroundType) => onChange({ backgroundType })}
        options={[{ value: "solid", label: t("solid") }, { value: "gradient", label: t("gradient") }]}
      />
      {face.backgroundType === "solid" ? (
        <ColorInput id={`${prefix}-bg`} label={t("backgroundColor")} value={face.backgroundColor} onChange={(backgroundColor) => onChange({ backgroundColor, gradientFrom: backgroundColor })} />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3">
            <ColorInput id={`${prefix}-from`} label={t("gradientFrom")} value={face.gradientFrom} onChange={(gradientFrom) => onChange({ gradientFrom, backgroundColor: gradientFrom })} />
            <ColorInput id={`${prefix}-to`} label={t("gradientTo")} value={face.gradientTo} onChange={(gradientTo) => onChange({ gradientTo })} />
          </div>
          <SliderField label={t("gradientAngle")} value={face.gradientAngle} suffix="°" min={0} max={360} step={5} onChange={(gradientAngle) => onChange({ gradientAngle })} />
        </>
      )}
      <ColorInput id={`${prefix}-text`} label={t("textColor")} value={face.textColor} onChange={(textColor) => onChange({ textColor })} />
    </div>
  );
}

function SliderField({ label, value, suffix, min, max, step, onChange }: { label: string; value: number; suffix: string; min: number; max: number; step: number; onChange: (v: number) => void }) {
  return (
    <div className="grid gap-2">
      <Label className="flex justify-between text-xs font-medium text-muted-foreground">
        {label} <span className="tabular-nums">{value}{suffix}</span>
      </Label>
      <Slider min={min} max={max} step={step} value={[value]} onValueChange={([v]) => onChange(v)} aria-label={label} />
    </div>
  );
}

/** Left editor panel: template library + every visual customisation. */
export function CardDesignPanel() {
  const t = useTranslations("wizard.design");
  const te = useTranslations("editor");
  const { control, setValue } = useFormContext<CardFormValues>();
  const values = useWatch({ control }) as CardFormValues;
  const design = values.designSettings;

  const set = (next: DesignSettings) => setValue("designSettings", next, { shouldDirty: true, shouldValidate: true });
  const update = (patch: Partial<DesignSettings>) => set({ ...design, ...patch });
  const updateBack = (patch: Partial<DesignSettings["back"]>) => update({ back: { ...design.back, ...patch } });

  return (
    <div className="grid">
      <PanelSection title={te("templates")} icon={LayoutTemplate} defaultOpen>
        <CardTemplateGallery
          value={design.template}
          onSelect={(id) => set(switchTemplate(design, id))}
          sample={{
            name: values.name || "Kardify",
            jobTitle: values.jobTitle,
            companyName: values.companyName,
            profileImage: values.profileImage,
            companyLogo: values.companyLogo,
            email: values.email,
            phone: values.phone,
            website: values.website,
          }}
        />
      </PanelSection>

      <PanelSection title={t("colors")} icon={Palette} defaultOpen>
        <div className="grid gap-4">
          <div className="grid grid-cols-2 gap-3">
            <ColorInput id="primary" label={t("primaryColor")} value={design.primaryColor} onChange={(primaryColor) => update({ primaryColor })} />
            <ColorInput id="secondary" label={te("secondaryColor")} value={design.secondaryColor} onChange={(secondaryColor) => update({ secondaryColor })} />
          </div>
          <BackgroundEditor face={design} prefix="front" onChange={update} />
        </div>
      </PanelSection>

      <PanelSection title={te("backgroundImage")} icon={ImageIcon}>
        <div className="grid gap-4">
          <ImageUpload label={te("backgroundImage")} purpose="background" shape="square" value={design.backgroundImage} onChange={(backgroundImage) => update({ backgroundImage })} />
          {design.backgroundImage && (
            <SliderField label={te("overlay")} value={design.backgroundOverlay} suffix="%" min={0} max={90} step={5} onChange={(backgroundOverlay) => update({ backgroundOverlay })} />
          )}
          <OptionGroup
            label={te("pattern")}
            columns={3}
            value={design.pattern}
            onChange={(pattern) => update({ pattern })}
            options={PATTERNS.map((p) => ({ value: p, label: te(`patterns.${p}`) }))}
          />
        </div>
      </PanelSection>

      <PanelSection title={t("typography")} icon={Type}>
        <div className="grid gap-5">
          <OptionGroup
            label={t("fontFamily")}
            columns={3}
            value={design.fontFamily}
            onChange={(fontFamily) => update({ fontFamily })}
            options={FONT_FAMILIES.map((f) => ({ value: f, label: t(`fonts.${f}`), preview: <span className={cn("text-lg", FONT_CLASS[f])}>{f === "cairo" || f === "tajawal" ? "أب" : "Aa"}</span> }))}
          />
          <OptionGroup label={t("fontSize")} value={design.fontSize} onChange={(fontSize) => update({ fontSize })} options={FONT_SIZES.map((s) => ({ value: s, label: t(`sizes.${s}`) }))} />
        </div>
      </PanelSection>

      <PanelSection title={t("layout")} icon={PanelsTopLeft}>
        <div className="grid gap-5">
          <OptionGroup label={t("cardLayout")} columns={2} value={design.layout} onChange={(layout) => update({ layout })} options={LAYOUTS.map((l) => ({ value: l, label: t(`layouts.${l}`) }))} />
          <OptionGroup label={t("photoShape")} value={design.photoShape} onChange={(photoShape) => update({ photoShape })} options={PHOTO_SHAPES.map((s) => ({
            value: s,
            label: t(`shapes.${s}`),
            preview: <span className={cn("size-5 bg-current opacity-60", s === "circle" ? "rounded-full" : s === "rounded" ? "rounded-md" : "rounded-none")} />,
          }))} />
          <OptionGroup label={t("logoPosition")} columns={2} value={design.logoPosition} onChange={(logoPosition) => update({ logoPosition })} options={LOGO_POSITIONS.map((p) => ({ value: p, label: t(`logoPositions.${p}`) }))} />
          <SliderField label={t("borderRadius")} value={design.borderRadius} suffix="px" min={0} max={40} step={1} onChange={(borderRadius) => update({ borderRadius })} />
        </div>
      </PanelSection>

      <PanelSection title={te("icons")} icon={Shapes}>
        <div className="grid gap-5">
          <OptionGroup label={t("socialIconStyle")} value={design.socialIconStyle} onChange={(socialIconStyle) => update({ socialIconStyle })} options={SOCIAL_ICON_STYLES.map((s) => ({ value: s, label: t(`iconStyles.${s}`) }))} />
          <OptionGroup label={te("contactIcons")} value={design.contactIconStyle} onChange={(contactIconStyle) => update({ contactIconStyle })} options={CONTACT_ICON_STYLES.map((s) => ({ value: s, label: te(`contactIconStyles.${s}`) }))} />
        </div>
      </PanelSection>

      <PanelSection title={t("backSide")} icon={RectangleHorizontal}>
        <div className="grid gap-4">
          <OptionGroup label={te("backLayout")} columns={2} value={design.back.layout} onChange={(layout) => updateBack({ layout })} options={BACK_LAYOUTS.map((l) => ({ value: l, label: te(`backLayouts.${l}`) }))} />
          <BackgroundEditor face={design.back} prefix="back" onChange={updateBack} />
          <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm">
            {t("showQr")}
            <Switch checked={design.back.showQr} onCheckedChange={(showQr) => updateBack({ showQr })} />
          </label>
          <div className="grid gap-1.5">
            <Label htmlFor="tagline" className="text-xs font-medium text-muted-foreground">{t("tagline")}</Label>
            <Input id="tagline" dir="auto" maxLength={120} placeholder={t("taglinePlaceholder")} value={design.back.tagline} onChange={(e) => updateBack({ tagline: e.target.value })} />
          </div>
        </div>
      </PanelSection>
    </div>
  );
}
