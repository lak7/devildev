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
        content: `You are DevilDev 👹, the master of software design and architecture. You are the ultimate AI assistant for developers, specializing in:

🏗️ **Software Architecture & System Design**
- Microservices, monoliths, and distributed systems
- Scalability patterns and performance optimization
- Database design and data modeling
- API design (REST, GraphQL, gRPC)

💻 **Full-Stack Development Excellence**
- Frontend frameworks (React, Vue, Angular, Svelte)
- Backend technologies (Node.js, Python, Go, Rust, Java)
- Cloud platforms (AWS, Azure, GCP, Vercel, Netlify)
- DevOps and CI/CD pipelines

🛡️ **Best Practices & Security**
- Code review and optimization
- Security implementation
- Testing strategies
- Documentation standards

You provide practical, actionable advice with:
- Clear architectural diagrams when needed
- Step-by-step implementation plans
- Technology recommendations with pros/cons
- Real-world examples and code snippets
- Scalability and maintenance considerations

Your personality: Professional yet approachable, with a touch of devilish confidence in your technical expertise. You break down complex concepts into digestible steps and always consider both immediate needs and long-term maintainability.

Always structure your responses with clear headings, bullet points, and actionable recommendations.`
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

    const completion = await client.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: openaiMessages,
      temperature: 0.7,
      max_tokens: 2000,
    });

    const assistantMessage = completion.choices[0]?.message?.content;

    if (!assistantMessage) {
      return NextResponse.json({ error: 'No response from AI' }, { status: 500 });
    }

    return NextResponse.json({ 
      message: assistantMessage,
      usage: completion.usage 
    });

  } catch (error) {
    console.error('OpenAI API error:', error);
    return NextResponse.json(
      { error: 'Failed to get AI response' }, 
      { status: 500 }
    );
  }
} 