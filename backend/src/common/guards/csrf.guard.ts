import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { AppConfig } from '../../config/app-config.js';
import { CSRF_HEADER } from '../constants.js';
import { SKIP_CSRF_KEY } from '../decorators/public.decorator.js';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/**
 * CSRF defence for cookie-authenticated requests:
 *  1. Cookies are SameSite=Lax (blocks cross-site POSTs in modern browsers).
 *  2. State-changing requests must carry a custom header. Browsers cannot send
 *     custom headers cross-origin without a CORS preflight, which only allowed origins pass.
 *  3. When an Origin header is present it must be an allowed origin.
 */
@Injectable()
export class CsrfGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly config: AppConfig,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    if (context.getType() !== 'http') return true;
    const request = context.switchToHttp().getRequest<Request>();
    if (SAFE_METHODS.has(request.method)) return true;
    const skip = this.reflector.getAllAndOverride<boolean>(SKIP_CSRF_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (skip) return true;

    if (request.headers[CSRF_HEADER] !== '1') {
      throw new ForbiddenException({ code: 'CSRF', message: 'Missing CSRF header' });
    }
    const origin = request.headers.origin;
    if (origin && !this.config.corsOrigins.includes(origin)) {
      throw new ForbiddenException({ code: 'CSRF', message: 'Origin not allowed' });
    }
    return true;
  }
}
