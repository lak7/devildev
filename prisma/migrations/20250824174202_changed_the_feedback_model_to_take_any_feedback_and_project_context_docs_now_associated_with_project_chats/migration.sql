/*
  Warnings:

  - You are about to drop the column `chatId` on the `Feedback` table. All the data in the column will be lost.
  - You are about to drop the column `projectId` on the `ProjectContextDocs` table. All the data in the column will be lost.
  - Added the required column `page` to the `Feedback` table without a default value. This is not possible if the table is not empty.
  - Added the required column `projectChatId` to the `ProjectContextDocs` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProjectContextDocs" DROP CONSTRAINT "ProjectContextDocs_projectId_fkey";

-- AlterTable
ALTER TABLE "Feedback" DROP COLUMN "chatId",
ADD COLUMN     "page" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProjectContextDocs" DROP COLUMN "projectId",
ADD COLUMN     "projectChatId" BIGINT NOT NULL;

-- AddForeignKey
ALTER TABLE "ProjectContextDocs" ADD CONSTRAINT "ProjectContextDocs_projectChatId_fkey" FOREIGN KEY ("projectChatId") REFERENCES "ProjectChat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
