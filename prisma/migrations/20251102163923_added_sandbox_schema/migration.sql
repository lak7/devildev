-- CreateTable
CREATE TABLE "SandboxDeployment" (
    "id" TEXT NOT NULL,
    "chatId" TEXT NOT NULL,
    "sandboxId" TEXT,
    "sandboxUrl" TEXT,
    "filesList" JSONB,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SandboxDeployment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SandboxDeployment_chatId_idx" ON "SandboxDeployment"("chatId");

-- CreateIndex
CREATE INDEX "SandboxDeployment_id_status_idx" ON "SandboxDeployment"("id", "status");

-- AddForeignKey
ALTER TABLE "SandboxDeployment" ADD CONSTRAINT "SandboxDeployment_chatId_fkey" FOREIGN KEY ("chatId") REFERENCES "Chat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
