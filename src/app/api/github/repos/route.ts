import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's GitHub access token 
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        githubAccessToken: true,
        isGithubConnected: true,
      },
    });

    if (!user?.isGithubConnected || !user.githubAccessToken) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '5');
    const search = searchParams.get('search') || '';

    let url = `https://api.github.com/user/repos?sort=updated&per_page=${per_page}&page=${page}`;
    
    // If search is provided, use the search API instead
    if (search) {
      url = `https://api.github.com/search/repositories?q=${encodeURIComponent(search)}+user:${user.githubAccessToken}&sort=updated&per_page=${per_page}&page=${page}`;
    }

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${user.githubAccessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DevilDev-App',
      },
    });

    if (!response.ok) {
      console.error('GitHub API error:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: response.status });
    }

    const data = await response.json();
    
    // Format the response consistently whether it's search results or direct repos
    const repos = search ? data.items : data;
    
    const formattedRepos = repos.map((repo: any) => ({
      id: repo.id,
      name: repo.name,
      fullName: repo.full_name,
      description: repo.description,
      private: repo.private,
      language: repo.language,
      stargazersCount: repo.stargazers_count,
      forksCount: repo.forks_count,
      updatedAt: repo.updated_at,
      pushedAt: repo.pushed_at,
      size: repo.size,
      defaultBranch: repo.default_branch,
      topics: repo.topics || [],
      visibility: repo.visibility,
      owner: {
        login: repo.owner.login,
        avatarUrl: repo.owner.avatar_url,
      },
    }));

    return NextResponse.json({
      repos: formattedRepos,
      totalCount: search ? data.total_count : formattedRepos.length,
      hasNextPage: formattedRepos.length === per_page,
    });
  } catch (error) {
    console.error('Error fetching GitHub repositories:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
