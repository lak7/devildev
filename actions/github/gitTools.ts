import { z } from "zod";
import { DynamicStructuredTool } from "langchain/tools";

// Types for GitHub API responses
interface GitHubTreeNode {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubTreeNode[];
  truncated: boolean;
}

interface GitHubFileResponse {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  content: string;
  encoding: string;
}

interface GitHubSearchResponse {
  total_count: number;
  incomplete_results: boolean;
  items: Array<{
    name: string;
    path: string;
    sha: string;
    url: string;
    git_url: string;
    html_url: string;
    repository: {
      id: number;
      name: string;
      full_name: string;
    };
    score: number;
  }>;
}

// Maximum file size limit (500 KB)
const MAX_FILE_SIZE = 500 * 1024;

// Note: All tools now return strings instead of complex objects for LangChain compatibility

/**
 * Tool 1: Get Repository Tree
 * Fetches the complete file structure of a GitHub repository
 */
export const getRepoTreeTool = new DynamicStructuredTool({
  name: "getRepoTree",
  description: "Get the complete file tree structure of a GitHub repository recursively. Returns all files and directories in the repository.",
  schema: z.object({
    owner: z.string().describe("Repository owner/organization name"),
    repo: z.string().describe("Repository name"),
    branch: z.string().optional().default("main").describe("Branch name (defaults to 'main')"),
    accessToken: z.string().describe("GitHub access token for authentication (OAuth or installation token)"),
  }),
  
  func: async (input): Promise<string> => {
    const { owner, repo, branch = "main", accessToken } = input as { owner: string, repo: string, branch: string, accessToken: string };
    try {
      const url = `https://api.github.com/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'DevilDev-Agent'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          // Try 'master' branch if 'main' fails
          if (branch === "main") {
            const masterUrl = `https://api.github.com/repos/${owner}/${repo}/git/trees/master?recursive=1`;
            const masterResponse = await fetch(masterUrl, {
              headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'DevilDev-Agent'
              }
            });
            
            if (masterResponse.ok) {
              const masterData: GitHubTreeResponse = await masterResponse.json();
              const formattedTree = masterData.tree.map(node => ({
                path: node.path,
                type: node.type,
                size: node.size || 0,
                mode: node.mode
              }));
              
              const result = {
                success: true,
                sha: masterData.sha,
                truncated: masterData.truncated,
                totalFiles: formattedTree.filter(n => n.type === "blob").length,
                totalDirectories: formattedTree.filter(n => n.type === "tree").length,
                tree: formattedTree
              };
              
              return `Repository tree structure for ${owner}/${repo} (master branch):
${JSON.stringify(result, null, 2)}

Summary: Found ${result.totalFiles} files and ${result.totalDirectories} directories.
${masterData.truncated ? 'Note: Tree was truncated by GitHub API.' : ''}`;
            }
          }
          throw new Error(`Repository or branch not found: ${owner}/${repo}/${branch}`);
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data: GitHubTreeResponse = await response.json();
      
      if (data.truncated) {
        console.warn("Repository tree was truncated by GitHub API");
      }

      // Format the tree for better readability
      const formattedTree = data.tree.map(node => ({
        path: node.path,
        type: node.type,
        size: node.size || 0,
        mode: node.mode
      }));

      const result = {
        success: true,
        sha: data.sha,
        truncated: data.truncated,
        totalFiles: formattedTree.filter(n => n.type === "blob").length,
        totalDirectories: formattedTree.filter(n => n.type === "tree").length,
        tree: formattedTree
      };

      return `Repository tree structure for ${owner}/${repo} (${branch} branch):
${JSON.stringify(result, null, 2)}

Summary: Found ${result.totalFiles} files and ${result.totalDirectories} directories.
${data.truncated ? 'Note: Tree was truncated by GitHub API.' : ''}`;

    } catch (error) {
      return `Error getting repository tree: ${error instanceof Error ? error.message : "Unknown error occurred"}`;
    }
  }
});

/**
 * Tool 2: Get File Content
 * Fetches the raw content of a specific file from a GitHub repository
 */
