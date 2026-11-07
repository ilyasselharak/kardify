import { api, apiUrl } from "@/lib/api/client";
import type { EventType } from "@/lib/api/types";

/** Analytics event; never throws. Uses keepalive so it survives navigation. Resolves when sent. */
export async function trackEvent(slug: string, eventType: Exclude<EventType, "CONTACT_DOWNLOAD" | "APPLE_WALLET_ADD" | "GOOGLE_WALLET_ADD">, meta?: string) {
  try {
    await fetch(`/api/public/cards/${encodeURIComponent(slug)}/analytics`, {
      method: "POST",
      keepalive: true,
      credentials: "same-origin",
      headers: { "Content-Type": "application/json", "x-kardify-csrf": "1" },
      body: JSON.stringify({ eventType, meta, referrer: document.referrer || undefined }),
    });
  } catch {
    /* analytics must never break the page */
  }
}

export const vcardUrl = (slug: string) => apiUrl(`/public/cards/${encodeURIComponent(slug)}/vcard`);
export const publicQrUrl = (slug: string, format: "png" | "svg", download = false) =>
  apiUrl(`/public/cards/${encodeURIComponent(slug)}/qr`, { format, ...(download ? { download: 1 } : {}) });
export const ownerQrUrl = (cardId: string, query: Record<string, string | number | undefined>) => apiUrl(`/cards/${cardId}/qr`, query);
export const appleWalletUrl = (publicId: string) => apiUrl(`/wallet/apple/${encodeURIComponent(publicId)}`);

export async function googleWalletSaveUrl(publicId: string) {
  const { saveUrl } = await api.get<{ saveUrl: string }>(`/wallet/google/${encodeURIComponent(publicId)}`);
  return saveUrl;
}

export function whatsappChatUrl(number: string) {
  return `https://wa.me/${number.replace(/[^\d]/g, "")}`;
}

export function telUrl(number: string) {
  return `tel:${number.replace(/[^\d+]/g, "")}`;
}

export function mapsUrlFor(address: string | null, mapsUrl: string | null) {
  return mapsUrl ?? (address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null);
}

/** Uses the native share sheet when available; returns false if unsupported or cancelled. */
export async function nativeShare(data: { title: string; text: string; url: string }) {
  if (typeof navigator === "undefined" || !navigator.share) return false;
  try {
    await navigator.share(data);
    return true;
  } catch {
    return false;
  }
}

export async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.select();
    const ok = document.execCommand("copy");
    el.remove();
    return ok;
  }
}

/** Downloads a same-origin URL as a file (keeps cookies, works for QR/vCard). */
export async function downloadFromUrl(url: string, filename: string) {
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`Download failed (${res.status})`);
  const blob = await res.blob();
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 1000);
}
