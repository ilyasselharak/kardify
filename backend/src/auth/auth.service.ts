import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AppConfig } from '../config/app-config.js';
import { generateToken, sha256 } from '../common/utils/crypto.js';
import { EmailService } from '../email/email.service.js';
import type { Language, User } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { CacheService } from '../redis/cache.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import type { LoginDto, RegisterDto, ResetPasswordDto } from './dto/auth.dto.js';
import { PasswordService } from './password.service.js';

export const MAX_FAILED_LOGINS = 5;
export const LOCKOUT_MINUTES = 15;
const VERIFY_TTL_MS = 24 * 60 * 60 * 1000;
const RESET_TTL_MS = 60 * 60 * 1000;

export interface LoginContext {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  /** Real hash of a random value, verified for unknown emails so response timing doesn't reveal accounts. */
  private dummyHash?: Promise<string>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionsService,
    private readonly jwt: JwtService,
    private readonly email: EmailService,
    private readonly cache: CacheService,
    private readonly config: AppConfig,
  ) {}

  async register(dto: RegisterDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException({ code: 'PASSWORDS_MISMATCH', message: 'Passwords do not match' });
    }
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email }, select: { id: true } });
    if (existing) throw new ConflictException({ code: 'EMAIL_TAKEN', message: 'Email already registered' });

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        passwordHash: await this.passwords.hash(dto.password),
        preferredLanguage: dto.language ?? 'en',
        termsAcceptedAt: new Date(),
      },
    });
    await this.sendVerification(user);
    return user;
  }

  async login(dto: LoginDto, ctx: LoginContext) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) {
      this.dummyHash ??= this.passwords.hash(generateToken());
      await this.passwords.verify(await this.dummyHash, dto.password);
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new ForbiddenException({
        code: 'ACCOUNT_LOCKED',
        message: 'Too many failed attempts. Try again later.',
        errors: { retryAt: user.lockedUntil.toISOString() },
      });
    }
    const valid = await this.passwords.verify(user.passwordHash, dto.password);
    if (!valid) {
      const attempts = user.failedLoginAttempts + 1;
      await this.prisma.user.update({
        where: { id: user.id },
        data:
          attempts >= MAX_FAILED_LOGINS
            ? { failedLoginAttempts: 0, lockedUntil: new Date(Date.now() + LOCKOUT_MINUTES * 60 * 1000) }
            : { failedLoginAttempts: attempts },
      });
      throw new UnauthorizedException({ code: 'INVALID_CREDENTIALS', message: 'Invalid email or password' });
    }
    // Checked after the password so suspension status is not disclosed to guessers.
    if (user.suspendedAt) {
      throw new ForbiddenException({ code: 'ACCOUNT_SUSPENDED', message: 'This account has been suspended' });
    }
    if (user.failedLoginAttempts > 0 || user.lockedUntil) {
      await this.prisma.user.update({ where: { id: user.id }, data: { failedLoginAttempts: 0, lockedUntil: null } });
    }
    return { user, ...(await this.issueSession(user.id, !!dto.rememberMe, ctx)) };
  }

  async issueSession(userId: string, rememberMe: boolean, ctx: LoginContext) {
    const session = await this.sessions.create(userId, { rememberMe, ...ctx });
    const expiresInSeconds = Math.floor((session.expiresAt.getTime() - Date.now()) / 1000);
    const token = await this.jwt.signAsync({ sub: userId, sid: session.id }, { expiresIn: expiresInSeconds });
    return { token, session };
  }

  logout(sessionId: string, userId: string) {
    return this.sessions.revoke(userId, sessionId).catch(() => undefined);
  }

  async sendVerification(user: Pick<User, 'id' | 'email' | 'firstName' | 'preferredLanguage'>) {
    const token = generateToken();
    await this.prisma.$transaction([
      this.prisma.emailVerificationToken.deleteMany({ where: { userId: user.id } }),
      this.prisma.emailVerificationToken.create({
        data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + VERIFY_TTL_MS) },
      }),
    ]);
    const url = `${this.config.frontendUrl}/${user.preferredLanguage}/verify-email?token=${encodeURIComponent(token)}`;
    this.email.dispatch('verifyEmail', user.email, user.preferredLanguage, { name: user.firstName, url });
  }

  /** Always resolves without revealing whether the email exists. Rate limited per address. */
  async resendVerification(email: string) {
    if (!(await this.cache.setIfAbsent(`resend-verify:${sha256(email)}`, 60))) return;
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (user && !user.emailVerified) await this.sendVerification(user);
  }

  async verifyEmail(token: string) {
    const record = await this.prisma.emailVerificationToken.findUnique({ where: { tokenHash: sha256(token) } });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException({ code: 'TOKEN_INVALID', message: 'Verification link is invalid or expired' });
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { emailVerified: true, emailVerifiedAt: new Date() },
      }),
      this.prisma.emailVerificationToken.deleteMany({ where: { userId: record.userId } }),
    ]);
  }

  async forgotPassword(email: string) {
    if (!(await this.cache.setIfAbsent(`forgot:${sha256(email)}`, 60))) return;
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) return;
    const token = generateToken();
    await this.prisma.$transaction([
      this.prisma.passwordResetToken.deleteMany({ where: { userId: user.id, usedAt: null } }),
      this.prisma.passwordResetToken.create({
        data: { userId: user.id, tokenHash: sha256(token), expiresAt: new Date(Date.now() + RESET_TTL_MS) },
      }),
    ]);
    const url = `${this.config.frontendUrl}/${user.preferredLanguage}/reset-password?token=${encodeURIComponent(token)}`;
    this.email.dispatch('resetPassword', user.email, user.preferredLanguage, { name: user.firstName, url });
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException({ code: 'PASSWORDS_MISMATCH', message: 'Passwords do not match' });
    }
    const record = await this.prisma.passwordResetToken.findUnique({ where: { tokenHash: sha256(dto.token) } });
    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new BadRequestException({ code: 'TOKEN_INVALID', message: 'Reset link is invalid or expired' });
    }
    const passwordHash = await this.passwords.hash(dto.password);
    await this.prisma.$transaction([
      // Conditional update guarantees single use even under concurrent requests.
      this.prisma.passwordResetToken.updateMany({
        where: { id: record.id, usedAt: null },
        data: { usedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: record.userId },
        // A successful reset proves inbox ownership, so it also verifies the email.
        data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null, emailVerified: true },
      }),
      this.prisma.passwordResetToken.deleteMany({ where: { userId: record.userId, id: { not: record.id } } }),
    ]);
    await this.sessions.revokeAll(record.userId);
  }

  static toPublicUser(user: User) {
    return {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      emailVerified: user.emailVerified,
      profileImage: user.profileImage,
      preferredLanguage: user.preferredLanguage as Language,
      role: user.role,
      preferences: user.preferences,
      createdAt: user.createdAt,
    };
  }
}
