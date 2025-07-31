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

-- CreateIndex
CREATE UNIQUE INDEX "Architecture_chatId_key" ON "Architecture"("chatId");

-- AddForeignKey
ALTER TABLE "Architecture" ADD CONSTRAINT "Architecture_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
