"use server";

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { inngest } from "../src/inngest/client";
import { ContextualDocsData } from "./contextualDocsPersistence";

export interface SandboxDeploymentResult {
  success: boolean;
  deploymentId?: string;
  error?: string;
  exists?: boolean;
  completed?: boolean;
  status?: string;
  sandboxId?: string;
  sandboxUrl?: string;
  filesList?: any;
  agentStatus?: string;
  currentPhase?: number;
  agentError?: string;
  agentStartedAt?: Date;
  agentCompletedAt?: Date;
}

export async function triggerSandboxDeployment({
  deploymentId,
  chatId,
  docsData,
}: {
  deploymentId: string;
  chatId: string;
  docsData: ContextualDocsData;
}): Promise<SandboxDeploymentResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    // Verify chat ownership
    const chat = await db.chat.findFirst({
      where: {
        id: chatId,
        userId: userId,
      },
    });

    if (!chat) {
      return { success: false, error: "Chat not found or access denied" };
    }

    // Create initial database record with status "pending"
    await db.sandboxDeployment.create({
      data: {
        id: deploymentId,
        chatId: chatId,
        status: "pending",
      },
    });

    // Send Inngest event
    await inngest.send({
      name: "sandbox/deploy",
      data: {
        deploymentId,
        chatId,
        docsData,
      },
    });

    return { success: true, deploymentId };
  } catch (error) {
    console.error("Error triggering sandbox deployment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function checkSandboxDeploymentById(
  deploymentId: string
): Promise<SandboxDeploymentResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    // Query sandbox deployment with user ownership check through chat relation
    const deployment = await db.sandboxDeployment.findFirst({
      where: {
        id: deploymentId,
        chat: {
          userId: userId,
        },
      },
      include: {
        chat: true,
      },
    });

    if (!deployment) {
      return { success: true, exists: false };
    }

    if (deployment.status === "pending") {
      return {
        success: true,
        exists: true,
        completed: false,
        status: "pending",
      };
    }

    if (deployment.status === "completed") {
      return {
        success: true,
        exists: true,
        completed: true,
        status: "completed",
        sandboxId: deployment.sandboxId || undefined,
        sandboxUrl: deployment.sandboxUrl || undefined,
        filesList: deployment.filesList || undefined,
      };
    }

    if (deployment.status === "failed") {
      return {
        success: true,
        exists: true,
        completed: true,
        status: "failed",
        error: deployment.error || undefined,
      };
    }

    // Handle in-progress status
    return {
      success: true,
      exists: true,
      completed: false,
      status: deployment.status,
    };
  } catch (error) {
    console.error("Error checking sandbox deployment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function getLatestSandboxDeployment(
  chatId: string
): Promise<SandboxDeploymentResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    // Verify chat ownership
    const chat = await db.chat.findFirst({
      where: {
        id: chatId,
        userId: userId,
      },
    });

    if (!chat) {
      return { success: false, error: "Chat not found or access denied" };
    }

    // Query most recent sandbox deployment
    const deployment = await db.sandboxDeployment.findFirst({
      where: {
        chatId: chatId,
        status: "completed",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (!deployment) {
      return { success: true, exists: false };
    }

    return {
      success: true,
      exists: true,
      completed: true,
      status: "completed",
      deploymentId: deployment.id,
      sandboxId: deployment.sandboxId || undefined,
      sandboxUrl: deployment.sandboxUrl || undefined,
      filesList: deployment.filesList || undefined,
      agentStatus: deployment.agentStatus || undefined,
      currentPhase: deployment.currentPhase || undefined,
      agentError: deployment.agentError || undefined,
      agentStartedAt: deployment.agentStartedAt || undefined,
      agentCompletedAt: deployment.agentCompletedAt || undefined,
    };
  } catch (error) {
    console.error("Error getting latest sandbox deployment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function triggerCodeAgent({
  deploymentId,
  sandboxId,
}: {
  deploymentId: string;
  sandboxId: string;
}): Promise<SandboxDeploymentResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    // Verify deployment exists and user has access through chat relation
    const deployment = await db.sandboxDeployment.findFirst({
      where: {
        id: deploymentId,
        chat: {
          userId: userId,
        },
      },
    });

    if (!deployment) {
      return { success: false, error: "Deployment not found or access denied" };
    }

    // Update deployment record to set agent status to in-progress
    await db.sandboxDeployment.update({
      where: {
        id: deploymentId,
      },
      data: {
        agentStatus: "in-progress",
        agentStartedAt: new Date(),
        currentPhase: 1,
      },
    });

    // Send Inngest event
    await inngest.send({
      name: "code-agent/run",
      data: {
        deploymentId,
        sandboxId,
      },
    });

    return { success: true, deploymentId };
  } catch (error) {
    console.error("Error triggering code agent:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function checkCodeAgentStatus(
  deploymentId: string
): Promise<SandboxDeploymentResult> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "User not authenticated" };
    }

    // Query sandbox deployment with user ownership check through chat relation
    const deployment = await db.sandboxDeployment.findFirst({
      where: {
        id: deploymentId,
        chat: {
          userId: userId,
        },
      },
      include: {
        chat: true,
      },
    });

    if (!deployment) {
      return { success: true, exists: false };
    }

    // Handle not_started status
    if (deployment.agentStatus === "not_started") {
      return {
        success: true,
        exists: true,
        completed: false,
        agentStatus: "not_started",
      };
    }

    // Handle in-progress status
    if (deployment.agentStatus === "in-progress") {
      return {
        success: true,
        exists: true,
        completed: false,
        agentStatus: "in-progress",
        currentPhase: deployment.currentPhase || undefined,
        agentStartedAt: deployment.agentStartedAt || undefined,
      };
    }

    // Handle completed status
    if (deployment.agentStatus === "completed") {
      return {
        success: true,
        exists: true,
        completed: true,
        agentStatus: "completed",
        currentPhase: deployment.currentPhase || undefined,
        agentStartedAt: deployment.agentStartedAt || undefined,
        agentCompletedAt: deployment.agentCompletedAt || undefined,
      };
    }

    // Handle failed status
    if (deployment.agentStatus === "failed") {
      return {
        success: true,
        exists: true,
        completed: true,
        agentStatus: "failed",
        agentError: deployment.agentError || undefined,
        currentPhase: deployment.currentPhase || undefined,
        agentStartedAt: deployment.agentStartedAt || undefined,
        agentCompletedAt: deployment.agentCompletedAt || undefined,
      };
    }

    // Default return for any other status
    return {
      success: true,
      exists: true,
      completed: false,
      agentStatus: deployment.agentStatus,
    };
  } catch (error) {
    console.error("Error checking code agent status:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

