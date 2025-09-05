'use client';

import React, { useState, useEffect } from 'react';
import { Search, Github, ExternalLink, Clock, Star, GitFork, Lock, Globe, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import Image from 'next/image';
import { getUserProjects } from '../../actions/reverse-architecture';
// Removed card and glow imports for a minimalist view

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

interface UserProject {
  id: string;
  name: string;
  repoId: string | null;
  repoFullName: string | null;
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
  const [isGithubStatusLoading, setIsGithubStatusLoading] = useState(true);
  const [userProjects, setUserProjects] = useState<UserProject[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);

  useEffect(() => {
    checkGithubStatus();
    fetchUserProjects();
  }, []);

  useEffect(() => {
    if (githubConnected) {
      fetchRepos();
    }
  }, [githubConnected]);

  // Debounced search effect
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      handleSearch(searchTerm);
    }, 300); // 300ms delay

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const checkGithubStatus = async () => {
    setIsGithubStatusLoading(true);
    try {
      const response = await fetch('/api/github/status');
      const data = await response.json();
      setGithubConnected(data.isConnected);
      setIsGithubStatusLoading(false);
    } catch (error) {
      console.error('Error checking GitHub status:', error);
    }
  };

  const fetchUserProjects = async () => {
    try {
      setProjectsLoading(true);
      const result = await getUserProjects();
      if (result.projects) {
        setUserProjects(result.projects);
      }
    } catch (error) {
      console.error('Error fetching user projects:', error);
    } finally {
      setProjectsLoading(false);
    }
  };

  const isRepositoryImported = (repo: Repository): boolean => {
    return userProjects.some(project => 
      project.repoId === repo.id.toString() || 
      project.repoFullName === repo.fullName
    );
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
      }
    } catch (error) {
      console.error('Error fetching repositories:', error);
    } finally {
      setLoading(false);
      setSearchLoading(false);
    }
  };

  const handleSearch = (searchValue: string) => {
    if (searchValue.trim()) { 
      fetchRepos(searchValue.trim());
    } else {
      fetchRepos();
    }
  };

  const handleImport = async (repo: Repository) => {
    setImporting(repo.id);
    try {
      // Call the parent's import handler 
      await onImport(repo);
      // Refresh user projects to include the newly imported repository
      await fetchUserProjects();
    } catch (error) {
      console.error('Error importing repository:', error);
    } finally {
      setImporting(null);
    }
  };

  const openConfirmDialog = (repo: Repository) => {
    setSelectedRepo(repo);
    setIsConfirmOpen(true);
  };

  const confirmImport = async () => {
    if (!selectedRepo) return;
    setIsConfirmOpen(false);
    await handleImport(selectedRepo);
    setSelectedRepo(null);
  };

  const cancelImport = () => {
    setIsConfirmOpen(false);
    setSelectedRepo(null);
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

  if (isGithubStatusLoading) {
    return (
      <div className="w-full flex items-center justify-center min-h-[200px]">
        <div className="text-center space-y-6">
          <div className="relative w-80 h-3 bg-gray-800/50 rounded-full overflow-hidden border border-gray-700/50">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-red-600/20 rounded-full"></div>
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-full animate-[loading_2.5s_ease-in-out_infinite] shadow-lg shadow-red-500/25"></div>
          </div>
          <div className="space-y-2">
            <p className="text-gray-300 text-sm font-medium">Connecting to GitHub</p>
            <p className="text-gray-500 text-xs">Please wait while we verify your connection...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!githubConnected) {
    return (
      <div className="w-full flex items-center justify-center ">
        <div className="w-full max-w-lg">
          <div className="bg-neutral-950/80 border border-white/10 rounded-2xl p-10 shadow-xl">
            <div className="flex flex-col items-center text-center">
              <div className="relative">
                <div className="absolute -inset-6 rounded-2xl bg-red-500/20 blur-2xl" aria-hidden="true" />
                <Image
                  src="/main00.png"
                  alt="DevilDev"
                  width={96}
                  height={96}
                  className="rounded-xl shadow-xl"
                  priority
                />
              </div>
              <h1 className="mt-6 text-2xl sm:text-3xl font-bold tracking-tight text-white">
                Connect your GitHub to DevilDev
              </h1>
              <p className="mt-2 text-sm text-gray-400 max-w-md">
                Import your repositories to reverse engineer their architecture and ship changes faster with AI assistance.
              </p>

              <div className="w-full h-px bg-white/10 my-6" />
              <Button
                onClick={() => window.location.href = '/api/github/auth'}
                className="w-full cursor-pointer h-11 bg-white text-black hover:bg-zinc-100/69 rounded-xl inline-flex items-center justify-center"
              >
                <Github className="w-4 h-4 mr-2" />
                Connect GitHub Account
              </Button>
              <p className="mt-3 text-xs text-gray-500">We only request access needed to list your repos.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header Section */}
      <div className="text-left mb-8">
        <h1 className="text-5xl font-bold text-white mb-2">Let's reverse engineer your code</h1>
        <p className="text-gray-400 text-md">Import an existing Git Repository to reverse engineer - generate its architecture and make big fucking changes</p>
        <div className="mt-4 p-3 rounded-lg border border-red-500/50 bg-red-500/10">
          <p className="text-sm text-red-200 font-semibold">
            Important: Only React.js and Next.js projects are supported for import right now.
          </p>
        </div>
      </div>

      {/* Search Section */}
      <div className="bg-gradient-to-br from-neutral-950 to-neutral-900 border border-white/10 rounded-2xl p-6 mb-6">
        <div className="relative">
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
        </div>
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
                      className="border-white/20 text-black hover:text-white hover:bg-white/10 hover:border-white/40"
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
                        {isRepositoryImported(repo) ? (
                          <Button
                            disabled
                            size="sm"
                            className="bg-green-600/20 border border-green-500/50 text-green-300 cursor-not-allowed transition-all duration-200 font-semibold min-w-[120px]"
                          >
                            <Check className="h-4 w-4 mr-2" />
                            Already Imported
                          </Button>
                        ) : (
                          <Button
                            onClick={() => openConfirmDialog(repo)}
                            disabled={importing === repo.id || projectsLoading}
                            size="sm"
                            className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-200 font-semibold min-w-[80px]"
                          >
                            {importing === repo.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Import'
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      {isConfirmOpen && selectedRepo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={cancelImport} />
          <div className="relative z-10 w-full max-w-md rounded-xl border border-white/50 bg-neutral-950 p-6 shadow-2xl">
            <div className="mb-4">
              <h2 className="text-xl font-semibold text-white">Confirm Import</h2>
              <p className="mt-2 text-sm text-gray-400">
                Do you want to import <span className="font-medium text-white">{selectedRepo.fullName}</span> and generate its architecture?
              </p>
            </div>
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="outline"
                onClick={cancelImport}
                className="border-white/20 text-black hover:text-white hover:bg-white/10 hover:border-white/40"
              >
                Cancel
              </Button>
              <Button
                onClick={confirmImport}
                disabled={importing === selectedRepo.id}
                className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white"
              >
                {importing === selectedRepo.id ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm & Import'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
