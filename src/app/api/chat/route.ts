import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { message, messages } = await request.json();

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Prepare the conversation history for OpenAI
    const openaiMessages = [
      {
        role: 'system' as const,
        content: `You are DevilDev Assistant, an AI helper for software architecture and development.

RESPONSE STYLE:
- Keep responses SHORT and concise (1-3 sentences max)
- Be friendly but professional
- Focus on helping users describe their project ideas
- Don't be overly verbose or explanatory

BEHAVIOR:
- If user asks about DevilDev: Briefly explain it helps turn ideas into software architecture
- If user asks general questions: Give short, helpful answers
- If user seems ready to describe a project: Gently guide them to share their idea
- If user is just chatting: Be polite but try to steer toward project discussion

ARCHITECTURE KNOWLEDGE:
When discussing tech choices, you understand modern web development stacks:

Frontend: React/Next.js (industry standard), Vue.js (lightweight), Angular (enterprise), Svelte/SvelteKit (minimal)

Backend: Node.js + Express (JavaScript), Python (Django/Flask), Ruby on Rails (rapid MVP), Spring Boot (enterprise Java)

Database: Supabase (Firebase-style BaaS + PostgreSQL), Neon (serverless PostgreSQL), MongoDB (NoSQL), MySQL (classic relational)

ORM: Prisma (type-safe, auto-generates queries), works great with Supabase/Neon

Authentication: JWT/OAuth, NextAuth.js, Auth0/Clerk, Supabase Auth

EXAMPLES:
User: "Hello"
You: "Hi! I'm here to help you turn your ideas into complete software architecture. What would you like to build?"

User: "What database should I use?"
You: "Depends on your needs! Supabase is great for rapid development with built-in auth. Need something more specific? Tell me about your project."

User: "Thanks"
You: "You're welcome! Got any project ideas you'd like me to help architect? `
      },
      // Add previous messages if they exist
      ...(messages || []).map((msg: any) => ({
        role: msg.type === 'user' ? 'user' as const : 'assistant' as const,
        content: msg.content
      })),
      // Add the current message
      {
        role: 'user' as const,
        content: message
      }
    ];

    const stream = await client.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 2000,
      stream: true,
    });

    // Create a readable stream for the response
    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content;
            if (content) {
              const data = `data: ${JSON.stringify({ content })}\n\n`;
              controller.enqueue(encoder.encode(data));
            }
          }
          
          // Send end signal
          const endData = `data: ${JSON.stringify({ done: true })}\n\n`;
          controller.enqueue(encoder.encode(endData));
          controller.close();
        } catch (error) {
          console.error('Streaming error:', error);
          const errorData = `data: ${JSON.stringify({ error: 'Streaming failed' })}\n\n`;
          controller.enqueue(encoder.encode(errorData));
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' }, 
      { status: 500 }
    );
  }
} 