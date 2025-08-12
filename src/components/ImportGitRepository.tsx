'use client';

import React, { useState, useEffect } from 'react';
import { Search, Github, ExternalLink, Clock, Star, GitFork, Lock, Globe, Loader2, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlowingEffect } from '@/components/ui/glow-effect';

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
      <div className="w-full">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <div className="p-3 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-xl">
              <Github className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Import Git Repository</h1>
          <p className="text-gray-400 text-lg">Import an existing Git Repository to reverse engineer and generate its architecture</p>
        </div>

        {/* Connect GitHub Card */}
        <Card className="relative bg-gradient-to-br from-neutral-950 to-neutral-900 border border-white/10 text-white rounded-2xl shadow-2xl">
          <GlowingEffect disabled={false} spread={35} proximity={100}
            inactiveZone={0.01} glow={true} className="rounded-2xl" />
          <CardContent className="p-12 text-center">
            <div className="p-6 bg-gradient-to-br from-red-500/20 to-red-600/20 rounded-2xl mb-8 inline-block">
              <Github className="w-16 h-16 text-red-400" />
            </div>
            <CardTitle className="text-2xl font-bold mb-4 bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent">
              Connect GitHub
            </CardTitle>
            <CardDescription className="text-gray-400 mb-8 text-lg leading-relaxed">
              Connect your GitHub account to browse and import your repositories for architecture analysis.
            </CardDescription>
            <Button
              onClick={() => window.location.href = '/api/github/auth'}
              className="relative w-full h-14 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-200 font-semibold text-lg rounded-xl"
            >
              <GlowingEffect disabled={false} spread={35} proximity={69}
                inactiveZone={0.01} glow={true} className="rounded-xl" />
              <Github className="w-5 h-5 mr-3" />
              Connect GitHub Account
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="text-left mb-8">
        <h1 className="text-5xl font-bold text-white mb-2">Let's reverse engineer your code</h1>
        <p className="text-gray-400 text-md">Import an existing Git Repository to reverse engineer - generate its architecture and make big fucking changes</p>
      </div>

      {/* Search Section */}
      <div className="bg-gradient-to-br from-neutral-950 to-neutral-900 border border-white/10 rounded-2xl p-6 mb-6">
        <form onSubmit={handleSearch} className="relative">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              type="text"
              placeholder="Search your repositories..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 pr-4 py-3 w-full bg-black/50 border border-white/20 rounded-xl focus:ring-2 focus:ring-red-500/50 focus:border-red-500/50 text-white placeholder-gray-400 transition-all duration-200"
            />
            {searchLoading && (
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <Loader2 className="h-5 w-5 animate-spin text-red-400" />
              </div>
            )}
          </div>
        </form>
      </div>

      {/* Repository List */}
      <div className="bg-gradient-to-br from-neutral-950 to-neutral-900 border border-white/10 rounded-2xl p-6">
        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="flex items-center p-4 bg-black/50 border border-white/10 rounded-xl animate-pulse">
                <div className="w-12 h-12 bg-gray-700 rounded-full mr-4"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-700 rounded w-48"></div>
                  <div className="h-3 bg-gray-700 rounded w-32"></div>
                </div>
                <div className="w-20 h-8 bg-gray-700 rounded"></div>
              </div>
            ))}
          </div>
        ) : (
          <div>
            {repos.length === 0 ? (
              <div className="text-center py-12">
                <div className="p-4 bg-gradient-to-br from-gray-500/20 to-gray-600/20 rounded-xl mb-4 inline-block">
                  <Github className="w-12 h-12 text-gray-400" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">No repositories found</h3>
                <p className="text-gray-400 mb-6">
                  {searchTerm ? 'Try adjusting your search terms or browse all repositories.' : 'You don\'t have any repositories yet, or they might be private.'}
                </p>
                {searchTerm && (
                  <Button
                    onClick={() => {
                      setSearchTerm('');
                      fetchRepos();
                    }}
                    className="bg-white text-black hover:bg-gray-100 transition-all duration-200 font-semibold"
                  >
                    View All Repositories
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  {searchTerm && (
                    <Button
                      onClick={() => {
                        setSearchTerm('');
                        fetchRepos();
                      }}
                      variant="outline"
                      size="sm"
                      className="border-white/20 text-white hover:bg-white/10 hover:border-white/40"
                    >
                      Clear Search
                    </Button>
                  )}
                </div>
                
                <div className="grid grid-cols-1 gap-4 max-h-96 overflow-y-auto">
                  {repos.map((repo) => (
                    <div
                      key={repo.id}
                      className="flex items-center p-4 bg-black/30 border border-white/10 hover:border-white/30 rounded-xl transition-all duration-200 group"
                    >
                      {/* Repository Info */}
                      <div className="flex items-center flex-1 min-w-0 mr-4">
                        <Avatar className="w-10 h-10 ring-2 ring-white/20 mr-3 flex-shrink-0">
                          <img src={repo.owner.avatarUrl} alt={repo.owner.login} />
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-semibold text-white truncate">{repo.name}</h4>
                            {repo.private ? (
                              <Lock className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            ) : (
                              <Globe className="w-3 h-3 text-gray-400 flex-shrink-0" />
                            )}
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-gray-400">
                            <span>@{repo.owner.login}</span>
                            {repo.language && (
                              <div className="flex items-center space-x-1">
                                <div className="w-2 h-2 rounded-full bg-red-400"></div>
                                <span>{repo.language}</span>
                              </div>
                            )}
                            <div className="flex items-center space-x-1">
                              <Star className="w-3 h-3" />
                              <span>{repo.stargazersCount}</span>
                            </div>
                            <span>Updated {formatTimeAgo(repo.updatedAt)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center space-x-2 flex-shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(`https://github.com/${repo.fullName}`, '_blank')}
                          className="border-white/20 text-black hover:bg-white/69 hover:border-white/40"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Button>
                        <Button
                          onClick={() => handleImport(repo)}
                          disabled={importing === repo.id}
                          size="sm"
                          className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-200 font-semibold min-w-[80px]"
                        >
                          {importing === repo.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            'Import'
                          )}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
