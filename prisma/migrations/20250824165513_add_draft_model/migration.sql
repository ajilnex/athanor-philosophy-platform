/*
  Warnings:

  - You are about to drop the `PressClip` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."PressClip" DROP CONSTRAINT "PressClip_createdById_fkey";

-- DropTable
DROP TABLE "public"."PressClip";

-- CreateTable
CREATE TABLE "public"."Draft" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT,
    "content" TEXT NOT NULL,
    "tags" TEXT[],
    "excerpt" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Draft_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Draft_slug_key" ON "public"."Draft"("slug");

-- CreateIndex
CREATE INDEX "Draft_userId_updatedAt_idx" ON "public"."Draft"("userId", "updatedAt");

-- AddForeignKey
ALTER TABLE "public"."Draft" ADD CONSTRAINT "Draft_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
