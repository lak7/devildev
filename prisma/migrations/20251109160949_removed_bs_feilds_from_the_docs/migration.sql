/*
  Warnings:

  - You are about to drop the column `humanReview` on the `ContextualDocs` table. All the data in the column will be lost.
  - You are about to drop the column `isHumanReviewComplete` on the `ContextualDocs` table. All the data in the column will be lost.
  - You are about to drop the column `isPlanComplete` on the `ContextualDocs` table. All the data in the column will be lost.
  - You are about to drop the column `isProjectRulesComplete` on the `ContextualDocs` table. All the data in the column will be lost.
  - You are about to drop the column `plan` on the `ContextualDocs` table. All the data in the column will be lost.
  - You are about to drop the column `projectRules` on the `ContextualDocs` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "ContextualDocs" DROP COLUMN "humanReview",
DROP COLUMN "isHumanReviewComplete",
DROP COLUMN "isPlanComplete",
DROP COLUMN "isProjectRulesComplete",
DROP COLUMN "plan",
DROP COLUMN "projectRules";
