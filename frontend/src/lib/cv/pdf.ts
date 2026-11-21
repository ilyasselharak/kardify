import { ApiError } from "@/lib/api/client";

/**
 * Downloads a server-rendered PDF. Fetching first (instead of navigating) lets the UI show a
 * proper error message when rendering fails or downloads are disabled.
 */
export async function downloadPdf(url: string, fallbackName: string) {
  let res: Response;
  try {
    res = await fetch(url, { credentials: "same-origin" });
  } catch {
    throw new ApiError(0, "NETWORK_ERROR", "Network error");
  }
  if (!res.ok) {
    const data = await res.json().catch(() => undefined);
    throw new ApiError(res.status, data?.code ?? "UNKNOWN", data?.message ?? res.statusText);
  }
  const blob = await res.blob();
  const name = /filename\*=UTF-8''([^;]+)/.exec(res.headers.get("content-disposition") ?? "")?.[1];
  const href = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = href;
  a.download = name ? decodeURIComponent(name) : `${fallbackName}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(href), 10_000);
}

export const ownerCvPdfUrl = (id: string) => `/api/cvs/${id}/pdf?download=1`;
export const publicCvPdfUrl = (slug: string) => `/api/public/cvs/${encodeURIComponent(slug)}/pdf?download=1`;
