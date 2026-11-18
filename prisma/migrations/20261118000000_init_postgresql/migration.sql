-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "externalUserId" TEXT NOT NULL,
    "bio" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Stream" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "thumbnailUrl" TEXT,
    "ingressId" TEXT,
    "serverUrl" TEXT,
    "streamKey" TEXT,
    "isLive" BOOLEAN NOT NULL DEFAULT false,
    "isChatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isChatDelayed" BOOLEAN NOT NULL DEFAULT false,
    "isChatFollowersOnly" BOOLEAN NOT NULL DEFAULT false,
    "broadcastSource" VARCHAR(16),
    "broadcastSessionId" VARCHAR(64),
    "broadcastLeaseExpiresAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Stream_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatRateLimit" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "senderId" TEXT NOT NULL,
    "nextAllowedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuestChatRateLimit" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "senderIdentity" VARCHAR(128) NOT NULL,
    "nextAllowedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuestChatRateLimit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatModeration" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "participantIdentity" VARCHAR(128) NOT NULL,
    "participantUserId" TEXT,
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "timedOutUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatModeration_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WatchSession" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "broadcastSessionId" VARCHAR(64) NOT NULL,
    "participantSid" VARCHAR(128) NOT NULL,
    "participantIdentity" VARCHAR(128) NOT NULL,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endedAt" TIMESTAMP(3),

    CONSTRAINT "WatchSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Follow" (
    "id" TEXT NOT NULL,
    "followerId" TEXT NOT NULL,
    "followingId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Follow_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoAsset" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "kind" VARCHAR(16) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "description" TEXT,
    "storageKey" TEXT NOT NULL,
    "playbackUrl" TEXT,
    "thumbnailUrl" TEXT,
    "mimeType" VARCHAR(128),
    "sizeBytes" BIGINT,
    "durationSeconds" INTEGER,
    "visibility" VARCHAR(16) NOT NULL DEFAULT 'private',
    "processingState" VARCHAR(20) NOT NULL DEFAULT 'queued',
    "sourceStartedAt" TIMESTAMP(3),
    "sourceEndedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoAsset_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Clip" (
    "id" TEXT NOT NULL,
    "videoAssetId" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "ownerUserId" TEXT NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "startSeconds" INTEGER NOT NULL,
    "endSeconds" INTEGER NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'queued',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clip_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelPointBalance" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "balance" BIGINT NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelPointBalance_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelPointTransaction" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "amount" BIGINT NOT NULL,
    "reason" VARCHAR(32) NOT NULL,
    "referenceId" VARCHAR(191),
    "idempotencyKey" VARCHAR(191) NOT NULL,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelPointTransaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelReward" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "title" VARCHAR(80) NOT NULL,
    "description" VARCHAR(500),
    "cost" INTEGER NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "cooldownSeconds" INTEGER NOT NULL DEFAULT 0,
    "maxPerUser" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChannelReward_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelRole" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" VARCHAR(24) NOT NULL,
    "grantedBy" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatCommand" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "name" VARCHAR(32) NOT NULL,
    "response" VARCHAR(500) NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "cooldownSeconds" INTEGER NOT NULL DEFAULT 0,
    "lastUsedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatCommand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChannelEmote" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "name" VARCHAR(32) NOT NULL,
    "imageUrl" TEXT NOT NULL,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChannelEmote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "type" VARCHAR(32) NOT NULL,
    "title" VARCHAR(120) NOT NULL,
    "body" VARCHAR(500),
    "targetUrl" TEXT,
    "actorId" TEXT,
    "dedupeKey" VARCHAR(191),
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Raid" (
    "id" TEXT NOT NULL,
    "sourceStreamId" TEXT NOT NULL,
    "targetStreamId" TEXT NOT NULL,
    "initiatedBy" TEXT NOT NULL,
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "status" VARCHAR(20) NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "Raid_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Subscription" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "subscriberUserId" TEXT NOT NULL,
    "provider" VARCHAR(24) NOT NULL,
    "providerCustomerId" VARCHAR(191),
    "providerSubscriptionId" VARCHAR(191),
    "status" VARCHAR(24) NOT NULL,
    "tier" VARCHAR(32) NOT NULL DEFAULT 'standard',
    "currentPeriodStart" TIMESTAMP(3),
    "currentPeriodEnd" TIMESTAMP(3),
    "cancelAtPeriodEnd" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StreamAnalyticsDaily" (
    "id" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "day" DATE NOT NULL,
    "totalLiveSeconds" BIGINT NOT NULL DEFAULT 0,
    "uniqueViewers" INTEGER NOT NULL DEFAULT 0,
    "peakViewers" INTEGER NOT NULL DEFAULT 0,
    "totalViewerSeconds" BIGINT NOT NULL DEFAULT 0,
    "chatMessages" INTEGER NOT NULL DEFAULT 0,
    "follows" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "StreamAnalyticsDaily_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RecentlyWatched" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "streamId" TEXT NOT NULL,
    "watchedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RecentlyWatched_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_externalUserId_key" ON "User"("externalUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Stream_ingressId_key" ON "Stream"("ingressId");

-- CreateIndex
CREATE UNIQUE INDEX "Stream_userId_key" ON "Stream"("userId");

-- CreateIndex
CREATE INDEX "Stream_userId_idx" ON "Stream"("userId");

-- CreateIndex
CREATE INDEX "Stream_ingressId_idx" ON "Stream"("ingressId");

-- CreateIndex
CREATE INDEX "Stream_broadcastSessionId_idx" ON "Stream"("broadcastSessionId");

-- CreateIndex
CREATE INDEX "ChatRateLimit_nextAllowedAt_idx" ON "ChatRateLimit"("nextAllowedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChatRateLimit_streamId_senderId_key" ON "ChatRateLimit"("streamId", "senderId");

-- CreateIndex
CREATE INDEX "GuestChatRateLimit_nextAllowedAt_idx" ON "GuestChatRateLimit"("nextAllowedAt");

-- CreateIndex
CREATE UNIQUE INDEX "GuestChatRateLimit_streamId_senderIdentity_key" ON "GuestChatRateLimit"("streamId", "senderIdentity");

-- CreateIndex
CREATE INDEX "ChatModeration_streamId_isBanned_idx" ON "ChatModeration"("streamId", "isBanned");

-- CreateIndex
CREATE INDEX "ChatModeration_timedOutUntil_idx" ON "ChatModeration"("timedOutUntil");

-- CreateIndex
CREATE UNIQUE INDEX "ChatModeration_streamId_participantIdentity_key" ON "ChatModeration"("streamId", "participantIdentity");

-- CreateIndex
CREATE INDEX "WatchSession_streamId_participantIdentity_endedAt_idx" ON "WatchSession"("streamId", "participantIdentity", "endedAt");

-- CreateIndex
CREATE INDEX "WatchSession_startedAt_idx" ON "WatchSession"("startedAt");

-- CreateIndex
CREATE UNIQUE INDEX "WatchSession_streamId_broadcastSessionId_participantSid_key" ON "WatchSession"("streamId", "broadcastSessionId", "participantSid");

-- CreateIndex
CREATE INDEX "Follow_followerId_idx" ON "Follow"("followerId");

-- CreateIndex
CREATE INDEX "Follow_followingId_idx" ON "Follow"("followingId");

-- CreateIndex
CREATE UNIQUE INDEX "Follow_followerId_followingId_key" ON "Follow"("followerId", "followingId");

-- CreateIndex
CREATE INDEX "Block_blockerId_idx" ON "Block"("blockerId");

-- CreateIndex
CREATE INDEX "Block_blockedId_idx" ON "Block"("blockedId");

-- CreateIndex
CREATE UNIQUE INDEX "Block_blockerId_blockedId_key" ON "Block"("blockerId", "blockedId");

-- CreateIndex
CREATE INDEX "VideoAsset_ownerUserId_createdAt_idx" ON "VideoAsset"("ownerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "VideoAsset_streamId_kind_createdAt_idx" ON "VideoAsset"("streamId", "kind", "createdAt");

-- CreateIndex
CREATE INDEX "VideoAsset_processingState_createdAt_idx" ON "VideoAsset"("processingState", "createdAt");

-- CreateIndex
CREATE INDEX "Clip_videoAssetId_startSeconds_idx" ON "Clip"("videoAssetId", "startSeconds");

-- CreateIndex
CREATE INDEX "Clip_streamId_createdAt_idx" ON "Clip"("streamId", "createdAt");

-- CreateIndex
CREATE INDEX "Clip_ownerUserId_createdAt_idx" ON "Clip"("ownerUserId", "createdAt");

-- CreateIndex
CREATE INDEX "ChannelPointBalance_userId_updatedAt_idx" ON "ChannelPointBalance"("userId", "updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelPointBalance_streamId_userId_key" ON "ChannelPointBalance"("streamId", "userId");

-- CreateIndex
CREATE INDEX "ChannelPointTransaction_streamId_userId_createdAt_idx" ON "ChannelPointTransaction"("streamId", "userId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelPointTransaction_streamId_idempotencyKey_key" ON "ChannelPointTransaction"("streamId", "idempotencyKey");

-- CreateIndex
CREATE INDEX "ChannelReward_streamId_isEnabled_idx" ON "ChannelReward"("streamId", "isEnabled");

-- CreateIndex
CREATE INDEX "ChannelRole_streamId_role_idx" ON "ChannelRole"("streamId", "role");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelRole_streamId_userId_role_key" ON "ChannelRole"("streamId", "userId", "role");

-- CreateIndex
CREATE INDEX "ChatCommand_streamId_enabled_idx" ON "ChatCommand"("streamId", "enabled");

-- CreateIndex
CREATE UNIQUE INDEX "ChatCommand_streamId_name_key" ON "ChatCommand"("streamId", "name");

-- CreateIndex
CREATE INDEX "ChannelEmote_streamId_isEnabled_idx" ON "ChannelEmote"("streamId", "isEnabled");

-- CreateIndex
CREATE UNIQUE INDEX "ChannelEmote_streamId_name_key" ON "ChannelEmote"("streamId", "name");

-- CreateIndex
CREATE INDEX "Notification_userId_readAt_createdAt_idx" ON "Notification"("userId", "readAt", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_userId_dedupeKey_key" ON "Notification"("userId", "dedupeKey");

-- CreateIndex
CREATE INDEX "Raid_targetStreamId_createdAt_idx" ON "Raid"("targetStreamId", "createdAt");

-- CreateIndex
CREATE INDEX "Raid_sourceStreamId_createdAt_idx" ON "Raid"("sourceStreamId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Subscription_providerSubscriptionId_key" ON "Subscription"("providerSubscriptionId");

-- CreateIndex
CREATE INDEX "Subscription_streamId_status_createdAt_idx" ON "Subscription"("streamId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Subscription_subscriberUserId_status_idx" ON "Subscription"("subscriberUserId", "status");

-- CreateIndex
CREATE INDEX "StreamAnalyticsDaily_streamId_day_idx" ON "StreamAnalyticsDaily"("streamId", "day");

-- CreateIndex
CREATE UNIQUE INDEX "StreamAnalyticsDaily_streamId_day_key" ON "StreamAnalyticsDaily"("streamId", "day");

-- CreateIndex
CREATE INDEX "RecentlyWatched_userId_watchedAt_idx" ON "RecentlyWatched"("userId", "watchedAt");

-- CreateIndex
CREATE UNIQUE INDEX "RecentlyWatched_userId_streamId_key" ON "RecentlyWatched"("userId", "streamId");

-- AddForeignKey
ALTER TABLE "Stream" ADD CONSTRAINT "Stream_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRateLimit" ADD CONSTRAINT "ChatRateLimit_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatRateLimit" ADD CONSTRAINT "ChatRateLimit_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuestChatRateLimit" ADD CONSTRAINT "GuestChatRateLimit_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatModeration" ADD CONSTRAINT "ChatModeration_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatModeration" ADD CONSTRAINT "ChatModeration_participantUserId_fkey" FOREIGN KEY ("participantUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WatchSession" ADD CONSTRAINT "WatchSession_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "Stream"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Follow" ADD CONSTRAINT "Follow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Block" ADD CONSTRAINT "Block_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

