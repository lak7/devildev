/*
  Warnings:

  - A unique constraint covering the columns `[githubId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "githubAccessToken" TEXT,
ADD COLUMN     "githubAvatarUrl" TEXT,
ADD COLUMN     "githubConnectedAt" TIMESTAMP(3),
ADD COLUMN     "githubEmail" TEXT,
ADD COLUMN     "githubId" TEXT,
ADD COLUMN     "githubUsername" TEXT,
ADD COLUMN     "isGithubConnected" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE UNIQUE INDEX "User_githubId_key" ON "User"("githubId");
