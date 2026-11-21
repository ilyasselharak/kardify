"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export type SaveState = "saved" | "dirty" | "saving" | "invalid" | "error";

/**
 * Debounced autosave for editors. Saves run one at a time; edits made while a save is in
 * flight are saved right after it. Invalid states are never sent. Leaving the page with
 * unsaved changes asks for confirmation.
 */
export function useAutosave<T>({ value, save, isValid, delay = 1200, serialize = JSON.stringify }: {
  value: T;
  save: (value: T) => Promise<unknown>;
  isValid: (value: T) => boolean;
  delay?: number;
  serialize?: (value: T) => string;
}) {
  const [state, setState] = useState<SaveState>("saved");
  const [lastSavedAt, setLastSavedAt] = useState<Date>();
  const savedRef = useRef(serialize(value));
  const latest = useRef(value);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const inFlight = useRef<Promise<void> | null>(null);
  const saveRef = useRef(save);
  const validRef = useRef(isValid);

  useEffect(() => {
    latest.current = value;
    saveRef.current = save;
    validRef.current = isValid;
  });

  const run = useCallback(async (): Promise<boolean> => {
    clearTimeout(timer.current);
    if (inFlight.current) await inFlight.current;
    // Keep saving until the latest edits are stored (edits can arrive while a save is in flight).
    for (;;) {
      const current = latest.current;
      const json = serialize(current);
      if (json === savedRef.current) {
        setState("saved");
        return true;
      }
      if (!validRef.current(current)) {
        setState("invalid");
        return false;
      }
      setState("saving");
      let ok = true;
      const p = (async () => {
        try {
          await saveRef.current(current);
          savedRef.current = json;
          setLastSavedAt(new Date());
        } catch {
          ok = false;
        }
      })();
      inFlight.current = p;
      await p;
      inFlight.current = null;
      if (!ok) {
        setState("error");
        return false;
      }
    }
  }, [serialize]);

  const json = serialize(value);
  useEffect(() => {
    if (json === savedRef.current) return;
    setState(isValid(value) ? "dirty" : "invalid");
    clearTimeout(timer.current);
    timer.current = setTimeout(() => void run(), delay);
    return () => clearTimeout(timer.current);
    // `value` is represented by `json`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [json, delay, run]);

  const pending = state === "dirty" || state === "saving" || state === "invalid" || state === "error";
  useEffect(() => {
    if (!pending) return;
    const handler = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [pending]);

  /** Saves immediately (e.g. before publishing). Resolves false if invalid or failed. */
  const flush = useCallback(() => run(), [run]);

  /** Marks the given value as already saved (after a server-side change such as reset). */
  const markSaved = useCallback((v: T) => {
    savedRef.current = serialize(v);
    setState("saved");
  }, [serialize]);

  return { state, lastSavedAt, flush, markSaved };
}
