import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { getInstallationToken } from '@/actions/githubAppAuth';
import { createOctokitWithToken } from '@/lib/githubClient';

export async function GET(request: NextRequest) {
  try {
    console.log("Step 0")
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }


    // Get user's GitHub access token and username
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        githubAccessToken: true,
        isGithubConnected: true,
        githubUsername: true,
      },
    });
    console.log("Step 1")

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || '9');
    const search = searchParams.get('search') || '';
    const installationId = searchParams.get('installationId');
    const appFlowEnabled = process.env.GITHUB_APP_FLOW_ENABLED === 'true';

    // If installationId provided, prefer GitHub App flow
    if (appFlowEnabled && installationId) {
      const { token } = await getInstallationToken(installationId);
      const octokit = createOctokitWithToken(token);

      if (search) {
        const q = `${search}${user?.githubUsername ? ` user:${user.githubUsername}` : ''}`.trim();
        const res = await octokit.search.repos({ q, per_page, page });
        const items = res.data.items || [];
        const formattedRepos = items.map((repo: any) => ({
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
          topics: (repo as any).topics || [],
          visibility: (repo as any).visibility,
          owner: {
            login: repo.owner?.login,
            avatarUrl: repo.owner?.avatar_url,
          },
        }));
        return NextResponse.json({ repos: formattedRepos, totalCount: res.data.total_count ?? formattedRepos.length, hasNextPage: formattedRepos.length === per_page, installationId });
      } else {
        const res = await octokit.request('GET /installation/repositories', { per_page, page });
        const repos = res.data.repositories || [];
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
          topics: (repo as any).topics || [],
          visibility: (repo as any).visibility,
          owner: {
            login: repo.owner?.login,
            avatarUrl: repo.owner?.avatar_url,
          },
        }));
        return NextResponse.json({ repos: formattedRepos, totalCount: formattedRepos.length, hasNextPage: formattedRepos.length === per_page, installationId });
      }
    }

    // OAuth fallback path (existing behavior)
    if (!user?.isGithubConnected || !user.githubAccessToken) {
      return NextResponse.json({ error: 'GitHub not connected' }, { status: 400 });
    }

    if (search && !user.githubUsername) {
      return NextResponse.json({ error: 'GitHub username not available for search' }, { status: 400 });
    }

    let url = `https://api.github.com/user/repos?sort=updated&per_page=${per_page}&page=${page}`;

    console.log("Step 2")
    
    // If search is provided, use the search API instead
    if (search) {
      url = `https://api.github.com/search/repositories?q=${encodeURIComponent(search)}+user:${user.githubUsername}`;
    }

    console.log("url", url)

    console.log("Step 3")

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${user.githubAccessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DevilDev-App',
      },
    });

    console.log("Step 4")

    if (!response.ok) {
      console.error('GitHub API error:', response.status, response.statusText);
      return NextResponse.json({ error: 'Failed to fetch repositories' }, { status: response.status });
    }

    console.log("Step 5")

    const data = await response.json();
    
    console.log("Step 6")

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

    console.log("Step 7")

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
