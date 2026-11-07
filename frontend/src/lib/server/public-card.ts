import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import type { PublicCard } from "@/lib/api/types";

const BACKEND_URL = process.env.BACKEND_INTERNAL_URL ?? "http://localhost:4000";

/**
 * Fetches a published card for SSR/SEO. Cached briefly here; the API also caches in Redis
 * and invalidates its cache whenever the owner edits the card.
 */
export async function getPublicCard(slug: string): Promise<PublicCard | null> {
  "use cache";
  cacheLife({ stale: 30, revalidate: 30, expire: 300 });
  cacheTag(`public-card:${slug}`);
  if (!/^[a-z0-9-]{3,160}$/.test(slug)) return null;
  const res = await fetch(`${BACKEND_URL}/api/public/cards/${encodeURIComponent(slug)}`, {
    headers: { Accept: "application/json" },
  }).catch(() => null);
  if (!res || res.status === 404) return null;
  if (!res.ok) throw new Error(`Failed to load card (${res.status})`);
  return (await res.json()) as PublicCard;
}
