-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "lastGeneratedCommitHash" TEXT,
ADD COLUMN     "needsArchitectureUpdate" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "pendingCommitData" JSONB,
ADD COLUMN     "pendingCommitTimestamp" TIMESTAMP(3);
