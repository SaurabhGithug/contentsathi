-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "PlatformType" AS ENUM ('instagram', 'linkedin', 'youtube', 'x', 'facebook', 'whatsapp', 'website');

-- CreateEnum
CREATE TYPE "LanguageType" AS ENUM ('english', 'hindi', 'marathi', 'hinglish');

-- CreateEnum
CREATE TYPE "PostStatus" AS ENUM ('draft', 'ready', 'scheduled', 'published', 'failed');

-- CreateEnum
CREATE TYPE "AssetType" AS ENUM ('post', 'carousel', 'shorts_script', 'blog_article', 'email_newsletter', 'whatsapp_broadcast', 'video_script', 'image_prompt');

-- CreateEnum
CREATE TYPE "PlanTier" AS ENUM ('free', 'starter', 'creator', 'agency');

-- CreateEnum
CREATE TYPE "UrgencyLevel" AS ENUM ('low', 'medium', 'high');

-- CreateEnum
CREATE TYPE "BillingCycle" AS ENUM ('monthly', 'yearly');

-- CreateEnum
CREATE TYPE "SubscriptionStatus" AS ENUM ('active', 'cancelled', 'expired', 'trial');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "name" TEXT,
    "phone" TEXT,
    "avatarUrl" TEXT,
    "planTier" "PlanTier" NOT NULL DEFAULT 'free',
    "planExpiresAt" TIMESTAMP(3),
    "creditsBalance" INTEGER NOT NULL DEFAULT 100,
    "creditsLifetimeUsed" INTEGER NOT NULL DEFAULT 0,
    "trialStartedAt" TIMESTAMP(3),
    "trialEndsAt" TIMESTAMP(3),
    "linkedinPostsToday" INTEGER NOT NULL DEFAULT 0,
    "linkedinPostsResetAt" TIMESTAMP(3),
    "platformLangPrefs" JSONB,
    "onboardingCompleted" BOOLEAN NOT NULL DEFAULT false,
    "notifyOnPublish" BOOLEAN NOT NULL DEFAULT true,
    "notifyOnFailure" BOOLEAN NOT NULL DEFAULT true,
    "notifyWeeklyDigest" BOOLEAN NOT NULL DEFAULT false,
    "notifyWhatsappNumber" TEXT,
    "isAdmin" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "agent_tasks" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "goal" TEXT NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'whatsapp',
    "status" TEXT NOT NULL DEFAULT 'processing',
    "progress" INTEGER NOT NULL DEFAULT 0,
    "currentAgent" TEXT NOT NULL DEFAULT 'Orchestrator',
    "deepResearchData" JSONB,
    "generatedContent" JSONB,
    "completedAt" TIMESTAMP(3),
    "logs" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "agent_tasks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_brains" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "brandName" TEXT,
    "brandDescription" TEXT,
    "industry" TEXT,
    "location" TEXT,
    "audienceDescription" TEXT,
    "tone" TEXT,
    "primaryLanguage" "LanguageType" NOT NULL DEFAULT 'hinglish',
    "secondaryLanguage" "LanguageType",
    "languageMixRules" TEXT,
    "ctas" JSONB,
    "contactPhone" TEXT,
    "contactEmail" TEXT,
    "contactWebsite" TEXT,
    "propertyType" TEXT,
    "customerType" TEXT,
    "contentPurpose" TEXT,
    "usps" TEXT[],
    "contentDna" JSONB,
    "goldenExamples" TEXT[],
    "competitorHandles" TEXT[],
    "orchestratorMemory" TEXT,
    "orchestratorChatHistory" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "content_brains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_accounts" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "platform" "PlatformType" NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiry" TIMESTAMP(3),
    "accountId" TEXT,
    "accountName" TEXT,
    "pageId" TEXT,
    "pageName" TEXT,
    "channelId" TEXT,
    "channelName" TEXT,
    "metadata" JSONB,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generated_assets" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "parentAssetId" TEXT,
    "sourceId" TEXT,
    "type" "AssetType" NOT NULL,
    "platform" "PlatformType",
    "language" "LanguageType",
    "title" TEXT,
    "body" TEXT NOT NULL,
    "tags" TEXT[],
    "cta" TEXT,
    "notes" TEXT,
    "imageUrl" TEXT,
    "imagePrompt" TEXT,
    "qualityScore" INTEGER,
    "qualityIssues" JSONB,
    "isGoldenExample" BOOLEAN NOT NULL DEFAULT false,
    "isCustomTemplate" BOOLEAN NOT NULL DEFAULT false,
    "templateName" TEXT,
    "templateVariables" JSONB,
    "publishCount" INTEGER NOT NULL DEFAULT 0,
    "generationHash" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "generated_assets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "calendar_items" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "generatedAssetId" TEXT,
    "platform" "PlatformType" NOT NULL,
    "status" "PostStatus" NOT NULL DEFAULT 'draft',
    "scheduledAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "failureReason" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "platformPostId" TEXT,
    "platformPostUrl" TEXT,
    "notes" TEXT,
    "isSuggested" BOOLEAN NOT NULL DEFAULT false,
    "festivalTag" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "calendar_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "publish_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "calendarItemId" TEXT,
    "generatedAssetId" TEXT,
    "platform" "PlatformType" NOT NULL,
    "status" TEXT NOT NULL,
    "platformPostId" TEXT,
    "platformPostUrl" TEXT,
    "errorMessage" TEXT,
    "errorCode" TEXT,
    "retryCount" INTEGER NOT NULL DEFAULT 0,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "publish_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "post_analytics" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "publishLogId" TEXT,
    "generatedAssetId" TEXT,
    "platform" "PlatformType" NOT NULL,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "views" INTEGER NOT NULL DEFAULT 0,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    "engagementRate" DOUBLE PRECISION,
    "fetchedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "post_analytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "website_connections" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "websiteName" TEXT NOT NULL,
    "websiteUrl" TEXT NOT NULL,
    "webhookUrl" TEXT NOT NULL,
    "apiKey" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastSyncedAt" TIMESTAMP(3),
    "totalPostsSent" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "website_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_suggestions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "topicSuggestion" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "urgency" "UrgencyLevel" NOT NULL DEFAULT 'medium',
    "platform" "PlatformType",
    "templateType" TEXT,
    "isTrending" BOOLEAN NOT NULL DEFAULT false,
    "festivalTag" TEXT,
    "pillar" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "wasUsed" BOOLEAN NOT NULL DEFAULT false,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_suggestions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "weekly_insights" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "weekStartDate" TIMESTAMP(3) NOT NULL,
    "insightText" TEXT NOT NULL,
    "topObservations" TEXT[],
    "thingsToStop" TEXT[],
    "contentIdea" TEXT,
    "dataSnapshot" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "weekly_insights_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "creditsUsed" INTEGER NOT NULL DEFAULT 0,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "usage_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "planTier" "PlanTier" NOT NULL,
    "billingCycle" "BillingCycle" NOT NULL,
    "status" "SubscriptionStatus" NOT NULL DEFAULT 'active',
    "razorpayOrderId" TEXT,
    "razorpayPaymentId" TEXT,
    "razorpaySubId" TEXT,
    "amountPaid" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'INR',
    "gstAmount" INTEGER,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "api_keys" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "keyHash" TEXT NOT NULL,
    "keyPrefix" TEXT NOT NULL,
    "name" TEXT,
    "lastUsedAt" TIMESTAMP(3),
    "requestCount" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "api_keys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_endpoints" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "events" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "failureCount" INTEGER NOT NULL DEFAULT 0,
    "lastTriggeredAt" TIMESTAMP(3),
    "lastStatusCode" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "webhook_endpoints_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "webhook_delivery_logs" (
    "id" TEXT NOT NULL,
    "webhookEndpointId" TEXT NOT NULL,
    "event" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "responseStatus" INTEGER,
    "responseBody" TEXT,
    "attemptNumber" INTEGER NOT NULL DEFAULT 1,
    "success" BOOLEAN NOT NULL DEFAULT false,
    "deliveredAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "webhook_delivery_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "festival_calendar" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameMarathi" TEXT,
    "nameHindi" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "year" INTEGER NOT NULL,
    "type" TEXT NOT NULL,
    "region" TEXT NOT NULL DEFAULT 'all_india',
    "contentAngle" TEXT,
    "suggestedTopics" TEXT[],
    "urgencyDaysBefore" INTEGER NOT NULL DEFAULT 3,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "festival_calendar_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nagpur_localities" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "zone" TEXT,
    "connectedTo" TEXT[],
    "schools" TEXT[],
    "hospitals" TEXT[],
    "malls" TEXT[],
    "upcomingInfra" TEXT[],
    "avgPlotPriceMin" INTEGER,
    "avgPlotPriceMax" INTEGER,
    "priceUnit" TEXT NOT NULL DEFAULT 'per_sqft',
    "appreciationYoY" TEXT,
    "distanceAirport" TEXT,
    "distanceRailway" TEXT,
    "distanceHighway" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nagpur_localities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "generation_cache" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "hash" TEXT NOT NULL,
    "result" JSONB NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "generation_cache_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_sequences" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_sequences_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_sequence_steps" (
    "id" TEXT NOT NULL,
    "sequenceId" TEXT NOT NULL,
    "stepNumber" INTEGER NOT NULL,
    "delayDays" INTEGER NOT NULL DEFAULT 0,
    "messageBody" TEXT NOT NULL,
    "assetId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_sequence_steps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "waitlist" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "waitlist_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "agent_tasks_userId_status_idx" ON "agent_tasks"("userId", "status");

