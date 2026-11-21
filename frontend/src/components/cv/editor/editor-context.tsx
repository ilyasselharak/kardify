"use client";

import { createContext, useContext } from "react";
import type { CvDraft, ItemCollection, Keyed, ProfileForm } from "@/lib/cv/draft";

export interface CvEditorApi {
  draft: CvDraft;
  setDraft: (fn: (d: CvDraft) => CvDraft) => void;
  profile: ProfileForm;
  setProfile: (patch: Partial<ProfileForm>) => void;
  errors: Record<string, string>;
  profileErrors: Record<string, string>;
  /** Show every error (after a failed save / export attempt), not only touched fields. */
  showAll: boolean;
  touched: Set<string>;
  touch: (path: string) => void;
}

export const CvEditorContext = createContext<CvEditorApi | null>(null);

export function useCvEditor() {
  const ctx = useContext(CvEditorContext);
  if (!ctx) throw new Error("useCvEditor must be used inside the CV editor");
  return ctx;
}

/** Helpers for one repeatable collection (experiences, skills, …). */
export function useCollection<C extends ItemCollection>(col: C) {
  const { draft, setDraft, errors, showAll, touched, touch } = useCvEditor();
  type Row = CvDraft[C][number];
  const rows = draft[col] as Row[];
  return {
    rows,
    update: (key: string, patch: Partial<Row>) =>
      setDraft((d) => ({ ...d, [col]: (d[col] as Keyed<object>[]).map((r) => (r._key === key ? { ...r, ...patch } : r)) })),
    add: (row: Row) => setDraft((d) => ({ ...d, [col]: [...(d[col] as Row[]), row] })),
    remove: (key: string) => setDraft((d) => ({ ...d, [col]: (d[col] as Keyed<object>[]).filter((r) => r._key !== key) })),
    setAll: (next: Row[]) => setDraft((d) => ({ ...d, [col]: next })),
    /** Error for a field, shown once touched (or when everything is being shown). */
    error: (key: string, field: string) => {
      const path = `${col}.${key}.${field}`;
      return showAll || touched.has(path) ? errors[path] : undefined;
    },
    hasError: (key: string) => Object.keys(errors).some((k) => k.startsWith(`${col}.${key}.`)),
    touch: (key: string, field: string) => touch(`${col}.${key}.${field}`),
  };
}
