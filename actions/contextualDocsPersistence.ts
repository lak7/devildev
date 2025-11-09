"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Types for contextual documentation data
export interface ContextualDocsData {
  // Core documentation content
  prd?: string;
  
  // Docs folder content
  bugTracking?: string;
  projectStructure?: string;
  uiUX?: string;
  
  // Phases content
  phases?: string[];
  phaseCount?: number;
  
  // Completion status
  isPrdComplete?: boolean;
  isBugTrackingComplete?: boolean;
  isProjectStructureComplete?: boolean;
  isUiUXComplete?: boolean;
  arePhasesComplete?: boolean;
  
  // Metadata
  requirement?: string;
}

export interface ContextualDocsInput {
  chatId: string;
  docsData: ContextualDocsData;
}

// Create or update contextual docs for a chat
export async function saveContextualDocs(input: ContextualDocsInput) {
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

    // Upsert contextual docs
    const contextualDocs = await db.contextualDocs.upsert({
      where: {
        chatId: input.chatId,
      },
      update: {
        // Core documentation
        prd: input.docsData.prd,
        
        // Docs folder content
        bugTracking: input.docsData.bugTracking,
        projectStructure: input.docsData.projectStructure,
        uiUX: input.docsData.uiUX,
        
        // Phases
        phases: input.docsData.phases as any,
        phaseCount: input.docsData.phaseCount,
        
        // Completion status
        isPrdComplete: input.docsData.isPrdComplete ?? false,
        isBugTrackingComplete: input.docsData.isBugTrackingComplete ?? false,
        isProjectStructureComplete: input.docsData.isProjectStructureComplete ?? false,
        isUiUXComplete: input.docsData.isUiUXComplete ?? false,
        arePhasesComplete: input.docsData.arePhasesComplete ?? false,
        
        // Metadata
        requirement: input.docsData.requirement,
        lastDocUpdate: new Date(),
        updatedAt: new Date(),
      },
      create: {
        chatId: input.chatId,
        
        // Core documentation
        prd: input.docsData.prd,
        
        // Docs folder content
        bugTracking: input.docsData.bugTracking,
        projectStructure: input.docsData.projectStructure,
        uiUX: input.docsData.uiUX,
        
        // Phases
        phases: input.docsData.phases as any,
        phaseCount: input.docsData.phaseCount,
        
        // Completion status
        isPrdComplete: input.docsData.isPrdComplete ?? false,
        isBugTrackingComplete: input.docsData.isBugTrackingComplete ?? false,
        isProjectStructureComplete: input.docsData.isProjectStructureComplete ?? false,
        isUiUXComplete: input.docsData.isUiUXComplete ?? false,
        arePhasesComplete: input.docsData.arePhasesComplete ?? false,
        
        // Metadata
        requirement: input.docsData.requirement,
        generatedAt: new Date(),
        lastDocUpdate: new Date(),
      },
    });

    revalidatePath(`/dev/${input.chatId}`);
    return { success: true, contextualDocs };
  } catch (error) {
    console.error("Error saving contextual docs:", error);
    return { success: false, error: "Failed to save contextual docs" };
  }
}

// Get contextual docs for a chat
export async function getContextualDocs(chatId: string) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Verify chat ownership and get contextual docs
    const chatWithDocs = await db.chat.findFirst({
      where: {
        id: chatId,
        userId: userId,
      },
      include: {
        contextualDocs: true,
      },
    });

    if (!chatWithDocs) {
      return { success: false, error: "Chat not found or access denied" };
    }

    if (!chatWithDocs.contextualDocs) {
      return { success: true, contextualDocs: null };
    }

    const docs = chatWithDocs.contextualDocs;
    
    // Parse the JSON data and reconstruct the contextual docs object
    const contextualDocsData: ContextualDocsData = {
      // Core documentation
      prd: docs.prd || undefined,
      
      // Docs folder content
      bugTracking: docs.bugTracking || undefined,
      projectStructure: docs.projectStructure || undefined,
      uiUX: docs.uiUX || undefined,
      
      // Phases
      phases: docs.phases as string[] || undefined,
      phaseCount: docs.phaseCount || undefined,
      
      // Completion status
      isPrdComplete: docs.isPrdComplete,
      isBugTrackingComplete: docs.isBugTrackingComplete,
      isProjectStructureComplete: docs.isProjectStructureComplete,
      isUiUXComplete: docs.isUiUXComplete,
      arePhasesComplete: docs.arePhasesComplete,
      
      // Metadata
      requirement: docs.requirement || undefined,
    };

    return { 
      success: true, 
      contextualDocs: contextualDocsData,
      metadata: {
        id: docs.id,
        generatedAt: docs.generatedAt,
        lastDocUpdate: docs.lastDocUpdate,
        createdAt: docs.createdAt,
        updatedAt: docs.updatedAt,
      }
    };
  } catch (error) {
    console.error("Error getting contextual docs:", error);
    return { success: false, error: "Failed to get contextual docs" };
  }
}

