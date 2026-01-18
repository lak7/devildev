-- AlterTable: Remove unique constraint from projectId to allow multiple architectures per project
ALTER TABLE "ProjectArchitecture" DROP CONSTRAINT IF EXISTS "ProjectArchitecture_projectId_key";

-- DropIndex: Remove the unique index
DROP INDEX IF EXISTS "ProjectArchitecture_projectId_key";

-- CreateIndex: Add composite index for efficient "latest architecture" queries
CREATE INDEX IF NOT EXISTS "ProjectArchitecture_projectId_createdAt_idx" ON "ProjectArchitecture"("projectId", "createdAt" DESC);
