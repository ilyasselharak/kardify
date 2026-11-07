import { BadRequestException, ConflictException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import type { AppConfig } from '../config/app-config.js';
import { sha256 } from '../common/utils/crypto.js';
import type { EmailService } from '../email/email.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import type { CacheService } from '../redis/cache.service.js';
import type { SessionsService } from '../sessions/sessions.service.js';
import { AuthService, LOCKOUT_MINUTES, MAX_FAILED_LOGINS } from './auth.service.js';
import { PasswordService } from './password.service.js';

const passwords = new PasswordService();

function setup() {
  const user = {
    id: 'u1',
    firstName: 'Jane',
    lastName: 'Doe',
    email: 'jane@example.com',
    passwordHash: '',
    emailVerified: false,
    preferredLanguage: 'en' as const,
    failedLoginAttempts: 0,
    lockedUntil: null as Date | null,
  };
  const prisma = {
    user: {
      findUnique: vi.fn(),
      create: vi.fn(async ({ data }) => ({ ...user, ...data })),
      update: vi.fn(async ({ data }) => ({ ...user, ...data })),
    },
    emailVerificationToken: { deleteMany: vi.fn(), create: vi.fn(), findUnique: vi.fn() },
    passwordResetToken: { deleteMany: vi.fn(), create: vi.fn(), findUnique: vi.fn(), updateMany: vi.fn() },
    $transaction: vi.fn(async (ops: unknown[]) => ops),
  };
  const sessions = {
    create: vi.fn(async () => ({ id: 's1', expiresAt: new Date(Date.now() + 3600_000) })),
    revokeAll: vi.fn(),
    revoke: vi.fn(),
  };
  const email = { dispatch: vi.fn() };
  const cache = { setIfAbsent: vi.fn(async () => true) };
  const config = { frontendUrl: 'https://kardify.test' } as AppConfig;
  const jwt = new JwtService({ secret: 'test-secret' });
  const svc = new AuthService(
    prisma as unknown as PrismaService,
    passwords,
    sessions as unknown as SessionsService,
    jwt,
    email as unknown as EmailService,
    cache as unknown as CacheService,
    config,
  );
  return { svc, prisma, sessions, email, cache, user, jwt };
}

const registerDto = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'jane@example.com',
  password: 'Str0ng!Pass',
  confirmPassword: 'Str0ng!Pass',
  acceptTerms: true,
};