-- CreateIndex
CREATE INDEX "agent_tasks_status_createdAt_idx" ON "agent_tasks"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "content_brains_userId_key" ON "content_brains"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "social_accounts_userId_platform_key" ON "social_accounts"("userId", "platform");

-- CreateIndex
CREATE INDEX "generated_assets_userId_platform_language_idx" ON "generated_assets"("userId", "platform", "language");

-- CreateIndex
CREATE INDEX "generated_assets_userId_createdAt_idx" ON "generated_assets"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "generated_assets_generationHash_idx" ON "generated_assets"("generationHash");

-- CreateIndex
CREATE INDEX "calendar_items_userId_scheduledAt_idx" ON "calendar_items"("userId", "scheduledAt");

-- CreateIndex
CREATE INDEX "calendar_items_userId_status_idx" ON "calendar_items"("userId", "status");

-- CreateIndex
CREATE INDEX "calendar_items_status_scheduledAt_idx" ON "calendar_items"("status", "scheduledAt");

-- CreateIndex
CREATE INDEX "publish_logs_userId_platform_idx" ON "publish_logs"("userId", "platform");

-- CreateIndex
CREATE INDEX "publish_logs_userId_publishedAt_idx" ON "publish_logs"("userId", "publishedAt");

-- CreateIndex
CREATE INDEX "post_analytics_userId_platform_idx" ON "post_analytics"("userId", "platform");

