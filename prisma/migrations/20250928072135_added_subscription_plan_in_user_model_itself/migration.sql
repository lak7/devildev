/*
  Warnings:

  - The values [FREE] on the enum `SubscriptionStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `plan` on the `Subscription` table. All the data in the column will be lost.

*/
-- AlterEnum
ALTER TYPE "SubscriptionPlan" ADD VALUE 'FREE';

-- AlterEnum
BEGIN;
CREATE TYPE "SubscriptionStatus_new" AS ENUM ('NONE', 'ACTIVE', 'CANCELLED', 'ON_HOLD');
ALTER TABLE "Subscription" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Subscription" ALTER COLUMN "status" TYPE "SubscriptionStatus_new" USING ("status"::text::"SubscriptionStatus_new");
ALTER TYPE "SubscriptionStatus" RENAME TO "SubscriptionStatus_old";
ALTER TYPE "SubscriptionStatus_new" RENAME TO "SubscriptionStatus";
DROP TYPE "SubscriptionStatus_old";
ALTER TABLE "Subscription" ALTER COLUMN "status" SET DEFAULT 'NONE';
COMMIT;

-- AlterTable
ALTER TABLE "Subscription" DROP COLUMN "plan",
ALTER COLUMN "status" SET DEFAULT 'NONE';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "subscriptionPlan" "SubscriptionPlan" NOT NULL DEFAULT 'FREE';
