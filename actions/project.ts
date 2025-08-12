"use server";
import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";

export async function getProject(projectId: string) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    const project = await db.project.findUnique({
        where: { id: projectId, userId: userId },
    });
    return project;
}