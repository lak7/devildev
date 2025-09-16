-- AlterTable
ALTER TABLE "User" ADD COLUMN     "githubInstallationId" BIGINT,
ADD COLUMN     "isGithubAppConnected" BOOLEAN NOT NULL DEFAULT false;
