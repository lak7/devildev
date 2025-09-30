"use server"
import { db } from "@/lib/db";


export async function fetchUserWithSubscription(userId: string) {
    const user = await db.user.findUnique({
        where: {
            id: userId
        },  
        include: {
            subscription: true
        }
    })
    return user;
}