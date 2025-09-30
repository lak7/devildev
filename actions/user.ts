"use server";
import { db } from "@/lib/db";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";

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
    name?: string;
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
    // Handle unique username violation gracefully
    if (typeof error === 'object' && error && (error as any).code === 'P2002') {
      return {
        error: 'Username already taken',
      } as const;
    }
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

// Server action to save user profile from a <form action={...}> in a Client Component
export async function saveUserProfile(
  userId: string,
  formData: FormData
) {
  try {
    const schema = z.object({
      name: z
        .string()
        .trim()
        .max(100, 'Name is too long')
        .optional()
        .transform((v) => (v === '' ? undefined : v)),
      username: z
        .string()
        .trim()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username is too long')
        .regex(/^[a-zA-Z0-9_\.\-]+$/, 'Only letters, numbers, underscore, dot, and hyphen allowed')
        .optional()
        .transform((v) => (v === '' ? undefined : v)),
      level: z
        .enum(['beginner', 'intermediate', 'advanced'])
        .optional(),
      preferredIde: z
        .enum(['cursor', 'vscode', 'windsurf', 'other'])
        .optional(),
    });

    const parsed = schema.safeParse({
      name: formData.get('name') as string | null,
      username: formData.get('username') as string | null,
      level: (formData.get('level') as string | null)?.toLowerCase() ?? undefined,
      preferredIde: (formData.get('preferredIde') as string | null)?.toLowerCase() ?? undefined,
    });

    if (!parsed.success) {
      return {
        error: 'Validation failed',
        issues: parsed.error.flatten().fieldErrors,
      } as const;
    }

    const updateResult = await updateUserProfile(userId, parsed.data);

    if ((updateResult as any)?.error) {
      return updateResult;
    }

    return { success: 'Profile updated' } as const;
  } catch (error) {
    console.error('Error saving user profile:', error);
    return { error: 'Failed to update profile' } as const;
  }
}

// Fetch the current user's profile (server-authenticated)
export async function getCurrentUserProfile() {
  try {
    const { userId } = await auth();
    if (!userId) {
      return { error: 'Not authenticated' } as const;
    }
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        level: true,
        preferredIde: true,
      },
    });
    if (!user) {
      return { error: 'User not found' } as const;
    }
    return { success: true, data: user } as const;
  } catch (error) {
    console.error('Error fetching current user profile:', error);
    return { error: 'Failed to fetch profile' } as const;
  }
}

export async function fetchUserInstallationIdProjectAndPlan(userId: string) {
  try {
    // Fetch user with GitHub App installation, projects, and subscription in one query
    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        githubAppInstallation: true,
        projects: {
          select: {
            id: true,
            name: true,
            repoId: true,
            repoFullName: true,
          },
        },
        subscription: true,
      },
    });

    if (!user) {
      return { error: 'User not found' } as const;
    }

    // Shape installation similar to /api/github/app/installations
    const installation = user.githubAppInstallation
      ? {
          userPlan: user.subscriptionPlan,
          id: user.githubAppInstallation.id,
          installationId: user.githubAppInstallation.installationId
            ? user.githubAppInstallation.installationId.toString()
            : null,
          accountLogin: user.githubAppInstallation.accountLogin,
          accountId: user.githubAppInstallation.accountId
            ? user.githubAppInstallation.accountId.toString()
            : null,
          accountType: user.githubAppInstallation.accountType,
          repositorySelection: user.githubAppInstallation.repositorySelection,
        }
      : null;

    // Use included relations for projects and subscription
    const projects = (user as any).projects ?? [];
    const subscription = (user as any).subscription ?? null;

    return {
      success: true as const,
      user,
      projects,
      installation,
      subscription,
    };
  } catch (error) {
    console.error('Error fetching user, installation, projects, and subscription:', error);
    return { error: 'Failed to fetch user data bundle' } as const;
  }
}