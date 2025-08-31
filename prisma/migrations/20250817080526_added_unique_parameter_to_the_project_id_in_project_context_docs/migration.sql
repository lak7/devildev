/*
  Warnings:

  - A unique constraint covering the columns `[projectId]` on the table `ProjectContextDocs` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "ProjectContextDocs_projectId_key" ON "ProjectContextDocs"("projectId");
