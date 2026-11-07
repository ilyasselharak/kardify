import type { Request } from 'express';

export function clientIp(req: Request): string | undefined {
  return (req.ip ?? req.socket.remoteAddress ?? undefined)?.slice(0, 64);
}

export function userAgent(req: Request): string | undefined {
  return req.headers['user-agent']?.slice(0, 255);
}

/** Reduce a referrer to its origin so we never store full URLs (privacy). */
export function referrerOrigin(value: string | undefined): string | undefined {
  if (!value) return undefined;
  try {
    return new URL(value).origin.slice(0, 255);
  } catch {
    return undefined;
  }
}
