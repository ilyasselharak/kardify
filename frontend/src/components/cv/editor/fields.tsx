"use client";

import { closestCenter, DndContext, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, ChevronDown, GripVertical, Trash2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useId, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

/** Shows an error only after the field was left once (or when `force` is set). */
export function useTouched() {
  const [touched, setTouched] = useState<Set<string>>(() => new Set());
  return {
    touched,
    touch: (path: string) => setTouched((s) => (s.has(path) ? s : new Set(s).add(path))),
  };
}

export function FieldError({ error }: { error?: string }) {
  const t = useTranslations("validation");
  if (!error) return null;
  return <p role="alert" className="text-xs font-medium text-destructive">{t(error as never)}</p>;
}

export function TextField({ id, label, value, onChange, onBlur, error, placeholder, multiline, rows = 3, maxLength, dir = "auto", hint, type, optional, className }: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onBlur?: () => void;
  error?: string;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
  maxLength?: number;
  dir?: "auto" | "ltr";
  hint?: string;
  type?: string;
  optional?: boolean;
  className?: string;
}) {
  const tc = useTranslations("common");
  const common = { id, value, placeholder, maxLength, dir, onBlur, "aria-invalid": !!error, onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => onChange(e.target.value) };
  return (
    <div className={cn("grid gap-1.5", className)}>
      <Label htmlFor={id} className="flex items-baseline justify-between gap-2 text-xs font-medium text-muted-foreground">
        <span>{label}{optional && <span className="ms-1 font-normal opacity-70">({tc("optional")})</span>}</span>
        {multiline && maxLength && <span className="tabular-nums opacity-70">{value.length}/{maxLength}</span>}
      </Label>
      {multiline ? <Textarea rows={rows} {...common} /> : <Input type={type} {...common} />}
      {hint && !error && <p className="text-xs text-muted-foreground">{hint}</p>}
      <FieldError error={error} />
    </div>
  );
}

const selectCls = "h-10 w-full rounded-lg border border-input bg-card px-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/20 disabled:opacity-50";

export function SelectField<T extends string>({ id, label, value, options, onChange, placeholder }: {
  id: string;
  label: string;
  value: T | "" | null;
  options: { value: T; label: string }[];
  onChange: (v: T | "") => void;
  placeholder?: string;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</Label>
      <select id={id} className={selectCls} value={value ?? ""} onChange={(e) => onChange(e.target.value as T | "")}>
        {placeholder !== undefined && <option value="">{placeholder}</option>}
        {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

/** Month + year selects producing YYYY-MM (works in every browser, unlike <input type="month">). */
export function MonthField({ id, label, value, onChange, onBlur, disabled, error }: {
  id: string;
  label: string;
  value: string | null;
  onChange: (v: string | null) => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("cvEditor");
  const [y, m] = value ? value.split("-") : ["", ""];
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => new Intl.DateTimeFormat(locale, { month: "short", timeZone: "UTC" }).format(new Date(Date.UTC(2020, i, 1)))),
    [locale],
  );
  const thisYear = new Date().getFullYear();
  const years = Array.from({ length: 70 }, (_, i) => String(thisYear + 6 - i));
  const set = (year: string, month: string) => {
    if (!year && !month) return onChange(null);
    onChange(`${year || String(thisYear)}-${month || "01"}`);
  };
  return (
    <fieldset className="grid gap-1.5" disabled={disabled} onBlur={onBlur}>
      <legend className="mb-1.5 text-xs font-medium text-muted-foreground">{label}</legend>
      <div className="grid grid-cols-[1fr_1.1fr] gap-2">
        <select id={id} aria-label={`${label} – ${t("month")}`} className={selectCls} value={m} onChange={(e) => set(y, e.target.value)}>
          <option value="">{t("month")}</option>
          {months.map((name, i) => <option key={i} value={String(i + 1).padStart(2, "0")}>{name}</option>)}
        </select>
        <select aria-label={`${label} – ${t("year")}`} className={selectCls} value={y} onChange={(e) => set(e.target.value, m)}>
          <option value="">{t("year")}</option>
          {years.map((yr) => <option key={yr} value={yr}>{yr}</option>)}
        </select>
      </div>
      <FieldError error={error} />
    </fieldset>
  );
}

// ─── Sortable lists ────────────────────────────────────────────────────

export function useDndSensors() {
  return useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );
}

export function SortableList<T extends { id: string }>({ items, onMove, children }: {
  items: T[];
  onMove: (from: number, to: number) => void;
  children: React.ReactNode;
}) {
  const sensors = useDndSensors();
  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    onMove(items.findIndex((i) => i.id === active.id), items.findIndex((i) => i.id === over.id));
  };
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        {children}
      </SortableContext>
    </DndContext>
  );
}

/** Drag handle + content; exposes the sortable bindings to its children. */
export function SortableRow({ id, children, className }: { id: string; children: (handle: React.ReactNode) => React.ReactNode; className?: string }) {
  const t = useTranslations("cvEditor");
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id });
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={t("dragToReorder")}
      className="flex size-7 shrink-0 cursor-grab touch-none items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
    >
      <GripVertical className="size-4" />
    </button>
  );
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn("relative", isDragging && "z-10 opacity-90 shadow-lifted", className)}
    >
      {children(handle)}
    </div>
  );
}

/** Collapsible item card used by every repeatable CV entry. */
export function ItemCard({ title, subtitle, handle, index, count, onMove, onRemove, defaultOpen, hasError, children }: {
  title: string;
  subtitle?: string;
  handle: React.ReactNode;
  index: number;
  count: number;
  onMove: (from: number, to: number) => void;
  onRemove: () => void;
  defaultOpen?: boolean;
  hasError?: boolean;
  children: React.ReactNode;
}) {
  const t = useTranslations("cvEditor");
  const [open, setOpen] = useState(!!defaultOpen);
  const bodyId = useId();
  return (
    <div className={cn("rounded-xl border bg-card transition", hasError ? "border-destructive/40" : "border-border", open && "shadow-soft")}>
      <div className="flex items-center gap-1 px-1.5 py-1.5">
        {handle}
        <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} aria-controls={bodyId} className="flex min-w-0 flex-1 items-center gap-2 rounded-md px-1.5 py-1 text-start">
          <span className="min-w-0 flex-1">
            <span dir="auto" className={cn("block truncate text-sm font-medium", !title && "text-muted-foreground italic")}>{title || t("untitled")}</span>
            {subtitle && <span dir="auto" className="block truncate text-xs text-muted-foreground">{subtitle}</span>}
          </span>
          <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
        </button>
        <div className="flex shrink-0 items-center">
          <button type="button" onClick={() => onMove(index, index - 1)} disabled={index === 0} aria-label={t("moveUp")} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30">
            <ArrowUp className="size-3.5" />
          </button>
          <button type="button" onClick={() => onMove(index, index + 1)} disabled={index === count - 1} aria-label={t("moveDown")} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted disabled:opacity-30">
            <ArrowDown className="size-3.5" />
          </button>
          <button type="button" onClick={onRemove} aria-label={t("removeItem")} className="flex size-7 items-center justify-center rounded-md text-muted-foreground hover:bg-destructive/10 hover:text-destructive">
            <Trash2 className="size-3.5" />
          </button>
        </div>
      </div>
      <div id={bodyId} hidden={!open} className="border-t border-border p-3.5">
        {open && <div className="grid gap-3.5">{children}</div>}
      </div>
    </div>
  );
}
