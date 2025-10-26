"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Types for architecture data
export interface ComponentPosition {
  x: number;
  y: number;
}

export interface ComponentData {
  id: string;
  title: string;
  icon: string;
  color: string;
  borderColor: string;
  technologies: {
    primary: string;
    framework?: string;
    additional?: string;
  };
  connections: string[];
  position: ComponentPosition;
  dataFlow: {
    sends: string[];
    receives: string[];
  };
  purpose: string;
}

export interface ArchitectureData {
  components: ComponentData[];
  connectionLabels: Record<string, string>;
  architectureRationale?: string;
  domain?: string;
  complexity?: string;
}

export interface ArchitectureInput {
  chatId: string;
  architectureData: ArchitectureData;
  requirement?: string;
  componentPositions?: Record<string, ComponentPosition>;
}

// Create or update architecture for a chat
export async function saveArchitecture(input: ArchitectureInput) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Verify chat ownership
    const chat = await db.chat.findFirst({
      where: {
        id: input.chatId,
        userId: userId,
      },
    });

    if (!chat) {
      throw new Error("Chat not found or access denied");
    }

    // Extract component positions from architecture data if not provided separately
    const componentPositions = input.componentPositions || 
      input.architectureData.components.reduce((acc, component) => {
        acc[component.id] = component.position;
        return acc;
      }, {} as Record<string, ComponentPosition>);

    // Upsert architecture
    const architecture = await db.architecture.create({
      data: {
        chatId: input.chatId,
        domain: input.architectureData.domain,
        complexity: input.architectureData.complexity,
        architectureRationale: input.architectureData.architectureRationale,
        components: input.architectureData.components as any,
        connectionLabels: input.architectureData.connectionLabels as any,
        componentPositions: componentPositions as any,
        requirement: input.requirement,
        generatedAt: new Date(),
        lastPositionUpdate: new Date(),
      },
    });

    revalidatePath(`/dev/${input.chatId}`);
    return { success: true, architecture };
  } catch (error) {
    console.error("Error saving architecture:", error);
    return { success: false, error: "Failed to save architecture" };
  }
} 

export async function saveArchitectureWithUserId(architectureId: string, input: ArchitectureInput, userId: string) {
  try {
    // Verify chat ownership
    const chat = await db.chat.findFirst({
      where: {
        id: input.chatId,
        userId: userId,
      },
    });

    if (!chat) {
      throw new Error("Chat not found or access denied");
    }

    // Extract component positions from architecture data if not provided separately
    const componentPositions = input.componentPositions || 
      input.architectureData.components.reduce((acc, component) => {
        acc[component.id] = component.position;
        return acc;
      }, {} as Record<string, ComponentPosition>);

    // Upsert architecture
    const architecture = await db.architecture.create({
      data: {
        id: architectureId,
        chatId: input.chatId,
        domain: input.architectureData.domain,
        complexity: input.architectureData.complexity,
        architectureRationale: input.architectureData.architectureRationale,
        components: input.architectureData.components as any,
        connectionLabels: input.architectureData.connectionLabels as any,
        componentPositions: componentPositions as any,
        requirement: input.requirement,
        generatedAt: new Date(),
        lastPositionUpdate: new Date(),
      },
    });

    revalidatePath(`/dev/${input.chatId}`);
    return { success: true, architecture };
  } catch (error) {
    console.error("Error saving architecture:", error);
    return { success: false, error: "Failed to save architecture" };
  }
} 

// Get all architectures for a chat
export async function getArchitecture(chatId: string) {

  console.log("In getArchitecture Step 0");
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Verify chat ownership and get all architectures
    const chatWithArchitecture = await db.chat.findFirst({
      where: {
        id: chatId,
        userId: userId,
      },
      include: {
        architecture: {
          orderBy: {
            createdAt: 'asc', // Order by creation time, oldest first
          },
        },
      },
    });

    if (!chatWithArchitecture) {
      return { success: false, error: "Chat not found or access denied" };
    }

    if (!chatWithArchitecture.architecture || chatWithArchitecture.architecture.length === 0) {
      return { success: true, architectures: [], count: 0, architecture: null };
    }

    console.log("The architecture count is: ", chatWithArchitecture.architecture.length);

    // Parse all architectures
    const architectures = chatWithArchitecture.architecture.map((arch: any) => {
      const architectureData: ArchitectureData = { 
        components: arch.components as unknown as ComponentData[],
        connectionLabels: arch.connectionLabels as Record<string, string> || {},
        architectureRationale: arch.architectureRationale || undefined,
        domain: arch.domain || undefined,
        complexity: arch.complexity || undefined,
      };

      const componentPositions = arch.componentPositions as unknown as Record<string, ComponentPosition> || {};

      return {
        architecture: architectureData,
        componentPositions,
        metadata: {
          id: arch.id,
          requirement: arch.requirement,
          generatedAt: arch.generatedAt,
          lastPositionUpdate: arch.lastPositionUpdate,
          createdAt: arch.createdAt,
          updatedAt: arch.updatedAt,
        }
      };
    });

    // Return all architectures with the latest one for backward compatibility
    const latestArchitecture = architectures[architectures.length - 1];

    return { 
      success: true,
      architectures, // All architectures
      count: architectures.length, // Total count
      architecture: latestArchitecture.architecture, // Latest architecture for backward compatibility
      componentPositions: latestArchitecture.componentPositions,
      metadata: latestArchitecture.metadata,
    };
  } catch (error) {
    console.error("Error getting architecture:", error);
    return { success: false, error: "Failed to get architecture" };
  }
}

