/**
 * Full page navigation. Used deliberately after auth state changes (login, logout,
 * account deletion, expired session) so every in-memory cache is discarded and the
 * proxy re-evaluates the session cookie.
 */
export function hardNavigate(path: string) {
  window.location.assign(path);
}

/** Only allow same-site relative redirects after login (prevents open redirects). */
export function safeNext(next: string | null, fallbackLocale: string) {
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")) return next;
  return `/${fallbackLocale}/dashboard`;
}
