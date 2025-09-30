"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export interface ChatMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: string; // Changed to string for JSON compatibility
  isStreaming?: boolean;
}

// Create a new chat with a specific ID (for localStorage flow)
export async function createChatWithId(chatId: string, initialMessage: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Check if chat with this ID already exists
    const existingChat = await db.chat.findUnique({
      where: { id: chatId },
    });

    if (existingChat) {
      // Chat already exists, return success
      return { success: true, chatId: existingChat.id };
    }

    // Ensure user exists in database
    const user = await db.user.findUnique({
      where: { id: userId },
    });

    // Create initial message object
    const initialMessageObj: ChatMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: initialMessage,
      timestamp: new Date().toISOString(),
    };

    // Create new chat with specific ID and initial message
    const chat = await db.chat.create({
      data: {
        id: chatId,
        userId: userId,
        messages: [initialMessageObj] as any,
        title: initialMessage.length > 50 
          ? initialMessage.substring(0, 50) + "..." 
          : initialMessage,
      },
    });

    return { success: true, chatId: chat.id };
  } catch (error) {
    console.error("Error creating chat with ID:", error);
    return { success: false, error: "Failed to create chat" };
  }
}

// Get chat by ID
export async function getChat(chatId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const chat = await db.chat.findFirst({
      where: {
        id: chatId,
        userId: userId,
      },
    });

    if (!chat) {
      return { success: false, error: "Chat not found" };
    }

    return { success: true, chat };
  } catch (error) {
    console.error("Error getting chat:", error);
    return { success: false, error: "Failed to get chat" };
  }
}

// Add message to existing chat
export async function addMessageToChat(chatId: string, message: ChatMessage) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Get current chat
    const existingChat = await db.chat.findFirst({
      where: {
        id: chatId,
        userId: userId,
      },
    });

    if (!existingChat) {
      throw new Error("Chat not found");
    }

    // Add new message to existing messages
    const currentMessages = existingChat.messages as unknown as ChatMessage[];
    const updatedMessages = [...currentMessages, message];

    // Update chat with new message
    const updatedChat = await db.chat.update({
      where: { id: chatId },
      data: {
        messages: updatedMessages as any,
        updatedAt: new Date(),
      },
    });

    return { success: true, chat: updatedChat };
  } catch (error) {
    console.error("Error adding message to chat:", error);
    return { success: false, error: "Failed to add message" };
  }
}
 
// Update multiple messages in chat (for streaming updates)
export async function updateChatMessages(chatId: string, messages: ChatMessage[]) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Verify chat ownership
    const existingChat = await db.chat.findFirst({
      where: {
        id: chatId,
        userId: userId,
      },
    });

    if (!existingChat) {
      throw new Error("Chat not found");
    }

    // Update chat with all messages
    const updatedChat = await db.chat.update({
      where: { id: chatId },
      data: {
        messages: messages as any,
        updatedAt: new Date(),
      },
    });

    revalidatePath(`/dev/${chatId}`);
    return { success: true, chat: updatedChat };
  } catch (error) {
    console.error("Error updating chat messages:", error);
    return { success: false, error: "Failed to update messages" };
  }
}

// Get user's recent chats
export async function getUserChats(limit: number = 15) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    const user = await db.user.findUnique({
      where: { id: userId },
      include: {
        subscription: true,
        chats: {
          orderBy: { updatedAt: 'desc' },
          take: limit,
          select: {
            id: true,
            title: true,
            updatedAt: true,
            createdAt: true,
          },
        },
      },
    });

    return { success: true, chats: user?.chats, user: user, subscription: user?.subscription };
  } catch (error) {
    console.error("Error getting user chats:", error);
    return { success: false, error: "Failed to get chats" };
  }
}
