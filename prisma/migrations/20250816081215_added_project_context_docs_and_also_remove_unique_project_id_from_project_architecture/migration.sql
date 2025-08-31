-- DropIndex
DROP INDEX "ProjectArchitecture_projectId_key";

-- CreateTable
CREATE TABLE "ProjectContextDocs" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "projectRules" TEXT,
    "humanReview" TEXT,
    "plan" TEXT,
    "phases" JSONB,
    "phaseCount" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProjectContextDocs_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProjectContextDocs" ADD CONSTRAINT "ProjectContextDocs_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
