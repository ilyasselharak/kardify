import type { Request } from 'express';
import type { Language, Role } from '../generated/prisma/client.js';

export interface AuthUser {
  id: string;
  email: string;
  emailVerified: boolean;
  preferredLanguage: Language;
  role: Role;
  sessionId: string;
}

export interface AuthenticatedRequest extends Request {
  user: AuthUser;
}

export interface JwtPayload {
  sub: string;
  sid: string;
}
