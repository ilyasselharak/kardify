import type { CookieOptions, Response } from 'express';
import type { AppConfig } from '../config/app-config.js';
import { AUTH_COOKIE } from '../common/constants.js';

function baseOptions(config: AppConfig): CookieOptions {
  return {
    httpOnly: true,
    secure: config.isProduction,
    sameSite: 'lax',
    path: '/',
    domain: config.cookieDomain,
  };
}

/** Without "remember me" the cookie is a browser-session cookie; the server-side session still expires. */
export function setAuthCookie(res: Response, config: AppConfig, token: string, rememberMe: boolean, expiresAt: Date) {
  res.cookie(AUTH_COOKIE, token, {
    ...baseOptions(config),
    ...(rememberMe ? { expires: expiresAt } : {}),
  });
}

export function clearAuthCookie(res: Response, config: AppConfig) {
  res.clearCookie(AUTH_COOKIE, baseOptions(config));
}
