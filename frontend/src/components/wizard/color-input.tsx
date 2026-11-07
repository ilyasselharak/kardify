"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Native colour picker + hex text field kept in sync. */
export function ColorInput({ id, label, value, onChange }: { id: string; label: string; value: string; onChange: (hex: string) => void }) {
  // Local draft only while the user is typing; otherwise always show the controlled value.
  const [draft, setDraft] = useState<string | null>(null);
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-xs font-medium text-muted-foreground">{label}</Label>
      <div className="flex h-10 items-center gap-2 rounded-lg border border-input bg-card px-1.5 shadow-xs focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20">
        <input
          type="color"
          aria-label={label}
          value={HEX.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          className="size-7 shrink-0 cursor-pointer rounded-md border-0 bg-transparent p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border [&::-webkit-color-swatch]:border-black/10 [&::-moz-color-swatch]:rounded-md [&::-moz-color-swatch]:border-black/10 [&::-webkit-color-swatch-wrapper]:p-0"
        />
        <Input
          id={id}
          dir="ltr"
          value={draft ?? value}
          maxLength={7}
          spellCheck={false}
          className="h-8 border-0 px-1 font-mono text-xs uppercase shadow-none focus-visible:ring-0"
          onChange={(e) => {
            const v = e.target.value.startsWith("#") ? e.target.value : `#${e.target.value}`;
            setDraft(v);
            if (HEX.test(v)) onChange(v.toLowerCase());
          }}
          onBlur={() => setDraft(null)}
        />
      </div>
    </div>
  );
}
