import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { AuthenticatedRequest } from '../common/types.js';

/** Runs after the global AuthGuard; the role comes from the DB on every request (not from the JWT). */
@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const user = context.switchToHttp().getRequest<AuthenticatedRequest>().user;
    if (user?.role !== 'ADMIN') {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Administrator access required' });
    }
    return true;
  }
}
