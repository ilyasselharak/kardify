/**
 * Browser/API fetch wrapper. All requests go to same-origin `/api/*` (rewritten to the
 * NestJS backend by next.config.ts), so the HTTP-only session cookie is sent automatically.
 */
export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly errors?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

const CSRF_HEADER = "x-kardify-csrf";

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export interface RequestOptions {
  body?: unknown;
  query?: Record<string, string | number | undefined | null>;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: RequestOptions["query"]) {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query ?? {})) if (v !== undefined && v !== null && v !== "") qs.set(k, String(v));
  const s = qs.toString();
  return `/api${path}${s ? `?${s}` : ""}`;
}

export async function apiRequest<T>(method: Method, path: string, opts: RequestOptions = {}): Promise<T> {
  const isForm = typeof FormData !== "undefined" && opts.body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(buildUrl(path, opts.query), {
      method,
      credentials: "same-origin",
      signal: opts.signal,
      headers: {
        Accept: "application/json",
        ...(method !== "GET" ? { [CSRF_HEADER]: "1" } : {}),
        ...(opts.body !== undefined && !isForm ? { "Content-Type": "application/json" } : {}),
      },
      body: opts.body === undefined ? undefined : isForm ? (opts.body as FormData) : JSON.stringify(opts.body),
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ApiError(0, "NETWORK_ERROR", "Network error");
  }

  if (res.status === 204) return undefined as T;
  const data = await res.json().catch(() => undefined);
  if (!res.ok) {
    throw new ApiError(res.status, data?.code ?? "UNKNOWN", data?.message ?? res.statusText, data?.errors);
  }
  return data as T;
}

export const api = {
  get: <T>(path: string, opts?: RequestOptions) => apiRequest<T>("GET", path, opts),
  post: <T>(path: string, body?: unknown, opts?: RequestOptions) => apiRequest<T>("POST", path, { ...opts, body }),
  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) => apiRequest<T>("PATCH", path, { ...opts, body }),
  delete: <T>(path: string, body?: unknown, opts?: RequestOptions) => apiRequest<T>("DELETE", path, { ...opts, body }),
};

/** Builds a same-origin URL for downloads (QR, vCard, wallet passes). */
export const apiUrl = (path: string, query?: RequestOptions["query"]) => buildUrl(path, query);
