"use client";

import { Check } from "lucide-react";
import { useTranslations } from "next-intl";
import { useFormContext, useWatch } from "react-hook-form";
import { BusinessCardFront } from "@/components/cards/business-card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { formValuesToPreview } from "@/lib/card-form";
import { FONT_CLASS, templateDesign } from "@/lib/design/templates";
import {
  FONT_FAMILIES, FONT_SIZES, LAYOUTS, LOGO_POSITIONS, PHOTO_SHAPES, SOCIAL_ICON_STYLES, TEMPLATE_IDS, type CardFaceDesign, type DesignSettings,
} from "@/lib/design/types";
import type { CardFormValues } from "@/lib/validation/card";
import { cn } from "@/lib/utils";
import { ColorInput } from "./color-input";
import { OptionGroup } from "./option-group";
import { StepHeading } from "./step-heading";

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
          <div className="grid gap-2">
            <Label className="flex justify-between text-xs font-medium text-muted-foreground">
              {t("gradientAngle")} <span className="tabular-nums">{face.gradientAngle}°</span>
            </Label>
            <Slider min={0} max={360} step={5} value={[face.gradientAngle]} onValueChange={([v]) => onChange({ gradientAngle: v })} />
          </div>
        </>
      )}
      <ColorInput id={`${prefix}-text`} label={t("textColor")} value={face.textColor} onChange={(textColor) => onChange({ textColor })} />
    </div>
  );
}

export function StepDesign() {
  const t = useTranslations("wizard.design");
  const { control, setValue } = useFormContext<CardFormValues>();
  const values = useWatch({ control }) as CardFormValues;
  const design = values.designSettings;
  const preview = formValuesToPreview(values);

  const update = (patch: Partial<DesignSettings>) =>
    setValue("designSettings", { ...design, ...patch }, { shouldDirty: true, shouldValidate: true });
  const updateBack = (patch: Partial<DesignSettings["back"]>) => update({ back: { ...design.back, ...patch } });

  return (
    <div className="grid gap-6">
      <StepHeading title={t("title")} subtitle={t("subtitle")} />

      <div>
        <Label className="mb-3 block text-sm font-semibold">{t("templates")}</Label>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TEMPLATE_IDS.map((id) => {
            const active = design.template === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setValue("designSettings", templateDesign(id), { shouldDirty: true })}
                aria-pressed={active}
                className={cn("group relative grid gap-1.5 rounded-xl p-1.5 text-xs font-medium transition", active ? "bg-primary/5 ring-2 ring-primary" : "hover:bg-muted")}
              >
                <BusinessCardFront card={{ ...preview, name: preview.name || "Kardify", designSettings: templateDesign(id) }} className="pointer-events-none shadow-sm" />
                <span className={active ? "text-primary" : "text-muted-foreground"}>{t(`templateNames.${id}`)}</span>
                {active && (
                  <span className="absolute end-2.5 top-2.5 flex size-5 items-center justify-center rounded-full bg-primary text-white shadow">
                    <Check className="size-3" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <Tabs defaultValue="colors">
        <TabsList className="w-full overflow-x-auto">
          <TabsTrigger value="colors">{t("colors")}</TabsTrigger>
          <TabsTrigger value="typography">{t("typography")}</TabsTrigger>
          <TabsTrigger value="layout">{t("layout")}</TabsTrigger>
          <TabsTrigger value="back">{t("backSide")}</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="mt-5 grid gap-4">
          <ColorInput id="primary" label={t("primaryColor")} value={design.primaryColor} onChange={(primaryColor) => update({ primaryColor })} />
          <BackgroundEditor face={design} prefix="front" onChange={update} />
        </TabsContent>

        <TabsContent value="typography" className="mt-5 grid gap-5">
          <OptionGroup
            label={t("fontFamily")}
            columns={3}
            value={design.fontFamily}
            onChange={(fontFamily) => update({ fontFamily })}
            options={FONT_FAMILIES.map((f) => ({ value: f, label: t(`fonts.${f}`), preview: <span className={cn("text-lg", FONT_CLASS[f])}>{f === "cairo" || f === "tajawal" ? "أب" : "Aa"}</span> }))}
          />
          <OptionGroup label={t("fontSize")} value={design.fontSize} onChange={(fontSize) => update({ fontSize })} options={FONT_SIZES.map((s) => ({ value: s, label: t(`sizes.${s}`) }))} />
        </TabsContent>

        <TabsContent value="layout" className="mt-5 grid gap-5">
          <OptionGroup label={t("cardLayout")} columns={4} value={design.layout} onChange={(layout) => update({ layout })} options={LAYOUTS.map((l) => ({ value: l, label: t(`layouts.${l}`) }))} />
          <OptionGroup label={t("photoShape")} value={design.photoShape} onChange={(photoShape) => update({ photoShape })} options={PHOTO_SHAPES.map((s) => ({
            value: s,
            label: t(`shapes.${s}`),
            preview: <span className={cn("size-5 bg-current opacity-60", s === "circle" ? "rounded-full" : s === "rounded" ? "rounded-md" : "rounded-none")} />,
          }))} />
          <OptionGroup label={t("logoPosition")} columns={4} value={design.logoPosition} onChange={(logoPosition) => update({ logoPosition })} options={LOGO_POSITIONS.map((p) => ({ value: p, label: t(`logoPositions.${p}`) }))} />
          <OptionGroup label={t("socialIconStyle")} value={design.socialIconStyle} onChange={(socialIconStyle) => update({ socialIconStyle })} options={SOCIAL_ICON_STYLES.map((s) => ({ value: s, label: t(`iconStyles.${s}`) }))} />
          <div className="grid gap-2">
            <Label className="flex justify-between text-xs font-medium text-muted-foreground">
              {t("borderRadius")} <span className="tabular-nums">{design.borderRadius}px</span>
            </Label>
            <Slider min={0} max={40} step={1} value={[design.borderRadius]} onValueChange={([v]) => update({ borderRadius: v })} />
          </div>
        </TabsContent>

        <TabsContent value="back" className="mt-5 grid gap-4">
          <BackgroundEditor face={design.back} prefix="back" onChange={updateBack} />
          <label className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 text-sm">
            {t("showQr")}
            <Switch checked={design.back.showQr} onCheckedChange={(showQr) => updateBack({ showQr })} />
          </label>
          <div className="grid gap-1.5">
            <Label htmlFor="tagline" className="text-xs font-medium text-muted-foreground">{t("tagline")}</Label>
            <Input id="tagline" dir="auto" maxLength={120} placeholder={t("taglinePlaceholder")} value={design.back.tagline} onChange={(e) => updateBack({ tagline: e.target.value })} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
