import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** Marks a route as accessible without authentication. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export const ALLOW_UNVERIFIED_KEY = 'allowUnverified';
/** Authenticated route that unverified accounts may still call (e.g. /auth/me). */
export const AllowUnverified = () => SetMetadata(ALLOW_UNVERIFIED_KEY, true);

export const SKIP_CSRF_KEY = 'skipCsrf';
/** For machine-to-machine endpoints (Apple Wallet web service) that cannot send the CSRF header. */
export const SkipCsrf = () => SetMetadata(SKIP_CSRF_KEY, true);
