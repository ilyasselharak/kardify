import { Injectable, NotFoundException } from '@nestjs/common';
import { AppConfig } from '../config/app-config.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { AuthUser } from '../common/types.js';

const TOUCH_INTERVAL_MS = 5 * 60 * 1000;

@Injectable()
export class SessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: AppConfig,
  ) {}

  async create(userId: string, opts: { rememberMe: boolean; userAgent?: string; ipAddress?: string }) {
    const ttlMs = opts.rememberMe
      ? this.config.rememberMeTtlDays * 24 * 60 * 60 * 1000
      : this.config.sessionTtlHours * 60 * 60 * 1000;
    return this.prisma.session.create({
      data: {
        userId,
        rememberMe: opts.rememberMe,
        userAgent: opts.userAgent,
        ipAddress: opts.ipAddress,
        expiresAt: new Date(Date.now() + ttlMs),
      },
    });
  }

  /** Returns the authenticated user if the session is valid (exists, not revoked, not expired). */
  async validate(sessionId: string, userId: string): Promise<AuthUser | undefined> {
    const session = await this.prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        user: { select: { id: true, email: true, emailVerified: true, preferredLanguage: true, role: true, suspendedAt: true } },
      },
    });
    if (
      !session ||
      session.userId !== userId ||
      session.revokedAt ||
      session.expiresAt < new Date() ||
      session.user.suspendedAt
    ) {
      return undefined;
    }
    if (Date.now() - session.lastUsedAt.getTime() > TOUCH_INTERVAL_MS) {
      await this.prisma.session
        .update({ where: { id: session.id }, data: { lastUsedAt: new Date() } })
        .catch(() => undefined);
    }
    const { suspendedAt: _s, ...user } = session.user;
    return { ...user, sessionId: session.id };
  }

  list(userId: string) {
    return this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastUsedAt: 'desc' },
      select: { id: true, userAgent: true, ipAddress: true, createdAt: true, lastUsedAt: true, expiresAt: true },
    });
  }

  async revoke(userId: string, sessionId: string) {
    const res = await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    if (res.count === 0) throw new NotFoundException({ code: 'SESSION_NOT_FOUND', message: 'Session not found' });
  }

  /** Revokes all sessions, optionally keeping the current one. */
  async revokeAll(userId: string, exceptSessionId?: string) {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null, ...(exceptSessionId ? { id: { not: exceptSessionId } } : {}) },
      data: { revokedAt: new Date() },
    });
  }
}
