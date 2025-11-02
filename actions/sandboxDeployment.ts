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
      sandboxId: deployment.sandboxId || undefined,
      sandboxUrl: deployment.sandboxUrl || undefined,
      filesList: deployment.filesList || undefined,
    };
  } catch (error) {
    console.error("Error getting latest sandbox deployment:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

