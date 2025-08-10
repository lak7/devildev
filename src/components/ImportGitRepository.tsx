'use client';

import React, { useState, useEffect } from 'react';
import { Search, Github, ExternalLink, Clock, Star, GitFork, Lock, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';

interface Repository {
  id: number;
  name: string;
  fullName: string;
  description: string | null;
  private: boolean;
  language: string | null;
  stargazersCount: number;
  forksCount: number;
  updatedAt: string;
  pushedAt: string;
  size: number;
  defaultBranch: string;
  topics: string[];
  visibility: string;
  owner: {
    login: string;
    avatarUrl: string;
  };
}

interface ImportGitRepositoryProps {
  onImport: (repo: Repository) => void;
} 

export default function ImportGitRepository({ onImport }: ImportGitRepositoryProps) {
  const [repos, setRepos] = useState<Repository[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [githubConnected, setGithubConnected] = useState(false);
  const [importing, setImporting] = useState<number | null>(null);

  useEffect(() => {
    checkGithubStatus();
  }, []);

  useEffect(() => {
    if (githubConnected) {
      fetchRepos();
    }
  }, [githubConnected]);

  const checkGithubStatus = async () => {
    try {
      const response = await fetch('/api/github/status');
      const data = await response.json();
      setGithubConnected(data.isConnected);
    } catch (error) {
      console.error('Error checking GitHub status:', error);
    }
  };

  const fetchRepos = async (search?: string) => {
    try {
      setSearchLoading(!!search);
      if (!search) setLoading(true); 

      const url = new URL('/api/github/repos', window.location.origin);
      if (search) {
        url.searchParams.set('search', search);
      } 

      const response = await fetch(url);
      const data = await response.json();

      if (response.ok) {
        setRepos(data.repos);
      } else {
        console.error('Error fetching repos:', data.error);
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) { 
      fetchRepos(searchTerm.trim());
    } else {
      fetchRepos();
    }
  };

  const handleImport = async (repo: Repository) => {
    setImporting(repo.id);
    try {
      // Call the parent's import handler
      await onImport(repo);
    } catch (error) {
      console.error('Error importing repository:', error);
    } finally {
      setImporting(null);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  };

  if (!githubConnected) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="text-center">
          <Github className="w-12 h-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-semibold mb-2">Connect GitHub to Import Repositories</h3>
          <p className="text-gray-600 mb-6">
            Connect your GitHub account to browse and import your repositories for architecture analysis.
          </p>
          <Button
            onClick={() => window.location.href = '/api/github/auth'}
            className="bg-black text-white hover:bg-gray-800"
          >
            <Github className="w-4 h-4 mr-2" />
            Connect GitHub
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Import Git Repository</h2>
        <p className="text-gray-600">
          Select a repository to import and generate its architecture
        </p>
      </div>

      {/* Search Bar */}
      <form onSubmit={handleSearch} className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            type="text"
            placeholder="Search repositories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {searchLoading && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
            </div>
          )}
        </div>
      </form>

      {/* Repository List */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="border rounded-lg p-4 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-6 h-6 bg-gray-200 rounded"></div>
                  <div className="h-5 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="mt-3 h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="mt-2 flex items-center space-x-4">
                <div className="h-4 bg-gray-200 rounded w-16"></div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {repos.length === 0 ? (
            <div className="text-center py-12">
              <Github className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <h3 className="text-lg font-semibold mb-2">No repositories found</h3>
              <p className="text-gray-600">
                {searchTerm ? 'Try adjusting your search terms.' : 'You don\'t have any repositories yet.'}
              </p>
            </div>
          ) : (
            repos.map((repo) => (
              <div
                key={repo.id}
                className="border rounded-lg p-4 hover:border-gray-300 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-2">
                      <Avatar className="w-5 h-5">
                        <img src={repo.owner.avatarUrl} alt={repo.owner.login} />
                      </Avatar>
                      <span className="font-semibold text-lg">{repo.name}</span>
                      {repo.private ? (
                        <Lock className="w-4 h-4 text-gray-500" />
                      ) : (
                        <Globe className="w-4 h-4 text-gray-500" />
                      )}
                    </div>
                    
                    {repo.description && (
                      <p className="text-gray-600 mb-3">{repo.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {repo.language && (
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                          <span>{repo.language}</span>
                        </div>
                      )}
                      
                      <div className="flex items-center space-x-1">
                        <Star className="w-3 h-3" />
                        <span>{repo.stargazersCount}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <GitFork className="w-3 h-3" />
                        <span>{repo.forksCount}</span>
                      </div>
                      
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span>Updated {formatTimeAgo(repo.updatedAt)}</span>
                      </div>
                    </div>
                    
                    {repo.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-3">
                        {repo.topics.slice(0, 5).map((topic) => (
                          <Badge
                            key={topic}
                            variant="secondary"
                            className="text-xs"
                          >
                            {topic}
                          </Badge>
                        ))}
                        {repo.topics.length > 5 && (
                          <Badge variant="secondary" className="text-xs">
                            +{repo.topics.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(`https://github.com/${repo.fullName}`, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => handleImport(repo)}
                      disabled={importing === repo.id}
                      className="bg-black text-white hover:bg-gray-800"
                    >
                      {importing === repo.id ? (
                        <div className="flex items-center space-x-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>Importing...</span>
                        </div>
                      ) : (
                        'Import'
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
