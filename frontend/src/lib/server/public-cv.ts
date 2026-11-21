import "server-only";
import { cache } from "react";
import type { CvDocument, PublicCv } from "@/lib/cv/types";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:4000";

/**
 * Public CV for SSR. Deliberately NOT cached (no "use cache", `no-store`): visibility changes
 * (private, link disabled) must take effect on the very next request. `cache()` only dedupes the
 * metadata + page fetch within one request.
 */
export const getPublicCv = cache(async (slug: string): Promise<PublicCv | null> => {
  if (!/^[a-z0-9-]{3,60}$/.test(slug)) return null;
  const res = await fetch(`${BACKEND_URL}/api/public/cvs/${encodeURIComponent(slug)}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  }).catch(() => null);
  if (!res || res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load CV (${res.status})`);
  return (await res.json()) as PublicCv;
});

/** Document for the PDF print route, authorised by a short-lived render token. */
export async function getRenderDocument(token: string): Promise<CvDocument | null> {
  if (!token || token.length > 2000) return null;
  const res = await fetch(`${BACKEND_URL}/api/cv-render/${encodeURIComponent(token)}`, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  }).catch(() => null);
  if (!res || !res.ok) return null;
  return (await res.json()) as CvDocument;
}
