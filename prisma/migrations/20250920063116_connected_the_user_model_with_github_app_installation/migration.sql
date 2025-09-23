/*
  Warnings:

  - You are about to drop the column `githubInstallationId` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[userId]` on the table `GitHubAppInstallation` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "GitHubAppInstallation" ADD COLUMN     "userId" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "githubInstallationId";

-- CreateIndex
CREATE UNIQUE INDEX "GitHubAppInstallation_userId_key" ON "GitHubAppInstallation"("userId");

-- AddForeignKey
ALTER TABLE "GitHubAppInstallation" ADD CONSTRAINT "GitHubAppInstallation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
