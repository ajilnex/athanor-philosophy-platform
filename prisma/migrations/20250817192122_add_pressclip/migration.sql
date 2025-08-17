-- CreateTable
CREATE TABLE "public"."PressClip" (
    "id" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "image" TEXT,
    "siteName" TEXT,
    "author" TEXT,
    "note" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" TEXT,

    CONSTRAINT "PressClip_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PressClip_isPublished_createdAt_idx" ON "public"."PressClip"("isPublished", "createdAt");

-- AddForeignKey
ALTER TABLE "public"."PressClip" ADD CONSTRAINT "PressClip_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
