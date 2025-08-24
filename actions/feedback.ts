"use server";

import { db } from '@/lib/db';
import { auth } from '@clerk/nextjs/server';

export async function submitFeedback(page: string, feedback: string) {
  try {
    // Get the authenticated user
    const { userId } = await auth();
    
    if (!userId) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    if (!feedback.trim()) {
      return {
        success: false,
        error: 'Feedback cannot be empty'
      };
    }

    if (!page) {
      return {
        success: false,
        error: 'Project is required'
      };
    }

    // Insert feedback into the database
    const newFeedback = await db.feedback.create({
      data: {
        userId,
        page,
        feedback: feedback.trim()
      }
    });

    return {
      success: true,
      feedbackId: newFeedback.id
    };
  } catch (error) {
    console.error('Error submitting feedback:', error);
    return {
      success: false,
      error: 'Failed to submit feedback. Please try again.'
    };
  }
}