// Update only component positions (for performance during dragging)
export async function updateComponentPositions(
  chatId: string, 
  positions: Record<string, ComponentPosition>
) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Verify chat ownership
    const chat = await db.chat.findFirst({
      where: {
        id: chatId,
        userId: userId,
      },
    });

    if (!chat) {
      throw new Error("Chat not found or access denied");
    }

    // Update only positions - find the architecture first
    const existingArchitecture = await db.architecture.findFirst({
      where: {
        chatId: chatId,
      },
    });

    if (!existingArchitecture) {
      throw new Error("Architecture not found");
    }

    const architecture = await db.architecture.update({
      where: {
        id: existingArchitecture.id,
      },
      data: {
        componentPositions: positions as any,
        lastPositionUpdate: new Date(),
        updatedAt: new Date(),
      },
    });

    // Don't revalidate for position updates to avoid excessive re-renders
    return { success: true, architecture };
  } catch (error) {
    console.error("Error updating component positions:", error);
    return { success: false, error: "Failed to update positions" };
  }
}

// Delete architecture (if needed)
// export async function deleteArchitecture(chatId: string) {
//   try {
//     const { userId } = await auth();
    
//     if (!userId) {
//       throw new Error("User not authenticated");
//     }

//     // Verify chat ownership
//     const chat = await db.chat.findFirst({
//       where: {
//         id: chatId,
//         userId: userId,
//       },
//     });

//     if (!chat) {
//       throw new Error("Chat not found or access denied");
//     }

//     // Delete architecture
//     await db.architecture.delete({
//       where: {
//         chatId: chatId,
//       },
//     });

//     revalidatePath(`/dev/${chatId}`);
//     return { success: true };
//   } catch (error) {
//     console.error("Error deleting architecture:", error);
//     return { success: false, error: "Failed to delete architecture" };
//   }
// }

// Batch update positions with debouncing (for smooth UI)
let positionUpdateTimeouts: Record<string, NodeJS.Timeout> = {};

export async function updateComponentPositionsDebounced(
  chatId: string,
  positions: Record<string, ComponentPosition>,
  delay: number = 1000 // 1 second delay
) {
  // Clear existing timeout for this chat
  if (positionUpdateTimeouts[chatId]) {
    clearTimeout(positionUpdateTimeouts[chatId]);
  }

  // Set new timeout
  positionUpdateTimeouts[chatId] = setTimeout(async () => {
    await updateComponentPositions(chatId, positions);
    delete positionUpdateTimeouts[chatId];
  }, delay);

  return { success: true, message: "Update scheduled" };
}

// Check if architecture with specific ID exists (for polling)
export async function checkArchitectureById(architectureId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Find architecture by ID and verify user ownership through chat
    const architecture = await db.architecture.findFirst({
      where: {
        id: architectureId,
        chat: {
          userId: userId,
        },
      },
      include: {
        chat: true,
      },
    });

    if (!architecture) {
      return { success: true, exists: false };
    }

    // Parse the JSON data and reconstruct the architecture object
    const architectureData: ArchitectureData = { 
      components: architecture.components as unknown as ComponentData[],
      connectionLabels: architecture.connectionLabels as Record<string, string> || {},
      architectureRationale: architecture.architectureRationale || undefined,
      domain: architecture.domain || undefined,
      complexity: architecture.complexity || undefined,
    };

    const componentPositions = architecture.componentPositions as unknown as Record<string, ComponentPosition> || {};

    return { 
      success: true, 
      exists: true,
      architecture: architectureData,
      componentPositions,
      metadata: {
        id: architecture.id,
        requirement: architecture.requirement,
        generatedAt: architecture.generatedAt,
        lastPositionUpdate: architecture.lastPositionUpdate,
        createdAt: architecture.createdAt,
        updatedAt: architecture.updatedAt,
      }
    };
  } catch (error) {
    console.error("Error checking architecture by ID:", error);
    return { success: false, error: "Failed to check architecture" };
  }
}