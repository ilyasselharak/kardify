import { BadRequestException, ForbiddenException, type ExecutionContext } from '@nestjs/common';
import type { CardsService } from '../cards/cards.service.js';
import type { AppConfig } from '../config/app-config.js';
import type { AuthUser } from '../common/types.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { SessionsService } from '../sessions/sessions.service.js';
import { AdminGuard } from './admin.guard.js';
import { AdminService } from './admin.service.js';

const me: AuthUser = { id: 'admin-1', email: 'admin@x.com', emailVerified: true, preferredLanguage: 'en', role: 'ADMIN', sessionId: 's1' };
const target = (over: Record<string, unknown> = {}) => ({ id: 'u2', email: 'u2@x.com', role: 'USER', emailVerified: false, suspendedAt: null, ...over });

function setup(activeAdmins = 2, user = target()) {
  const prisma = {
    user: {
      findUnique: vi.fn(async () => user),
      update: vi.fn(async ({ data }) => ({ ...user, ...data })),
      delete: vi.fn(),
      count: vi.fn(async () => activeAdmins),
    },
    businessCard: { findMany: vi.fn(async () => [{ id: 'c1' }, { id: 'c2' }]) },
    adminAuditLog: { create: vi.fn() },
  };
  const sessions = { revokeAll: vi.fn() };
  const cards = { remove: vi.fn() };
  const svc = new AdminService(
    prisma as unknown as PrismaService,
    sessions as unknown as SessionsService,
    cards as unknown as CardsService,
    { frontendUrl: 'https://kardify.test' } as AppConfig,
  );
  return { svc, prisma, sessions, cards };
}

describe('AdminGuard', () => {
  const ctx = (role?: string) =>
    ({ switchToHttp: () => ({ getRequest: () => ({ user: role ? { role } : undefined }) }) }) as unknown as ExecutionContext;
  it('allows admins only', () => {
    expect(new AdminGuard().canActivate(ctx('ADMIN'))).toBe(true);
    expect(() => new AdminGuard().canActivate(ctx('USER'))).toThrow(ForbiddenException);
    expect(() => new AdminGuard().canActivate(ctx())).toThrow(ForbiddenException);
  });
});

describe('AdminService safety rules', () => {
  it('cannot suspend, delete or change the role of yourself', async () => {
    const { svc } = setup(2, target({ id: me.id, role: 'ADMIN' }));
    await expect(svc.setSuspended(me, me.id, true)).rejects.toMatchObject({ response: { code: 'CANNOT_MODIFY_SELF' } });
    await expect(svc.deleteUser(me, me.id)).rejects.toMatchObject({ response: { code: 'CANNOT_MODIFY_SELF' } });
    await expect(svc.updateUser(me, me.id, { role: 'USER' })).rejects.toMatchObject({ response: { code: 'CANNOT_MODIFY_SELF' } });
  });

  it('never removes the last active admin', async () => {
    const { svc } = setup(1, target({ role: 'ADMIN' }));
    await expect(svc.updateUser(me, 'u2', { role: 'USER' })).rejects.toBeInstanceOf(BadRequestException);
    await expect(svc.setSuspended(me, 'u2', true)).rejects.toMatchObject({ response: { code: 'LAST_ADMIN' } });
  });

  it('suspending revokes every session and is audited', async () => {
    const { svc, sessions, prisma } = setup();
    await svc.setSuspended(me, 'u2', true);
    expect(prisma.user.update.mock.calls[0][0].data.suspendedAt).toBeInstanceOf(Date);
    expect(sessions.revokeAll).toHaveBeenCalledWith('u2');
    expect(prisma.adminAuditLog.create.mock.calls[0][0].data).toMatchObject({ adminId: me.id, action: 'user.suspend', targetId: 'u2' });
  });

  it('deleting a user removes cards through CardsService (wallet + cache cleanup)', async () => {
    const { svc, cards, prisma } = setup();
    await svc.deleteUser(me, 'u2');
    expect(cards.remove).toHaveBeenCalledTimes(2);
    expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u2' } });
  });

  it('records only actual changes in the audit log', async () => {
    const { svc, prisma } = setup();
    await svc.updateUser(me, 'u2', { emailVerified: true, firstName: undefined });
    expect(prisma.adminAuditLog.create.mock.calls[0][0].data.meta.changes).toEqual({ emailVerified: { from: false, to: true } });
  });
});