-- CreateIndex
CREATE INDEX "post_analytics_publishLogId_idx" ON "post_analytics"("publishLogId");

-- CreateIndex
CREATE INDEX "website_connections_userId_idx" ON "website_connections"("userId");

-- CreateIndex
CREATE INDEX "website_connections_apiKey_idx" ON "website_connections"("apiKey");

-- CreateIndex
CREATE INDEX "content_suggestions_userId_date_idx" ON "content_suggestions"("userId", "date");

-- CreateIndex
CREATE UNIQUE INDEX "weekly_insights_userId_weekStartDate_key" ON "weekly_insights"("userId", "weekStartDate");

-- CreateIndex
CREATE INDEX "usage_logs_userId_createdAt_idx" ON "usage_logs"("userId", "createdAt");

-- CreateIndex
CREATE INDEX "usage_logs_userId_action_idx" ON "usage_logs"("userId", "action");

-- CreateIndex
CREATE INDEX "subscriptions_userId_status_idx" ON "subscriptions"("userId", "status");

-- CreateIndex
CREATE INDEX "subscriptions_razorpayOrderId_idx" ON "subscriptions"("razorpayOrderId");

-- CreateIndex
CREATE UNIQUE INDEX "api_keys_keyHash_key" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "api_keys_userId_idx" ON "api_keys"("userId");

