import { Module } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { createObserveModule } from '@nestjs/observe';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AdminModule } from './admin/admin.module.js';
import { AnalyticsModule } from './analytics/analytics.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CardDesignModule } from './card-design/card-design.module.js';
import { CardsModule } from './cards/cards.module.js';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter.js';
import { AuthGuard } from './common/guards/auth.guard.js';
import { CsrfGuard } from './common/guards/csrf.guard.js';
import { AppConfigModule } from './config/config.module.js';
import { EmailModule } from './email/email.module.js';
import { HealthController } from './health/health.controller.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { PublicModule } from './public/public.module.js';
import { QrCodeModule } from './qrcode/qrcode.module.js';
import { CacheModule } from './redis/cache.module.js';
import { SessionsModule } from './sessions/sessions.module.js';
import { SharingModule } from './sharing/sharing.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { UsersModule } from './users/users.module.js';
import { WalletSyncModule } from './wallet/wallet-sync.module.js';

export const { ObserveModule, ObserveInstrument } = createObserveModule();

@Module({
  imports: [
    ObserveModule.forRoot({
      appKey: process.env.OBSERVE_APP_KEY ?? 'YOUR_APP_KEY',
      appSecret: process.env.OBSERVE_APP_SECRET ?? 'YOUR_APP_SECRET',
      serviceId: 'backend',
    }),
    AppConfigModule,
    ThrottlerModule.forRoot([{ name: 'default', ttl: 60_000, limit: 120 }]),
    PrismaModule,
    CacheModule,
    EmailModule,
    SessionsModule,
    AuthModule,
    UsersModule,
    CardDesignModule,
    CardsModule,
    UploadsModule,
    QrCodeModule,
    SharingModule,
    PublicModule,
    AnalyticsModule,
    WalletSyncModule,
    AdminModule,
  ],
  controllers: [HealthController],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: AuthGuard },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class AppModule {}
