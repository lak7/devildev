import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const { requirement } = await request.json();

    if (!requirement) {
      return NextResponse.json({ error: 'Requirement is required' }, { status: 400 });
    }

    const prompt = `Based on the following user requirement, generate a complete software architecture with components, technologies, and connections.

User Requirement: "${requirement}"

Please analyze the requirement and provide a JSON response with the following structure:

{
  "components": [
    {
      "id": "unique-id",
      "title": "Component Name",
      "icon": "icon-name", // Options: Monitor, Server, Database, Shield, Globe, Cpu, Cloud, Lock, Users, Code, Search, Mail, Bell, Settings, FileText, Image, Music, Video, Download, Upload, Smartphone, Tablet, Laptop, HardDrive, Wifi, Bluetooth, Headphones, Camera, Microphone, Speaker, Battery, Zap, Activity, BarChart, PieChart, TrendingUp, TrendingDown, DollarSign, CreditCard, ShoppingCart, Package, Truck, MapPin, Calendar, Clock, Timer, Stopwatch, Play, Pause, SkipBack, SkipForward, Volume, VolumeX, Repeat, Shuffle, Heart, Star, Bookmark, Flag, Tag, Filter, Sort, Grid, List, Eye, EyeOff, Edit, Trash, Plus, Minus, X, Check, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, ArrowUp, ArrowDown, ArrowLeft, ArrowRight, CornerUpLeft, CornerUpRight, CornerDownLeft, CornerDownRight, RefreshCw, RotateCcw, RotateCw, Maximize, Minimize, Move, Copy, Scissors, Clipboard, Link, ExternalLink, Home, User, MessageSquare, MessageCircle, Send, Mail, Phone, Video, Mic, MicOff, VideoOff, Volume2, VolumeX, MoreHorizontal, MoreVertical
      "color": "tailwind-gradient", // e.g., "from-cyan-500 to-blue-500"
      "borderColor": "border-color", // e.g., "border-cyan-500/30"
      "technologies": {
        "key1": "value1",
        "key2": "value2"
      },
      "connections": ["component-id1", "component-id2"],
      "position": { "x": 100, "y": 100 },
      "dataFlow": {
        "sends": ["data-type1", "data-type2"],
        "receives": ["data-type3", "data-type4"]
      }
    }
  ],
  "connectionLabels": {
    "component1-component2": "Connection Type",
    "component2-component3": "API/Protocol"
  }
}

Guidelines:
1. Create 4-8 components based on complexity
2. Use appropriate icons from the list above
3. Position components in a logical layout (x: 50-800, y: 50-600)
4. Ensure all connections are bidirectional in the connections array
5. Use realistic technology stacks
6. Create meaningful data flow descriptions
7. Use appropriate color gradients that match the component purpose
8. Ensure component IDs are lowercase and use hyphens

Return ONLY the JSON object, no additional text or formatting.`;

    const response = await client.chat.completions.create({
      model: 'gpt-4-1106-preview',
      messages: [
        {
          role: 'system',
          content: 'You are an expert software architect. Generate detailed, realistic software architectures based on user requirements. Always return valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    const content = response.choices[0]?.message?.content;
    
    if (!content) {
      throw new Error('No response content from OpenAI');
    }

    try {
      // Parse the JSON response
      const architecture = JSON.parse(content);
      
      // Validate the structure
      if (!architecture.components || !Array.isArray(architecture.components)) {
        throw new Error('Invalid architecture format');
      }

      return NextResponse.json({ architecture });
    } catch (parseError) {
      console.error('Failed to parse architecture JSON:', parseError);
      console.error('Raw content:', content);
      
      // Return a fallback architecture
      const fallbackArchitecture = {
        components: [
          {
            id: "frontend",
            title: "Frontend",
            icon: "Monitor",
            color: "from-cyan-500 to-blue-500",
            borderColor: "border-cyan-500/30",
            technologies: {
              framework: "React/Next.js",
              language: "TypeScript"
            },
            connections: ["backend"],
            position: { x: 50, y: 50 },
            dataFlow: {
              sends: ["User Requests", "Form Data"],
              receives: ["API Responses", "UI Updates"]
            }
          },
          {
            id: "backend",
            title: "Backend",
            icon: "Server",
            color: "from-emerald-500 to-green-500",
            borderColor: "border-emerald-500/30",
            technologies: {
              runtime: "Node.js",
              framework: "Express/Fastify"
            },
            connections: ["frontend", "database"],
            position: { x: 450, y: 50 },
            dataFlow: {
              sends: ["API Responses", "Database Queries"],
              receives: ["HTTP Requests", "Client Data"]
            }
          },
          {
            id: "database",
            title: "Database",
            icon: "Database",
            color: "from-purple-500 to-violet-500",
            borderColor: "border-purple-500/30",
            technologies: {
              type: "PostgreSQL",
              orm: "Prisma"
            },
            connections: ["backend"],
            position: { x: 450, y: 350 },
            dataFlow: {
              sends: ["Query Results", "Data Records"],
              receives: ["SQL Queries", "Data Operations"]
            }
          }
        ],
        connectionLabels: {
          "frontend-backend": "REST API",
          "backend-database": "SQL/ORM"
        }
      };

      return NextResponse.json({ architecture: fallbackArchitecture });
    }

  } catch (error) {
    console.error('Architecture generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate architecture' }, 
      { status: 500 }
    );
  }
} 