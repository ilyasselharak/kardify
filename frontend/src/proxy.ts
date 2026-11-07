import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);
const SESSION_COOKIE = "kardify_session";

/**
 * 1. Locale detection / prefixing (next-intl).
 * 2. Optimistic auth check: dashboard routes without a session cookie go to login.
 *    The API still validates every request; this only avoids rendering a protected shell.
 */
export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const match = /^\/(en|ar)\/dashboard(\/|$)/.exec(pathname);
  if (match && !request.cookies.get(SESSION_COOKIE)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${match[1]}/login`;
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }
  return intl(request);
}

export const config = {
  // Skip API, Next internals and static files.
  matcher: ["/((?!api|_next|_vercel|brand|.*\\..*).*)"],
};
