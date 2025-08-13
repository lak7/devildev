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
        select: {
            name: true,
            userId: true,
            framework: true,
            createdAt: true,
            updatedAt: true,
            ProjectArchitecture: true,
        }
    });
    console.log("Project: ", project)
    return project;
}

export async function saveProjectArchitecture(
    projectId: string,
    architectureRationale: string,
    components: any,
    connectionLabels: any,
    componentPositions?: any
) {
    console.log("In saveProjectArchitecture Step 0");
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    console.log("In saveProjectArchitecture Step 1");

    try {
        // First verify the project belongs to the user
        const project = await db.project.findUnique({
            where: { id: projectId, userId: userId },
            select: { id: true }
        });
        console.log("In saveProjectArchitecture Step 2");
        if (!project) {
            return { error: 'Project not found' };
        }

        // Check if ProjectArchitecture already exists
        const existingArchitecture = await db.projectArchitecture.findUnique({
            where: { projectId: projectId }
        });
        console.log("In saveProjectArchitecture Step 3");
        let savedArchitecture;
        
        if (existingArchitecture) {
            // Update existing architecture
            savedArchitecture = await db.projectArchitecture.update({
                where: { projectId: projectId },
                data: {
                    architectureRationale,
                    components,
                    connectionLabels,
                    componentPositions: componentPositions || existingArchitecture.componentPositions,
                    updatedAt: new Date()
                }
            });
        } else {
            // Create new architecture
            savedArchitecture = await db.projectArchitecture.create({
                data: {
                    projectId,
                    architectureRationale,
                    components,
                    connectionLabels,
                    componentPositions: componentPositions || {}
                }
            });
        }
        console.log("In saveProjectArchitecture Step 4");
        return { success: true, architecture: savedArchitecture };
    } catch (error) {
        console.error("Error saving project architecture:", error);
        return { error: 'Failed to save project architecture' };
    }
}

// Update only component positions for a project (for performance during dragging)
export async function updateProjectComponentPositions(
    projectId: string, 
    positions: Record<string, { x: number; y: number }>
) {
    const { userId } = await auth();
    if (!userId) {
        return { error: 'Unauthorized' };
    }

    try {
        // First verify the project belongs to the user
        const project = await db.project.findUnique({
            where: { id: projectId, userId: userId },
            select: { id: true }
        });
        
        if (!project) {
            return { error: 'Project not found' };
        }

        // Check if ProjectArchitecture exists
        const existingArchitecture = await db.projectArchitecture.findUnique({
            where: { projectId: projectId }
        });
        
        if (!existingArchitecture) {
            return { error: 'Architecture not found' };
        }

        // Update only positions
        const savedArchitecture = await db.projectArchitecture.update({
            where: { projectId: projectId },
            data: {
                componentPositions: positions,
                updatedAt: new Date()
            }
        });

        return { success: true, architecture: savedArchitecture };
    } catch (error) {
        console.error("Error updating component positions:", error);
        return { error: 'Failed to update positions' };
    }
}