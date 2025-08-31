/*
  Warnings:

  - You are about to drop the `ProjectChat` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ProjectChat" DROP CONSTRAINT "ProjectChat_projectId_fkey";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "messages" JSONB[] DEFAULT ARRAY[]::JSONB[];

-- DropTable
DROP TABLE "ProjectChat";
