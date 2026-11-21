"use client";

import { Building2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDeferredValue, useId, useState } from "react";
import { Input } from "@/components/ui/input";
import { useCompanySuggestions } from "@/lib/hooks/use-cards";
import { cn } from "@/lib/utils";

/**
 * Text input with a dropdown of existing company names, so the same company is spelled the same
 * way on every card (admins filter cards by company). Free text is still allowed for new companies.
 */
export function CompanyInput({ id, value, onChange, onBlur, placeholder, invalid, maxLength = 120, className }: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  invalid?: boolean;
  maxLength?: number;
  className?: string;
}) {
  const t = useTranslations("company");
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const query = useDeferredValue(value.trim());
  const { data = [] } = useCompanySuggestions(query, open);
  const options = data.filter((name) => name.toLowerCase() !== value.trim().toLowerCase()).slice(0, 8);
  const show = open && options.length > 0;

  const pick = (name: string) => {
    onChange(name);
    setOpen(false);
    setActive(-1);
  };

  return (
    <div className={cn("relative", className)}>
      <Input
        id={id}
        dir="auto"
        role="combobox"
        autoComplete="off"
        aria-autocomplete="list"
        aria-expanded={show}
        aria-controls={listId}
        aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined}
        aria-invalid={invalid}
        maxLength={maxLength}
        placeholder={placeholder}
        value={value}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onBlur={() => {
          setOpen(false);
          onBlur?.();
        }}
        onKeyDown={(e) => {
          if (!show) {
            if (e.key === "ArrowDown") setOpen(true);
            return;
          }
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((i) => (i + 1) % options.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
          } else if (e.key === "Enter" && active >= 0) {
            e.preventDefault();
            pick(options[active]);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />
      {show && (
        <ul
          id={listId}
          role="listbox"
          aria-label={t("suggestions")}
          className="absolute inset-x-0 top-full z-40 mt-1 max-h-64 overflow-y-auto rounded-lg border border-border bg-popover p-1 shadow-lifted"
        >
          <li role="presentation" className="px-2.5 pt-1.5 pb-1 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">
            {t("existing")}
          </li>
          {options.map((name, i) => (
            <li
              key={name}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === active}
              // mousedown (not click) so the input keeps focus until the choice is applied
              onMouseDown={(e) => {
                e.preventDefault();
                pick(name);
              }}
              onMouseEnter={() => setActive(i)}
              className={cn("flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm", i === active ? "bg-primary/10 text-primary" : "hover:bg-muted")}
            >
              <Building2 className="size-4 shrink-0 opacity-60" />
              <span dir="auto" className="truncate">{name}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
