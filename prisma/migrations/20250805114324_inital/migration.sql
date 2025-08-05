-- CreateTable
CREATE TABLE "WaitList" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WaitList_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Devlogs" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "coverImage" TEXT,
    "publishedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedDate" TIMESTAMP(3) NOT NULL,
    "tags" TEXT[],
    "categories" TEXT[],
    "readingTime" INTEGER,
    "excerpt" TEXT,
    "seoTitleTag" TEXT,
    "seoMetaDescription" TEXT,
    "seoCanonicalUrl" TEXT,
    "ogTitle" TEXT,
    "ogDescription" TEXT,
    "ogImage" TEXT,
    "twitterCard" TEXT,
    "twitterTitle" TEXT,
    "twitterDescription" TEXT,
    "twitterImage" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Devlogs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "username" TEXT,
    "level" TEXT DEFAULT 'beginner',
    "preferredIde" TEXT DEFAULT 'vscode',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Chat" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "messages" JSONB[],
    "title" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Chat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Architecture" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "domain" TEXT,
    "complexity" TEXT,
    "architectureRationale" TEXT,
    "components" JSONB NOT NULL,
    "connectionLabels" JSONB,
    "componentPositions" JSONB,
    "requirement" TEXT,
    "generatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastPositionUpdate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Architecture_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "Feedback" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "feedback" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "WaitList_email_key" ON "WaitList"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Devlogs_title_key" ON "Devlogs"("title");

-- CreateIndex
CREATE UNIQUE INDEX "Devlogs_slug_key" ON "Devlogs"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Architecture_chatId_key" ON "Architecture"("chatId");

-- CreateIndex
CREATE UNIQUE INDEX "ContextualDocs_chatId_key" ON "ContextualDocs"("chatId");

-- AddForeignKey
ALTER TABLE "Chat" ADD CONSTRAINT "Chat_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Architecture" ADD CONSTRAINT "Architecture_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContextualDocs" ADD CONSTRAINT "ContextualDocs_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
