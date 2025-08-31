/*
  Warnings:

  - A unique constraint covering the columns `[projectId]` on the table `ProjectArchitecture` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ProjectContextDocs" ADD COLUMN     "contextName" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "ProjectArchitecture_projectId_key" ON "ProjectArchitecture"("projectId");
