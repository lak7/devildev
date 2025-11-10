import { NextRequest, NextResponse } from 'next/server';
import { generateDocsWithStreaming, type StreamingUpdateCallback } from '../../../../actions/context';

export async function POST(request: NextRequest) {
  try {
    const { messages, architectureData } = await request.json();
  
    // Create a readable stream
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();

        // Streaming callback that sends data to the client
        const onUpdate: StreamingUpdateCallback = (fileName, content, isComplete) => {
          try {
            const data = JSON.stringify({
              fileName,
              content,
              isComplete,
              type: 'update'
            });
            
            // Ensure proper SSE format
            const message = `data: ${data}\n\n`;
            controller.enqueue(encoder.encode(message));
            
          } catch (error) {
            console.error('Error encoding streaming update:', error);
          }
        }; 

        try {
          // Generate docs with streaming
          const result = await generateDocsWithStreaming(messages, architectureData, onUpdate);
          
          // Send final result
          try {
            const finalData = JSON.stringify({
              type: 'complete',
              result
            });
            const finalMessage = `data: ${finalData}\n\n`;
            controller.enqueue(encoder.encode(finalMessage));
            
          } catch (error) {
            console.error('Error encoding final result:', error);
          }
          
        } catch (error) {
          console.error('Error in document generation:', error);
          
          try {
            const errorData = JSON.stringify({
              type: 'error',
              error: error instanceof Error ? error.message : 'Unknown error'
            });
            const errorMessage = `data: ${errorData}\n\n`;
            controller.enqueue(encoder.encode(errorMessage));
          } catch (encodeError) {
            console.error('Error encoding error message:', encodeError);
          }
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Cache-Control',
      },
    });

  } catch (error) {
    console.error('Error in generate-docs-stream:', error);
    return NextResponse.json(
      { error: 'Failed to generate docs' },
      { status: 500 }
    );
  }
} 