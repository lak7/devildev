"use server";
import { db } from "@/lib/db";
import { z } from "zod";

export async function joinWaitlist(email: string) {
  try {
    // Validate email format
    const emailSchema = z.object({
      email: z.string().email("Invalid email address"),
    });

    const validatedEmail = emailSchema.safeParse({ email });

    if (!validatedEmail.success) {
      return {
        error: "Invalid email",
        issues: validatedEmail.error.flatten().fieldErrors,
      };
    }

    // Check if the email is already in the waitlist
    const existingWaitlistEntry = await db.waitList.findUnique({
      where: { email: validatedEmail.data.email },
    });

    if (existingWaitlistEntry) {
      return { error: "Email already in waitlist" };
    }

    // Add to waitlist
    await db.waitList.create({
      data: {
        email: validatedEmail.data.email,
      },
    });

    return { success: "Successfully joined the waitlist!" };
  } catch (error) {
    console.error("Error joining waitlist:", error);
    return { error: "Failed to join waitlist", details: String(error) };
  }
}
