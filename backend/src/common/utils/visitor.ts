import type { Request, Response } from 'express';
import { VISITOR_COOKIE } from '../constants.js';
import { generateToken } from './crypto.js';

/**
 * Anonymous, random visitor id used only to de-duplicate analytics.
 * It is hashed before storage and contains no personal data.
 */
export function ensureVisitorId(req: Request, res: Response, secure: boolean): string {
  const existing: unknown = req.cookies?.[VISITOR_COOKIE];
  if (typeof existing === 'string' && /^[A-Za-z0-9_-]{16,64}$/.test(existing)) return existing;
  const id = generateToken(16);
  res.cookie(VISITOR_COOKIE, id, {
    httpOnly: true,
    sameSite: 'lax',
    secure,
    path: '/',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
  return id;
}
