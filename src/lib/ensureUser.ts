import { clerkClient } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { signUpInitialSouls } from '../../Limits';

/**
 * Ensures that a Clerk user exists in the local database.
 * If the user doesn't exist, fetches their info from Clerk and creates the record.
 * Returns the user record.
 */
export async function ensureUserExists(userId: string) {
  const existing = await db.user.findUnique({ where: { id: userId } });
  if (existing) return existing;

  const clerk = await clerkClient();
  const clerkUser = await clerk.users.getUser(userId);

  const primaryEmail = clerkUser.emailAddresses.find(
    (e) => e.id === clerkUser.primaryEmailAddressId,
  );

  if (!primaryEmail) {
    throw new Error(`No primary email found for Clerk user ${userId}`);
  }

  return db.user.create({
    data: {
      id: userId,
      email: primaryEmail.emailAddress,
      name:
        clerkUser.firstName && clerkUser.lastName
          ? `${clerkUser.firstName} ${clerkUser.lastName}`
          : clerkUser.firstName || clerkUser.lastName || null,
      username: clerkUser.username || null,
      credits: signUpInitialSouls,
    },
  });
}
