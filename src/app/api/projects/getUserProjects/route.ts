import { NextRequest, NextResponse } from 'next/server';
import { getProjects } from '../../../../../actions/project';

export async function GET(request: NextRequest) {
  try {
    const projects = await getProjects();
    
    if ('error' in projects) {
      return NextResponse.json({ error: projects.error }, { status: 401 });
    }

    // Sort projects by creation date (latest first)
    const sortedProjects = projects.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json(sortedProjects, {
      headers: {
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=60', // Cache for 5 minutes
      },
    });
  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
