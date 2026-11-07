import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { publicCardUrl } from '../cards/card.mapper.js';
import { CardsService } from '../cards/cards.service.js';
import { AppConfig } from '../config/app-config.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import type { AuthUser } from '../common/types.js';
import type { AdminCardsQueryDto, AdminUpdateUserDto, AdminUsersQueryDto, PageQueryDto } from './dto/admin.dto.js';

const DAY = 24 * 60 * 60 * 1000;

const USER_SELECT = {
  id: true, firstName: true, lastName: true, email: true, emailVerified: true, profileImage: true,
  preferredLanguage: true, role: true, suspendedAt: true, createdAt: true, updatedAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly sessions: SessionsService,
    private readonly cards: CardsService,
    private readonly config: AppConfig,
  ) {}

  // ───────────────────────── Overview ─────────────────────────

  async stats() {
    const since30 = new Date(Date.now() - 30 * DAY);
    const [
      users, admins, verified, suspended, newUsers, cardsTotal, cardsActive,
      events30, views30, walletApple, walletGoogle, activeSessions, signupsRaw, recentUsers,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { role: 'ADMIN' } }),
      this.prisma.user.count({ where: { emailVerified: true } }),
      this.prisma.user.count({ where: { suspendedAt: { not: null } } }),
      this.prisma.user.count({ where: { createdAt: { gte: since30 } } }),
      this.prisma.businessCard.count(),
      this.prisma.businessCard.count({ where: { status: 'ACTIVE' } }),
      this.prisma.cardAnalytics.count({ where: { createdAt: { gte: since30 } } }),
      this.prisma.cardAnalytics.count({ where: { createdAt: { gte: since30 }, eventType: 'VIEW' } }),
      this.prisma.walletPass.count({ where: { platform: 'APPLE' } }),
      this.prisma.walletPass.count({ where: { platform: 'GOOGLE' } }),
      this.prisma.session.count({ where: { revokedAt: null, expiresAt: { gt: new Date() } } }),
      this.prisma.$queryRaw<{ day: Date; count: bigint }[]>`
        SELECT date_trunc('day', "createdAt") AS day, COUNT(*) AS count
        FROM users WHERE "createdAt" >= ${since30} GROUP BY 1 ORDER BY 1`,
      this.prisma.user.findMany({ orderBy: { createdAt: 'desc' }, take: 6, select: USER_SELECT }),
    ]);

    const byDay = new Map(signupsRaw.map((r) => [new Date(r.day).toISOString().slice(0, 10), Number(r.count)]));
    const signups: { date: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * DAY).toISOString().slice(0, 10);
      signups.push({ date: d, count: byDay.get(d) ?? 0 });
    }

    return {
      users: { total: users, admins, verified, suspended, new30d: newUsers },
      cards: { total: cardsTotal, active: cardsActive },
      engagement: { events30d: events30, views30d: views30 },
      wallet: { apple: walletApple, google: walletGoogle },
      activeSessions,
      signups,
      recentUsers,
    };
  }

  // ───────────────────────── Users ─────────────────────────

  async listUsers(q: AdminUsersQueryDto) {
    const { page, pageSize, skip } = paging(q);
    const where: Prisma.UserWhereInput = {
      ...(q.role ? { role: q.role } : {}),
      ...(q.status === 'suspended' ? { suspendedAt: { not: null } } : {}),
      ...(q.status === 'active' ? { suspendedAt: null } : {}),
      ...(q.status === 'unverified' ? { emailVerified: false } : {}),
      ...(q.search
        ? {
            OR: [
              { email: { contains: q.search, mode: 'insensitive' } },
              { firstName: { contains: q.search, mode: 'insensitive' } },
              { lastName: { contains: q.search, mode: 'insensitive' } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: q.sort === 'oldest' ? 'asc' : 'desc' },
        skip,
        take: pageSize,
        select: { ...USER_SELECT, _count: { select: { cards: true } } },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items: items.map(({ _count, ...u }) => ({ ...u, cardsCount: _count.cards })),
      total,
      page,
      pageSize,
    };
  }

  async getUser(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        ...USER_SELECT,
        failedLoginAttempts: true,
        lockedUntil: true,
        cards: {
          orderBy: { createdAt: 'desc' },
          select: { id: true, name: true, slug: true, status: true, jobTitle: true, companyName: true, createdAt: true, updatedAt: true },
        },
        sessions: {
          where: { revokedAt: null, expiresAt: { gt: new Date() } },
          orderBy: { lastUsedAt: 'desc' },
          select: { id: true, userAgent: true, ipAddress: true, createdAt: true, lastUsedAt: true },
        },
      },
    });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    const views = await this.prisma.cardAnalytics.count({ where: { card: { userId: id }, eventType: 'VIEW' } });
    return { ...user, totalViews: views };
  }

  async updateUser(admin: AuthUser, id: string, dto: AdminUpdateUserDto) {
    const target = await this.requireUser(id);
    if (dto.role && dto.role !== target.role) {
      if (id === admin.id) throw selfError();
      if (target.role === 'ADMIN' && dto.role !== 'ADMIN') await this.assertNotLastAdmin();
    }
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        ...(dto.emailVerified === true && !target.emailVerified ? { emailVerifiedAt: new Date() } : {}),
      },
      select: USER_SELECT,
    });
    const changes = Object.fromEntries(
      Object.entries(dto)
        .filter(([k, v]) => v !== undefined && (target as Record<string, unknown>)[k] !== v)
        .map(([k, v]) => [k, { from: (target as Record<string, unknown>)[k], to: v }]),
    );
    if (Object.keys(changes).length) await this.audit(admin, 'user.update', 'user', id, { email: target.email, changes });
    return updated;
  }

  async setSuspended(admin: AuthUser, id: string, suspend: boolean) {
    if (id === admin.id) throw selfError();
    const target = await this.requireUser(id);
    if (suspend && target.role === 'ADMIN') await this.assertNotLastAdmin();
    const updated = await this.prisma.user.update({
      where: { id },
      data: { suspendedAt: suspend ? new Date() : null },
      select: USER_SELECT,
    });
    if (suspend) await this.sessions.revokeAll(id);
    await this.audit(admin, suspend ? 'user.suspend' : 'user.unsuspend', 'user', id, { email: target.email });
    return updated;
  }

  async revokeSessions(admin: AuthUser, id: string) {
    const target = await this.requireUser(id);
    await this.sessions.revokeAll(id, id === admin.id ? admin.sessionId : undefined);
    await this.audit(admin, 'user.revoke_sessions', 'user', id, { email: target.email });
  }

  async deleteUser(admin: AuthUser, id: string) {
    if (id === admin.id) throw selfError();
    const target = await this.requireUser(id);
    if (target.role === 'ADMIN') await this.assertNotLastAdmin();
    // Delete cards through CardsService so wallet passes and caches are cleaned up.
    const cards = await this.prisma.businessCard.findMany({ where: { userId: id }, select: { id: true } });
    for (const c of cards) await this.cards.remove(id, c.id);
    await this.prisma.user.delete({ where: { id } });
    await this.audit(admin, 'user.delete', 'user', id, { email: target.email, cards: cards.length });
  }

  // ───────────────────────── Cards ─────────────────────────

  async listCards(q: AdminCardsQueryDto) {
    const { page, pageSize, skip } = paging(q);
    const where: Prisma.BusinessCardWhereInput = {
      ...(q.status ? { status: q.status } : {}),
      ...(q.search
        ? {
            OR: [
              { name: { contains: q.search, mode: 'insensitive' } },
              { companyName: { contains: q.search, mode: 'insensitive' } },
              { slug: { contains: q.search, mode: 'insensitive' } },
              { user: { email: { contains: q.search, mode: 'insensitive' } } },
            ],
          }
        : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.businessCard.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: pageSize,
        select: {
          id: true, name: true, slug: true, status: true, jobTitle: true, companyName: true, profileImage: true,
          createdAt: true, updatedAt: true,
          user: { select: { id: true, email: true, firstName: true, lastName: true } },
          _count: { select: { analytics: { where: { eventType: 'VIEW' } } } },
        },
      }),
      this.prisma.businessCard.count({ where }),
    ]);
    return {
      items: items.map(({ _count, ...c }) => ({ ...c, views: _count.analytics, publicUrl: publicCardUrl(this.config.frontendUrl, c.slug) })),
      total,
      page,
      pageSize,
    };
  }

  async setCardStatus(admin: AuthUser, id: string, publish: boolean) {
    const card = await this.requireCard(id);
    const updated = await this.cards.setStatus(card.userId, id, publish);
    await this.audit(admin, publish ? 'card.activate' : 'card.deactivate', 'card', id, { name: card.name, owner: card.userId });
    return updated;
  }

  async deleteCard(admin: AuthUser, id: string) {
    const card = await this.requireCard(id);
    await this.cards.remove(card.userId, id);
    await this.audit(admin, 'card.delete', 'card', id, { name: card.name, owner: card.userId });
  }

  // ───────────────────────── Audit log ─────────────────────────

  async auditLog(q: PageQueryDto) {
    const { page, pageSize, skip } = paging(q);
    const [items, total] = await this.prisma.$transaction([
      this.prisma.adminAuditLog.findMany({ orderBy: { createdAt: 'desc' }, skip, take: pageSize }),
      this.prisma.adminAuditLog.count(),
    ]);
    return { items, total, page, pageSize };
  }

  // ───────────────────────── helpers ─────────────────────────

  private async requireUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id }, select: USER_SELECT });
    if (!user) throw new NotFoundException({ code: 'USER_NOT_FOUND', message: 'User not found' });
    return user;
  }

  private async requireCard(id: string) {
    const card = await this.prisma.businessCard.findUnique({ where: { id }, select: { id: true, userId: true, name: true } });
    if (!card) throw new NotFoundException({ code: 'CARD_NOT_FOUND', message: 'Card not found' });
    return card;
  }

  /** Never allow the platform to end up without an active administrator. */
  private async assertNotLastAdmin() {
    const admins = await this.prisma.user.count({ where: { role: 'ADMIN', suspendedAt: null } });
    if (admins <= 1) throw new BadRequestException({ code: 'LAST_ADMIN', message: 'At least one active administrator is required' });
  }

  private audit(admin: AuthUser, action: string, targetType: string, targetId: string, meta: Record<string, unknown>) {
    return this.prisma.adminAuditLog.create({
      data: { adminId: admin.id, adminEmail: admin.email, action, targetType, targetId, meta: meta as Prisma.InputJsonValue },
    });
  }
}

function selfError() {
  return new BadRequestException({ code: 'CANNOT_MODIFY_SELF', message: 'You cannot perform this action on your own account' });
}

function paging(q: PageQueryDto) {
  const page = q.page ?? 1;
  const pageSize = q.pageSize ?? 20;
  return { page, pageSize, skip: (page - 1) * pageSize };
}
