-- CreateTable
CREATE TABLE "ContextualDocs" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "projectRules" TEXT,
    "humanReview" TEXT,
    "plan" TEXT,
    "prd" TEXT,
    "bugTracking" TEXT,
    "projectStructure" TEXT,
    "uiUX" TEXT,
    "phases" JSONB,
    "phaseCount" INTEGER,
    "requirement" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastDocUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isProjectRulesComplete" BOOLEAN NOT NULL DEFAULT false,
    "isHumanReviewComplete" BOOLEAN NOT NULL DEFAULT false,
    "isPlanComplete" BOOLEAN NOT NULL DEFAULT false,
    "isPrdComplete" BOOLEAN NOT NULL DEFAULT false,
    "isBugTrackingComplete" BOOLEAN NOT NULL DEFAULT false,
    "isProjectStructureComplete" BOOLEAN NOT NULL DEFAULT false,
    "isUiUXComplete" BOOLEAN NOT NULL DEFAULT false,
    "arePhasesComplete" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ContextualDocs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ContextualDocs_chatId_key" ON "ContextualDocs"("chatId");

-- AddForeignKey
ALTER TABLE "ContextualDocs" ADD CONSTRAINT "ContextualDocs_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
