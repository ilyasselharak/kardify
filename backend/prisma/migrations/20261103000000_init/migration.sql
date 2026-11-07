-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "Language" AS ENUM ('en', 'ar');

-- CreateEnum
CREATE TYPE "CardStatus" AS ENUM ('DRAFT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "AnalyticsEventType" AS ENUM ('VIEW', 'QR_SCAN', 'SHARE', 'CONTACT_DOWNLOAD', 'APPLE_WALLET_ADD', 'GOOGLE_WALLET_ADD', 'WHATSAPP_CLICK', 'WEBSITE_CLICK', 'EMAIL_CLICK', 'PHONE_CLICK', 'LOCATION_CLICK', 'SOCIAL_CLICK');

-- CreateEnum
CREATE TYPE "WalletPlatform" AS ENUM ('APPLE', 'GOOGLE');

-- CreateEnum
CREATE TYPE "WalletPassStatus" AS ENUM ('ACTIVE', 'REVOKED');

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "firstName" VARCHAR(80) NOT NULL,
    "lastName" VARCHAR(80) NOT NULL,
    "email" VARCHAR(254) NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "emailVerifiedAt" TIMESTAMP(3),
    "profileImage" TEXT,
    "preferredLanguage" "Language" NOT NULL DEFAULT 'en',
    "termsAcceptedAt" TIMESTAMP(3) NOT NULL,
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "preferences" JSONB NOT NULL DEFAULT '{}',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "business_cards" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "slug" VARCHAR(160) NOT NULL,
    "publicId" VARCHAR(32) NOT NULL,
    "jobTitle" VARCHAR(120),
    "companyName" VARCHAR(120),
    "description" VARCHAR(600),
    "profileImage" TEXT,
    "companyLogo" TEXT,
    "email" VARCHAR(254),
    "phone" VARCHAR(40),
    "whatsapp" VARCHAR(40),
    "website" VARCHAR(500),
    "address" VARCHAR(300),
    "mapsUrl" VARCHAR(1000),
    "socialLinks" JSONB NOT NULL DEFAULT '[]',
    "designSettings" JSONB NOT NULL DEFAULT '{}',
    "qrSettings" JSONB NOT NULL DEFAULT '{}',
    "status" "CardStatus" NOT NULL DEFAULT 'DRAFT',
    "language" "Language" NOT NULL DEFAULT 'en',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "business_cards_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "card_analytics" (
    "id" UUID NOT NULL,
    "cardId" UUID NOT NULL,
    "eventType" "AnalyticsEventType" NOT NULL,
    "visitorSessionId" VARCHAR(64),
    "referrer" VARCHAR(255),
    "meta" VARCHAR(40),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "card_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "wallet_passes" (
    "id" UUID NOT NULL,
    "cardId" UUID NOT NULL,
    "platform" "WalletPlatform" NOT NULL,
    "externalObjectId" VARCHAR(255),
    "serialNumber" VARCHAR(64) NOT NULL,
    "status" "WalletPassStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "wallet_passes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "apple_device_registrations" (
    "id" UUID NOT NULL,
    "walletPassId" UUID NOT NULL,
    "deviceLibraryIdentifier" VARCHAR(255) NOT NULL,
    "pushToken" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "apple_device_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_verification_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_verification_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "email_change_tokens" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "newEmail" VARCHAR(254) NOT NULL,
    "tokenHash" VARCHAR(64) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "email_change_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "userAgent" VARCHAR(255),
    "ipAddress" VARCHAR(64),
    "rememberMe" BOOLEAN NOT NULL DEFAULT false,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "business_cards_slug_key" ON "business_cards"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "business_cards_publicId_key" ON "business_cards"("publicId");

-- CreateIndex
CREATE INDEX "business_cards_userId_createdAt_idx" ON "business_cards"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "business_cards_userId_status_idx" ON "business_cards"("userId", "status");

-- CreateIndex
CREATE INDEX "card_analytics_cardId_createdAt_idx" ON "card_analytics"("cardId", "createdAt");

-- CreateIndex
CREATE INDEX "card_analytics_cardId_eventType_createdAt_idx" ON "card_analytics"("cardId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "card_analytics_cardId_visitorSessionId_idx" ON "card_analytics"("cardId", "visitorSessionId");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_passes_serialNumber_key" ON "wallet_passes"("serialNumber");

-- CreateIndex
CREATE INDEX "wallet_passes_platform_lastUpdatedAt_idx" ON "wallet_passes"("platform", "lastUpdatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "wallet_passes_cardId_platform_key" ON "wallet_passes"("cardId", "platform");

-- CreateIndex
CREATE INDEX "apple_device_registrations_deviceLibraryIdentifier_idx" ON "apple_device_registrations"("deviceLibraryIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "apple_device_registrations_deviceLibraryIdentifier_walletPa_key" ON "apple_device_registrations"("deviceLibraryIdentifier", "walletPassId");

-- CreateIndex
CREATE UNIQUE INDEX "email_verification_tokens_tokenHash_key" ON "email_verification_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "email_verification_tokens_userId_idx" ON "email_verification_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "email_change_tokens_tokenHash_key" ON "email_change_tokens"("tokenHash");

-- CreateIndex
CREATE INDEX "email_change_tokens_userId_idx" ON "email_change_tokens"("userId");

-- CreateIndex
CREATE INDEX "sessions_userId_expiresAt_idx" ON "sessions"("userId", "expiresAt");

-- AddForeignKey
ALTER TABLE "business_cards" ADD CONSTRAINT "business_cards_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "card_analytics" ADD CONSTRAINT "card_analytics_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "business_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "wallet_passes" ADD CONSTRAINT "wallet_passes_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "business_cards"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "apple_device_registrations" ADD CONSTRAINT "apple_device_registrations_walletPassId_fkey" FOREIGN KEY ("walletPassId") REFERENCES "wallet_passes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_verification_tokens" ADD CONSTRAINT "email_verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "email_change_tokens" ADD CONSTRAINT "email_change_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

