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
 





//IDK
export async function getUserById(userId: string) {
  try {
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        chats: {
          orderBy: { updatedAt: 'desc' },
        },
      },
    });
    return user;
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export async function updateUserProfile(
  userId: string,
  data: {
    username?: string;
    level?: string;
    preferredIde?: string;
  }
) {
  try {
    const user = await db.user.update({
      where: { id: userId },
      data,
    });
    return user;
  } catch (error) {
    console.error('Error updating user:', error);
    throw error;
  }
}



export async function updateChatMessages(
  chatId: string,
  messages: Array<{
    id: string;
    type: 'user' | 'assistant';
    content: string;
    timestamp: Date;
  }>
) {
  try {
    const chat = await db.chat.update({
      where: { id: chatId },
      data: { messages },
    });
    return chat;
  } catch (error) {
    console.error('Error updating chat messages:', error);
    throw error;
  }
}

export async function getUserChats(userId: string) {
  try {
    const chats = await db.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
    });
    return chats;
  } catch (error) {
    console.error('Error fetching user chats:', error);
    return [];
  }
}

export async function contact(data: {
  name: string;
  email: string;
  message: string;
}) {
  try {
    // Validate input
    const contactSchema = z.object({
      name: z.string().min(1, "Name is required").max(100, "Name is too long"),
      email: z.string().email("Invalid email address"),
      message: z.string().min(10, "Message must be at least 10 characters").max(2500, "Message is too long"),
    });

    const validatedData = contactSchema.safeParse(data);

    if (!validatedData.success) {
      return {
        error: "Validation failed",
        issues: validatedData.error.flatten().fieldErrors,
      };
    }

    // Save contact message to database
    await db.contact.create({
      data: {
        name: validatedData.data.name,
        email: validatedData.data.email,
        message: validatedData.data.message,
      },
    });

    return { success: "Message sent successfully! We'll get back to you soon." };
  } catch (error) {
    console.error("Error saving contact message:", error);
    return { error: "Failed to send message", details: String(error) };
  }
}