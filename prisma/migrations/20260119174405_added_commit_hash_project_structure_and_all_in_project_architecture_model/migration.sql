/*
  Warnings:

  - A unique constraint covering the columns `[commitHash]` on the table `ProjectArchitecture` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "ProjectArchitecture" ADD COLUMN     "beforeCommitHash" TEXT,
ADD COLUMN     "branchName" TEXT,
ADD COLUMN     "commitHash" TEXT,
ADD COLUMN     "commitMessage" TEXT,
ADD COLUMN     "projectStructure" JSONB;

-- CreateIndex
CREATE UNIQUE INDEX "ProjectArchitecture_commitHash_key" ON "ProjectArchitecture"("commitHash");
