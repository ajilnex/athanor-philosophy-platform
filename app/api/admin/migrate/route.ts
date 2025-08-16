import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * ENDPOINT TEMPORAIRE DE MIGRATION
 * À supprimer après application des migrations en production
 */
export async function POST() {
  try {
    // Vérification admin uniquement
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role

    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    console.log('🔄 Starting database migration...')

    // Migration 1: Ajouter VISITOR à enum Role et table Comment
    await prisma.$executeRawUnsafe(`
      -- AlterEnum: Ajouter VISITOR si pas déjà présent
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'VISITOR' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'Role')) THEN
          ALTER TYPE "public"."Role" ADD VALUE 'VISITOR';
        END IF;
      END $$;
    `)

    console.log('✅ Step 1: Enum Role updated')

    // Migration 2: Créer table Comment si elle n'existe pas
    await prisma.$executeRawUnsafe(`
      -- CreateTable Comment
      CREATE TABLE IF NOT EXISTS "public"."Comment" (
          "id" TEXT NOT NULL,
          "content" TEXT NOT NULL,
          "authorId" TEXT NOT NULL,
          "targetType" TEXT NOT NULL,
          "targetId" TEXT NOT NULL,
          "parentId" TEXT,
          "isApproved" BOOLEAN NOT NULL DEFAULT false,
          "isVisible" BOOLEAN NOT NULL DEFAULT true,
          "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
          
          CONSTRAINT "Comment_pkey" PRIMARY KEY ("id")
      );
    `)

    console.log('✅ Step 2: Comment table created')

    // Migration 3: Créer les index
    await prisma.$executeRawUnsafe(`
      -- CreateIndex (ignore if exists)
      DO $$
      BEGIN
        -- Index principal targetType + targetId + createdAt
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Comment_targetType_targetId_createdAt_idx') THEN
          CREATE INDEX "Comment_targetType_targetId_createdAt_idx" ON "public"."Comment"("targetType", "targetId", "createdAt");
        END IF;
        
        -- Index modération
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Comment_isApproved_isVisible_idx') THEN
          CREATE INDEX "Comment_isApproved_isVisible_idx" ON "public"."Comment"("isApproved", "isVisible");
        END IF;
        
        -- Index auteur
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Comment_authorId_idx') THEN
          CREATE INDEX "Comment_authorId_idx" ON "public"."Comment"("authorId");
        END IF;
        
        -- Index parentId + createdAt (pour replies)
        IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'Comment_parentId_createdAt_idx') THEN
          CREATE INDEX "Comment_parentId_createdAt_idx" ON "public"."Comment"("parentId", "createdAt");
        END IF;
      END $$;
    `)

    console.log('✅ Step 3: Indexes created')

    // Migration 4: Ajouter les contraintes de clé étrangère
    await prisma.$executeRawUnsafe(`
      -- AddForeignKey (ignore if exists)
      DO $$
      BEGIN
        -- FK vers User
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Comment_authorId_fkey') THEN
          ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_authorId_fkey" 
          FOREIGN KEY ("authorId") REFERENCES "public"."User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
        
        -- FK vers Comment parent (avec CASCADE DELETE)
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'Comment_parentId_fkey') THEN
          ALTER TABLE "public"."Comment" ADD CONSTRAINT "Comment_parentId_fkey" 
          FOREIGN KEY ("parentId") REFERENCES "public"."Comment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        END IF;
      END $$;
    `)

    console.log('✅ Step 4: Foreign keys created')

    // Migration 5: Ajouter colonne isSealed aux articles si nécessaire
    await prisma.$executeRawUnsafe(`
      -- AlterTable Article: Ajouter isSealed si pas présent
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Article' AND column_name = 'isSealed') THEN
          ALTER TABLE "public"."Article" ADD COLUMN "isSealed" BOOLEAN NOT NULL DEFAULT false;
        END IF;
      END $$;
    `)

    console.log('✅ Step 5: Article.isSealed column added')

    // Test de fonctionnement
    const commentCount = await prisma.comment.count()
    console.log(
      `✅ Migration completed successfully! Comment table ready (${commentCount} existing comments)`
    )

    return NextResponse.json({
      success: true,
      message: 'Migration completed successfully',
      commentCount,
    })
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json(
      {
        error: 'Migration failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}

// GET pour vérifier le statut
export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    const userRole = (session?.user as any)?.role

    if (userRole !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    // Vérifier si la table Comment existe
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'Comment'
      );
    `

    const commentCount = await prisma.comment.count().catch(() => null)

    return NextResponse.json({
      tableExists: (tableExists as any)[0]?.exists || false,
      commentCount,
      ready: commentCount !== null,
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Status check failed',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
