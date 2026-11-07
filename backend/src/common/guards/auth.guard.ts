import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { AUTH_COOKIE } from '../constants.js';
import { ALLOW_UNVERIFIED_KEY, IS_PUBLIC_KEY } from '../decorators/public.decorator.js';
import type { AuthenticatedRequest, JwtPayload } from '../types.js';
import { SessionsService } from '../../sessions/sessions.service.js';

/**
 * Global guard. Every route requires a valid, non-revoked session unless it is
 * decorated with @Public(). Unverified accounts are rejected unless @AllowUnverified().
 */
@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwt: JwtService,
    private readonly sessions: SessionsService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (context.getType() !== 'http') return true;
    const targets = [context.getHandler(), context.getClass()];
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets);
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const user = await this.resolveUser(request);
    if (user) request.user = user;
    if (isPublic) return true;
    if (!user) throw new UnauthorizedException({ code: 'UNAUTHENTICATED', message: 'Authentication required' });

    const allowUnverified = this.reflector.getAllAndOverride<boolean>(ALLOW_UNVERIFIED_KEY, targets);
    if (!user.emailVerified && !allowUnverified) {
      throw new ForbiddenException({ code: 'EMAIL_NOT_VERIFIED', message: 'Please verify your email address' });
    }
    return true;
  }

  private async resolveUser(request: AuthenticatedRequest) {
    const token: string | undefined = request.cookies?.[AUTH_COOKIE];
    if (!token) return undefined;
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      return undefined;
    }
    return this.sessions.validate(payload.sid, payload.sub);
  }
}