export const getFileContentTool = new DynamicStructuredTool({
  name: "getFileContent",
  description: "Get the raw content of a specific file from a GitHub repository. Has a 500KB size limit to prevent memory issues.",
  schema: z.object({
    owner: z.string().describe("Repository owner/organization name"),
    repo: z.string().describe("Repository name"),
    path: z.string().describe("File path within the repository (e.g., 'src/app/page.tsx')"),
    accessToken: z.string().describe("GitHub access token for authentication (OAuth or installation token)"),
    branch: z.string().optional().describe("Branch name (optional, uses default branch if not specified)"),
  }),
  
  func: async (input): Promise<string> => {
    const { owner, repo, path, accessToken, branch } = input as { owner: string, repo: string, path: string, accessToken: string, branch: string };
    try {
      let url = `https://api.github.com/repos/${owner}/${repo}/contents/${encodeURIComponent(path)}`;
      if (branch) {
        url += `?ref=${encodeURIComponent(branch)}`;
      }
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3.raw',
          'User-Agent': 'DevilDev-Agent'
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(`File not found: ${path}`);
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      // Check content length before reading
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > MAX_FILE_SIZE) {
        throw new Error(`File too large: ${contentLength} bytes (max: ${MAX_FILE_SIZE} bytes)`);
      }

      const content = await response.text();
      
      // Double-check actual content size
      if (content.length > MAX_FILE_SIZE) {
        throw new Error(`File content too large: ${content.length} characters (max: ${MAX_FILE_SIZE})`);
      }

      return `File content for ${path} (${content.length} characters):

${content}`;

    } catch (error) {
      return `Error reading file ${path}: ${error instanceof Error ? error.message : "Unknown error occurred"}`;
    }
  }
});

/**
 * Tool 3: Search Code
 * Searches for specific keywords or patterns within a GitHub repository
 */
export const searchCodeTool = new DynamicStructuredTool({
  name: "searchCode", 
  description: "Search for specific keywords, patterns, or code within a GitHub repository. Useful for finding framework usage, specific functions, or patterns.",
  schema: z.object({
    owner: z.string().describe("Repository owner/organization name"),
    repo: z.string().describe("Repository name"),
    query: z.string().describe("Search query (e.g., 'useEffect', '@nestjs/', 'function component')"),
    accessToken: z.string().describe("GitHub access token for authentication (OAuth or installation token)"),
    language: z.string().optional().describe("Filter by programming language (e.g., 'typescript', 'javascript')"),
    extension: z.string().optional().describe("Filter by file extension (e.g., 'ts', 'tsx', 'js')"),
    path: z.string().optional().describe("Filter by file path pattern (e.g., 'src/', 'components/')"),
  }),
  
  func: async (input): Promise<string> => {
    const { owner, repo, query, accessToken, language, extension, path } = input as { owner: string, repo: string, query: string, accessToken: string, language: string, extension: string, path: string };
    try {
      // Build search query with filters
      let searchQuery = `${query} repo:${owner}/${repo}`;
      
      if (language) {
        searchQuery += ` language:${language}`;
      }
      
      if (extension) {
        searchQuery += ` extension:${extension}`;
      }
      
      if (path) {
        searchQuery += ` path:${path}`;
      }

      const url = `https://api.github.com/search/code?q=${encodeURIComponent(searchQuery)}&per_page=30`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'DevilDev-Agent'
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("GitHub code search rate limit exceeded or insufficient permissions");
        }
        if (response.status === 422) {
          throw new Error("Invalid search query or repository too large for code search");
        }
        throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
      }

      const data: GitHubSearchResponse = await response.json();
      
      // Format results for better readability
      const formattedResults = data.items.map(item => ({
        name: item.name,
        path: item.path,
        url: item.html_url,
        score: item.score
      }));

      const result = {
        success: true,
        totalCount: data.total_count,
        incompleteResults: data.incomplete_results,
        query: searchQuery,
        results: formattedResults
      };

      return `Code search results for "${query}" in ${owner}/${repo}:

Total matches: ${data.total_count}
Results returned: ${formattedResults.length}
Incomplete results: ${data.incomplete_results}

${formattedResults.length > 0 ? 
  'Found files:\n' + formattedResults.map(item => 
    `- ${item.path} (score: ${item.score})`
  ).join('\n') : 
  'No files found matching the search criteria.'
}

Search query used: ${searchQuery}`;

    } catch (error) {
      return `Error searching code for "${query}": ${error instanceof Error ? error.message : "Unknown error occurred"}`;
    }
  }
});



// Helper function to validate GitHub access token
export async function validateGitHubToken(accessToken: string): Promise<boolean> {
  try {
    const response = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'DevilDev-Agent'
      }
    });
    
    return response.ok;
  } catch {
    return false;
  }
}
