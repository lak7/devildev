/*
  Warnings:

  - A unique constraint covering the columns `[repoId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "repoId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Project_repoId_key" ON "Project"("repoId");
