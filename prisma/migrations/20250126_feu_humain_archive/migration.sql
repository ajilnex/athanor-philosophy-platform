-- CreateTable: Archive de conversation FEU HUMAIN
CREATE TABLE "ConversationArchive" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "threadType" TEXT,
    "participantCount" INTEGER NOT NULL DEFAULT 0,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "metadata" JSONB,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConversationArchive_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Participants de la conversation
CREATE TABLE "ConversationParticipant" (
    "id" TEXT NOT NULL,
    "archiveId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "firstMessageAt" TIMESTAMP(3),
    "lastMessageAt" TIMESTAMP(3),
    "metadata" JSONB,

    CONSTRAINT "ConversationParticipant_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Messages de la conversation
CREATE TABLE "ConversationMessage" (
    "id" TEXT NOT NULL,
    "archiveId" TEXT NOT NULL,
    "participantId" TEXT,
    "senderName" TEXT NOT NULL,
    "content" TEXT,
    "timestamp" BIGINT NOT NULL,
    "timestampDate" TIMESTAMP(3) NOT NULL,
    "messageType" TEXT DEFAULT 'text',
    "metadata" JSONB,
    "searchVector" tsvector,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Médias attachés aux messages
CREATE TABLE "ConversationMedia" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "originalUri" TEXT NOT NULL,
    "cloudinaryUrl" TEXT,
    "cloudinaryPublicId" TEXT,
    "thumbnailUrl" TEXT,
    "fileName" TEXT,
    "fileSize" INTEGER,
    "mimeType" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "duration" INTEGER,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Réactions sur les messages
CREATE TABLE "ConversationReaction" (
    "id" TEXT NOT NULL,
    "messageId" TEXT NOT NULL,
    "participantId" TEXT,
    "actorName" TEXT NOT NULL,
    "reaction" TEXT NOT NULL,
    "timestamp" BIGINT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ConversationReaction_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConversationArchive_slug_key" ON "ConversationArchive"("slug");
CREATE INDEX "ConversationMessage_archiveId_timestamp_idx" ON "ConversationMessage"("archiveId", "timestamp");
CREATE INDEX "ConversationMessage_participantId_idx" ON "ConversationMessage"("participantId");
CREATE INDEX "ConversationMessage_timestamp_idx" ON "ConversationMessage"("timestamp");
CREATE INDEX "ConversationMessage_searchVector_idx" ON "ConversationMessage" USING GIN ("searchVector");
CREATE INDEX "ConversationMedia_messageId_idx" ON "ConversationMedia"("messageId");
CREATE INDEX "ConversationMedia_type_idx" ON "ConversationMedia"("type");
CREATE INDEX "ConversationReaction_messageId_idx" ON "ConversationReaction"("messageId");

-- AddForeignKey
ALTER TABLE "ConversationParticipant" ADD CONSTRAINT "ConversationParticipant_archiveId_fkey" 
    FOREIGN KEY ("archiveId") REFERENCES "ConversationArchive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_archiveId_fkey" 
    FOREIGN KEY ("archiveId") REFERENCES "ConversationArchive"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConversationMessage" ADD CONSTRAINT "ConversationMessage_participantId_fkey" 
    FOREIGN KEY ("participantId") REFERENCES "ConversationParticipant"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "ConversationMedia" ADD CONSTRAINT "ConversationMedia_messageId_fkey" 
    FOREIGN KEY ("messageId") REFERENCES "ConversationMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ConversationReaction" ADD CONSTRAINT "ConversationReaction_messageId_fkey" 
    FOREIGN KEY ("messageId") REFERENCES "ConversationMessage"("id") ON DELETE CASCADE ON UPDATE CASCADE;