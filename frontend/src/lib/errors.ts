import { ApiError } from "@/lib/api/client";

/** Maps an API error to a translation key in the `errors` namespace. */
export function errorKey(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 429) return "TOO_MANY_REQUESTS";
    return error.code;
  }
  return "generic";
}
