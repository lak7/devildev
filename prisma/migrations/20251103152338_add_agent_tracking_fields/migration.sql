-- AlterTable
ALTER TABLE "SandboxDeployment" ADD COLUMN     "agentCompletedAt" TIMESTAMP(3),
ADD COLUMN     "agentError" TEXT,
ADD COLUMN     "agentStartedAt" TIMESTAMP(3),
ADD COLUMN     "agentStatus" TEXT NOT NULL DEFAULT 'not_started',
ADD COLUMN     "currentPhase" INTEGER;
