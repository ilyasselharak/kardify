import { BadRequestException, ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service.js';
import { PasswordService } from '../auth/password.service.js';
import { AppConfig } from '../config/app-config.js';
import { generateToken, sha256 } from '../common/utils/crypto.js';
import { EmailService } from '../email/email.service.js';
import { Prisma } from '../generated/prisma/client.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SessionsService } from '../sessions/sessions.service.js';
import type {
  ChangeEmailDto,
  ChangePasswordDto,
  UpdatePreferencesDto,
  UpdateProfileDto,
} from './dto/users.dto.js';

const EMAIL_CHANGE_TTL_MS = 24 * 60 * 60 * 1000;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly sessions: SessionsService,
    private readonly email: EmailService,
    private readonly config: AppConfig,
  ) {}

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({ where: { id: userId }, data: dto });
    return AuthService.toPublicUser(user);
  }

  async updatePreferences(userId: string, dto: UpdatePreferencesDto) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const current = (user.preferences ?? {}) as Record<string, unknown>;
    const merged = {
      ...current,
      ...dto,
      notifications: { ...((current.notifications as object) ?? {}), ...(dto.notifications ?? {}) },
    };
    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: { preferences: merged as Prisma.InputJsonValue },
    });
    return AuthService.toPublicUser(updated);
  }

  async changePassword(userId: string, sessionId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException({ code: 'PASSWORDS_MISMATCH', message: 'Passwords do not match' });
    }
    const user = await this.requirePassword(userId, dto.currentPassword);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await this.passwords.hash(dto.newPassword) },
    });
    await this.sessions.revokeAll(userId, sessionId);
    this.email.dispatch('passwordChanged', user.email, user.preferredLanguage, {
      name: user.firstName,
      url: `${this.config.frontendUrl}/${user.preferredLanguage}/login`,
    });
  }

  async requestEmailChange(userId: string, dto: ChangeEmailDto) {
    const user = await this.requirePassword(userId, dto.password);
    if (dto.newEmail === user.email) {
      throw new BadRequestException({ code: 'EMAIL_UNCHANGED', message: 'This is already your email' });
    }
    const taken = await this.prisma.user.findUnique({ where: { email: dto.newEmail }, select: { id: true } });
    if (taken) throw new ConflictException({ code: 'EMAIL_TAKEN', message: 'Email already registered' });

    const token = generateToken();
    await this.prisma.$transaction([
      this.prisma.emailChangeToken.deleteMany({ where: { userId } }),
      this.prisma.emailChangeToken.create({
        data: {
          userId,
          newEmail: dto.newEmail,
          tokenHash: sha256(token),
          expiresAt: new Date(Date.now() + EMAIL_CHANGE_TTL_MS),
        },
      }),
    ]);
    const url = `${this.config.frontendUrl}/${user.preferredLanguage}/verify-email?type=email-change&token=${encodeURIComponent(token)}`;
    this.email.dispatch('changeEmail', dto.newEmail, user.preferredLanguage, { name: user.firstName, url });
  }

  async confirmEmailChange(token: string) {
    const record = await this.prisma.emailChangeToken.findUnique({ where: { tokenHash: sha256(token) } });
    if (!record || record.expiresAt < new Date()) {
      throw new BadRequestException({ code: 'TOKEN_INVALID', message: 'Link is invalid or expired' });
    }
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: record.userId },
        data: { email: record.newEmail, emailVerified: true, emailVerifiedAt: new Date() },
      }),
      this.prisma.emailChangeToken.deleteMany({ where: { userId: record.userId } }),
    ]);
  }

  async deleteAccount(userId: string, password: string) {
    await this.requirePassword(userId, password);
    // Cascades remove cards, analytics, wallet passes, sessions and tokens.
    await this.prisma.user.delete({ where: { id: userId } });
  }

  /** GDPR-style export of everything we store about the user (no secrets / hashes). */
  async exportData(userId: string) {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      include: {
        cards: { include: { walletPasses: { select: { platform: true, status: true, createdAt: true } } } },
        sessions: { select: { userAgent: true, ipAddress: true, createdAt: true, lastUsedAt: true, expiresAt: true, revokedAt: true } },
      },
    });
    const analytics = await this.prisma.cardAnalytics.groupBy({
      by: ['cardId', 'eventType'],
      where: { card: { userId } },
      _count: { _all: true },
    });
    const { passwordHash: _ph, failedLoginAttempts: _fa, lockedUntil: _lu, ...profile } = user;
    return {
      exportedAt: new Date().toISOString(),
      profile: { ...profile, cards: undefined, sessions: undefined },
      cards: user.cards,
      sessions: user.sessions,
      analyticsSummary: analytics.map((a) => ({ cardId: a.cardId, eventType: a.eventType, count: a._count._all })),
    };
  }

  private async requirePassword(userId: string, password: string) {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await this.passwords.verify(user.passwordHash, password))) {
      throw new UnauthorizedException({ code: 'INVALID_PASSWORD', message: 'Current password is incorrect' });
    }
    return user;
  }
}