// Update specific document content (for incremental updates)
export async function updateSpecificDoc(
  chatId: string,
  docType: keyof ContextualDocsData,
  content: string | string[] | number | boolean,
  isComplete?: boolean
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

    // Build update object based on document type
    const updateData: any = {
      lastDocUpdate: new Date(),
      updatedAt: new Date(),
    };

    // Set the specific document content
    updateData[docType] = content;

    // Set completion status if provided
    if (isComplete !== undefined) {
      const completionField = `is${docType.charAt(0).toUpperCase() + docType.slice(1)}Complete`;
      if (completionField in updateData || docType === 'phases') {
        updateData[docType === 'phases' ? 'arePhasesComplete' : completionField] = isComplete;
      }
    }

    // Update contextual docs
    const contextualDocs = await db.contextualDocs.update({
      where: {
        chatId: chatId,
      },
      data: updateData,
    });

    return { success: true, contextualDocs };
  } catch (error) {
    console.error("Error updating specific doc:", error);
    return { success: false, error: "Failed to update document" };
  }
}

// Batch update multiple documents (for streaming updates)
export async function batchUpdateDocs(
  chatId: string,
  updates: Array<{
    docType: keyof ContextualDocsData;
    content: string | string[] | number | boolean;
    isComplete?: boolean;
  }>
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

    // Build update object from all updates
    const updateData: any = {
      lastDocUpdate: new Date(),
      updatedAt: new Date(),
    };

    updates.forEach(update => {
      updateData[update.docType] = update.content;
      
      if (update.isComplete !== undefined) {
        const completionField = `is${update.docType.charAt(0).toUpperCase() + update.docType.slice(1)}Complete`;
        if (update.docType === 'phases') {
          updateData['arePhasesComplete'] = update.isComplete;
        } else {
          updateData[completionField] = update.isComplete;
        }
      }
    });

    // Update contextual docs
    const contextualDocs = await db.contextualDocs.update({
      where: {
        chatId: chatId,
      },
      data: updateData,
    });

    return { success: true, contextualDocs };
  } catch (error) {
    console.error("Error batch updating docs:", error);
    return { success: false, error: "Failed to batch update documents" };
  }
}

// Delete contextual docs (if needed)
export async function deleteContextualDocs(chatId: string) {
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

    // Delete contextual docs
    await db.contextualDocs.delete({
      where: {
        chatId: chatId,
      },
    });

    revalidatePath(`/dev/${chatId}`);
    return { success: true };
  } catch (error) {
    console.error("Error deleting contextual docs:", error);
    return { success: false, error: "Failed to delete contextual docs" };
  }
}

// Helper function to get completion status for UI
export async function getDocsCompletionStatus(chatId: string) {
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
      include: {
        contextualDocs: {
          select: {
            isPrdComplete: true,
            isBugTrackingComplete: true,
            isProjectStructureComplete: true,
            isUiUXComplete: true,
            arePhasesComplete: true,
          }
        },
      },
    });

    if (!chat || !chat.contextualDocs) {
      return { success: true, completionStatus: null };
    }

    return { 
      success: true, 
      completionStatus: chat.contextualDocs 
    };
  } catch (error) {
    console.error("Error getting completion status:", error);
    return { success: false, error: "Failed to get completion status" };
  }
}