-- CreateIndex
CREATE INDEX "api_keys_keyHash_idx" ON "api_keys"("keyHash");

-- CreateIndex
CREATE INDEX "webhook_endpoints_userId_idx" ON "webhook_endpoints"("userId");

-- CreateIndex
CREATE INDEX "webhook_delivery_logs_webhookEndpointId_idx" ON "webhook_delivery_logs"("webhookEndpointId");

-- CreateIndex
CREATE INDEX "festival_calendar_date_idx" ON "festival_calendar"("date");

-- CreateIndex
CREATE UNIQUE INDEX "festival_calendar_name_year_key" ON "festival_calendar"("name", "year");

-- CreateIndex
CREATE UNIQUE INDEX "nagpur_localities_name_key" ON "nagpur_localities"("name");

-- CreateIndex
CREATE INDEX "generation_cache_expiresAt_idx" ON "generation_cache"("expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "generation_cache_userId_hash_key" ON "generation_cache"("userId", "hash");

-- CreateIndex
CREATE INDEX "whatsapp_sequences_userId_isActive_idx" ON "whatsapp_sequences"("userId", "isActive");

-- CreateIndex
CREATE INDEX "whatsapp_sequence_steps_sequenceId_stepNumber_idx" ON "whatsapp_sequence_steps"("sequenceId", "stepNumber");

-- CreateIndex
CREATE UNIQUE INDEX "waitlist_email_key" ON "waitlist"("email");

-- CreateIndex
CREATE INDEX "waitlist_email_idx" ON "waitlist"("email");

-- AddForeignKey
ALTER TABLE "agent_tasks" ADD CONSTRAINT "agent_tasks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_brains" ADD CONSTRAINT "content_brains_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_accounts" ADD CONSTRAINT "social_accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_assets" ADD CONSTRAINT "generated_assets_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "generated_assets" ADD CONSTRAINT "generated_assets_parentAssetId_fkey" FOREIGN KEY ("parentAssetId") REFERENCES "generated_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_items" ADD CONSTRAINT "calendar_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "calendar_items" ADD CONSTRAINT "calendar_items_generatedAssetId_fkey" FOREIGN KEY ("generatedAssetId") REFERENCES "generated_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publish_logs" ADD CONSTRAINT "publish_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publish_logs" ADD CONSTRAINT "publish_logs_calendarItemId_fkey" FOREIGN KEY ("calendarItemId") REFERENCES "calendar_items"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "publish_logs" ADD CONSTRAINT "publish_logs_generatedAssetId_fkey" FOREIGN KEY ("generatedAssetId") REFERENCES "generated_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_analytics" ADD CONSTRAINT "post_analytics_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_analytics" ADD CONSTRAINT "post_analytics_publishLogId_fkey" FOREIGN KEY ("publishLogId") REFERENCES "publish_logs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_analytics" ADD CONSTRAINT "post_analytics_generatedAssetId_fkey" FOREIGN KEY ("generatedAssetId") REFERENCES "generated_assets"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "website_connections" ADD CONSTRAINT "website_connections_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_suggestions" ADD CONSTRAINT "content_suggestions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "weekly_insights" ADD CONSTRAINT "weekly_insights_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_logs" ADD CONSTRAINT "usage_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "api_keys" ADD CONSTRAINT "api_keys_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_endpoints" ADD CONSTRAINT "webhook_endpoints_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "webhook_delivery_logs" ADD CONSTRAINT "webhook_delivery_logs_webhookEndpointId_fkey" FOREIGN KEY ("webhookEndpointId") REFERENCES "webhook_endpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_sequences" ADD CONSTRAINT "whatsapp_sequences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_sequence_steps" ADD CONSTRAINT "whatsapp_sequence_steps_sequenceId_fkey" FOREIGN KEY ("sequenceId") REFERENCES "whatsapp_sequences"("id") ON DELETE CASCADE ON UPDATE CASCADE;

