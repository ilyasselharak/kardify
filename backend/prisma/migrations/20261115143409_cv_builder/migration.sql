-- CreateEnum
CREATE TYPE "CvVisibility" AS ENUM ('PRIVATE', 'UNLISTED', 'PUBLIC');

-- CreateEnum
CREATE TYPE "CvSectionKey" AS ENUM ('summary', 'experience', 'education', 'skills', 'projects', 'certifications', 'languages', 'awards', 'publications', 'volunteer', 'interests', 'references');

-- CreateEnum
CREATE TYPE "CvSkillCategory" AS ENUM ('TECHNICAL', 'SOFT', 'LANGUAGE', 'TOOL');

-- CreateEnum
CREATE TYPE "CvExtraKind" AS ENUM ('AWARD', 'PUBLICATION', 'VOLUNTEER', 'INTEREST', 'REFERENCE');

-- CreateTable
CREATE TABLE "cv_profiles" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "fullName" VARCHAR(120) NOT NULL DEFAULT '',
    "professionalTitle" VARCHAR(120) NOT NULL DEFAULT '',
    "photo" VARCHAR(1000),
    "email" VARCHAR(254),
    "phone" VARCHAR(40),
    "address" VARCHAR(200),
    "city" VARCHAR(100),
    "country" VARCHAR(100),
    "website" VARCHAR(500),
    "linkedin" VARCHAR(500),
    "github" VARCHAR(500),
    "portfolio" VARCHAR(500),
    "summary" VARCHAR(2000) NOT NULL DEFAULT '',
    "objectives" VARCHAR(1000) NOT NULL DEFAULT '',
    "achievements" VARCHAR(2000) NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cv_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cvs" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "template" VARCHAR(40) NOT NULL DEFAULT 'modern',
    "language" "Language" NOT NULL DEFAULT 'en',
    "headline" VARCHAR(120),
    "summary" VARCHAR(2000),
    "design" JSONB NOT NULL DEFAULT '{}',
    "visibility" "CvVisibility" NOT NULL DEFAULT 'PRIVATE',
    "allowDownload" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cvs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_public_links" (
    "id" UUID NOT NULL,
    "cvId" UUID NOT NULL,
    "slug" VARCHAR(80) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cv_public_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_sections" (
    "id" UUID NOT NULL,
    "cvId" UUID NOT NULL,
    "key" "CvSectionKey" NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "position" INTEGER NOT NULL,
    "title" VARCHAR(60),

    CONSTRAINT "cv_sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_experiences" (
    "id" UUID NOT NULL,
    "cvId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "jobTitle" VARCHAR(120) NOT NULL,
    "company" VARCHAR(120) NOT NULL,
    "location" VARCHAR(120),
    "employmentType" VARCHAR(20),
    "startDate" VARCHAR(7),
    "endDate" VARCHAR(7),
    "current" BOOLEAN NOT NULL DEFAULT false,
    "responsibilities" VARCHAR(3000) NOT NULL DEFAULT '',
    "achievements" VARCHAR(2000) NOT NULL DEFAULT '',

    CONSTRAINT "cv_experiences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_educations" (
    "id" UUID NOT NULL,
    "cvId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "degree" VARCHAR(160) NOT NULL,
    "institution" VARCHAR(160) NOT NULL,
    "location" VARCHAR(120),
    "startDate" VARCHAR(7),
    "endDate" VARCHAR(7),
    "description" VARCHAR(1500) NOT NULL DEFAULT '',
    "grade" VARCHAR(40),

    CONSTRAINT "cv_educations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_skills" (
    "id" UUID NOT NULL,
    "cvId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "name" VARCHAR(80) NOT NULL,
    "category" "CvSkillCategory" NOT NULL DEFAULT 'TECHNICAL',
    "level" SMALLINT,

    CONSTRAINT "cv_skills_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_projects" (
    "id" UUID NOT NULL,
    "cvId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "name" VARCHAR(120) NOT NULL,
    "description" VARCHAR(2000) NOT NULL DEFAULT '',
    "technologies" VARCHAR(300) NOT NULL DEFAULT '',
    "url" VARCHAR(500),
    "githubUrl" VARCHAR(500),
    "startDate" VARCHAR(7),
    "endDate" VARCHAR(7),
    "image" VARCHAR(1000),

    CONSTRAINT "cv_projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_certifications" (
    "id" UUID NOT NULL,
    "cvId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "name" VARCHAR(160) NOT NULL,
    "issuer" VARCHAR(160) NOT NULL,
    "issueDate" VARCHAR(7),
    "expirationDate" VARCHAR(7),
    "credentialUrl" VARCHAR(500),

    CONSTRAINT "cv_certifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_languages" (
    "id" UUID NOT NULL,
    "cvId" UUID NOT NULL,
    "position" INTEGER NOT NULL,
    "language" VARCHAR(60) NOT NULL,
    "proficiency" VARCHAR(20) NOT NULL,

    CONSTRAINT "cv_languages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cv_extra_items" (
    "id" UUID NOT NULL,
    "cvId" UUID NOT NULL,
    "kind" "CvExtraKind" NOT NULL,
    "position" INTEGER NOT NULL,
    "title" VARCHAR(160) NOT NULL,
    "subtitle" VARCHAR(160),
    "date" VARCHAR(40),
    "url" VARCHAR(500),
    "description" VARCHAR(1500) NOT NULL DEFAULT '',

    CONSTRAINT "cv_extra_items_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cv_profiles_userId_key" ON "cv_profiles"("userId");

-- CreateIndex
CREATE INDEX "cvs_userId_updatedAt_idx" ON "cvs"("userId", "updatedAt");

-- CreateIndex
CREATE INDEX "cvs_userId_visibility_idx" ON "cvs"("userId", "visibility");

-- CreateIndex
CREATE UNIQUE INDEX "cv_public_links_cvId_key" ON "cv_public_links"("cvId");

-- CreateIndex
CREATE UNIQUE INDEX "cv_public_links_slug_key" ON "cv_public_links"("slug");

-- CreateIndex
CREATE INDEX "cv_sections_cvId_position_idx" ON "cv_sections"("cvId", "position");

-- CreateIndex
CREATE UNIQUE INDEX "cv_sections_cvId_key_key" ON "cv_sections"("cvId", "key");

-- CreateIndex
CREATE INDEX "cv_experiences_cvId_position_idx" ON "cv_experiences"("cvId", "position");

-- CreateIndex
CREATE INDEX "cv_educations_cvId_position_idx" ON "cv_educations"("cvId", "position");

-- CreateIndex
CREATE INDEX "cv_skills_cvId_position_idx" ON "cv_skills"("cvId", "position");

-- CreateIndex
CREATE INDEX "cv_projects_cvId_position_idx" ON "cv_projects"("cvId", "position");

-- CreateIndex
CREATE INDEX "cv_certifications_cvId_position_idx" ON "cv_certifications"("cvId", "position");

-- CreateIndex
CREATE INDEX "cv_languages_cvId_position_idx" ON "cv_languages"("cvId", "position");

-- CreateIndex
CREATE INDEX "cv_extra_items_cvId_kind_position_idx" ON "cv_extra_items"("cvId", "kind", "position");

-- AddForeignKey
ALTER TABLE "cv_profiles" ADD CONSTRAINT "cv_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cvs" ADD CONSTRAINT "cvs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_public_links" ADD CONSTRAINT "cv_public_links_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_sections" ADD CONSTRAINT "cv_sections_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_experiences" ADD CONSTRAINT "cv_experiences_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_educations" ADD CONSTRAINT "cv_educations_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_skills" ADD CONSTRAINT "cv_skills_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_projects" ADD CONSTRAINT "cv_projects_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_certifications" ADD CONSTRAINT "cv_certifications_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_languages" ADD CONSTRAINT "cv_languages_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "cv_extra_items" ADD CONSTRAINT "cv_extra_items_cvId_fkey" FOREIGN KEY ("cvId") REFERENCES "cvs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