describe('AuthService', () => {
  describe('register', () => {
    it('hashes the password and sends a verification email with a hashed token', async () => {
      const { svc, prisma, email } = setup();
      prisma.user.findUnique.mockResolvedValue(null);
      await svc.register(registerDto);
      const created = prisma.user.create.mock.calls[0][0].data;
      expect(created.passwordHash).toMatch(/^\$argon2id\$/);
      expect(created.passwordHash).not.toContain('Str0ng!Pass');
      const tokenRow = prisma.emailVerificationToken.create.mock.calls[0][0].data;
      const sentUrl: string = email.dispatch.mock.calls[0][3].url;
      const rawToken = new URL(sentUrl).searchParams.get('token')!;
      expect(tokenRow.tokenHash).toBe(sha256(rawToken));
      expect(sentUrl).toContain('/en/verify-email');
    });

    it('rejects duplicate emails', async () => {
      const { svc, prisma } = setup();
      prisma.user.findUnique.mockResolvedValue({ id: 'x' });
      await expect(svc.register(registerDto)).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects mismatched passwords', async () => {
      const { svc } = setup();
      await expect(svc.register({ ...registerDto, confirmPassword: 'nope' })).rejects.toBeInstanceOf(BadRequestException);
    });
  });

  describe('login', () => {
    it('issues a JWT bound to a server-side session', async () => {
      const { svc, prisma, user, jwt } = setup();
      prisma.user.findUnique.mockResolvedValue({ ...user, passwordHash: await passwords.hash('Str0ng!Pass') });
      const res = await svc.login({ email: user.email, password: 'Str0ng!Pass', rememberMe: true }, {});
      const payload = await jwt.verifyAsync(res.token);
      expect(payload).toMatchObject({ sub: 'u1', sid: 's1' });
    });

    it('returns a generic error for unknown emails', async () => {
      const { svc, prisma } = setup();
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(svc.login({ email: 'x@y.z', password: 'whatever' }, {})).rejects.toMatchObject({
        response: { code: 'INVALID_CREDENTIALS' },
      });
    });

    it(`locks the account after ${MAX_FAILED_LOGINS} failures`, async () => {
      const { svc, prisma, user } = setup();
      prisma.user.findUnique.mockResolvedValue({
        ...user,
        passwordHash: await passwords.hash('Str0ng!Pass'),
        failedLoginAttempts: MAX_FAILED_LOGINS - 1,
      });
      await expect(svc.login({ email: user.email, password: 'bad' }, {})).rejects.toBeInstanceOf(UnauthorizedException);
      const data = prisma.user.update.mock.calls[0][0].data;
      expect(data.lockedUntil.getTime()).toBeGreaterThan(Date.now() + (LOCKOUT_MINUTES - 1) * 60_000);
    });

    it('refuses locked accounts even with the right password', async () => {
      const { svc, prisma, user } = setup();
      prisma.user.findUnique.mockResolvedValue({
        ...user,
        passwordHash: await passwords.hash('Str0ng!Pass'),
        lockedUntil: new Date(Date.now() + 60_000),
      });
      await expect(svc.login({ email: user.email, password: 'Str0ng!Pass' }, {})).rejects.toBeInstanceOf(ForbiddenException);
    });
  });

  describe('verifyEmail', () => {
    it('rejects expired tokens', async () => {
      const { svc, prisma } = setup();
      prisma.emailVerificationToken.findUnique.mockResolvedValue({ userId: 'u1', expiresAt: new Date(Date.now() - 1) });
      await expect(svc.verifyEmail('t'.repeat(43))).rejects.toBeInstanceOf(BadRequestException);
    });

    it('marks the user verified and deletes tokens', async () => {
      const { svc, prisma } = setup();
      prisma.emailVerificationToken.findUnique.mockResolvedValue({ userId: 'u1', expiresAt: new Date(Date.now() + 60_000) });
      await svc.verifyEmail('t'.repeat(43));
      expect(prisma.user.update.mock.calls[0][0].data.emailVerified).toBe(true);
      expect(prisma.emailVerificationToken.deleteMany).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    });
  });

  describe('password reset', () => {
    it('does not reveal unknown emails', async () => {
      const { svc, prisma, email } = setup();
      prisma.user.findUnique.mockResolvedValue(null);
      await expect(svc.forgotPassword('nobody@example.com')).resolves.toBeUndefined();
      expect(email.dispatch).not.toHaveBeenCalled();
    });

    it('rejects used tokens', async () => {
      const { svc, prisma } = setup();
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'r1', userId: 'u1', usedAt: new Date(), expiresAt: new Date(Date.now() + 60_000),
      });
      await expect(
        svc.resetPassword({ token: 't'.repeat(43), password: 'N3w!Passw0rd', confirmPassword: 'N3w!Passw0rd' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('resets the password, consumes the token and revokes all sessions', async () => {
      const { svc, prisma, sessions } = setup();
      prisma.passwordResetToken.findUnique.mockResolvedValue({
        id: 'r1', userId: 'u1', usedAt: null, expiresAt: new Date(Date.now() + 60_000),
      });
      await svc.resetPassword({ token: 't'.repeat(43), password: 'N3w!Passw0rd', confirmPassword: 'N3w!Passw0rd' });
      expect(prisma.passwordResetToken.updateMany).toHaveBeenCalledWith({
        where: { id: 'r1', usedAt: null },
        data: { usedAt: expect.any(Date) },
      });
      expect(sessions.revokeAll).toHaveBeenCalledWith('u1');
      const hash = prisma.user.update.mock.calls[0][0].data.passwordHash;
      expect(await passwords.verify(hash, 'N3w!Passw0rd')).toBe(true);
    });
  });
});
