'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImportGitRepository from '@/components/ImportGitRepository';

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

export default function NewPage() {
  const router = useRouter();
  const [importing, setImporting] = useState(false);

  const handleImport = async (repo: Repository) => {
    setImporting(true);
    try {
      const response = await fetch('/api/github/import', {
        method: 'POST', 
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositoryId: repo.id,
          repositoryName: repo.name,
          fullName: repo.fullName,
          description: repo.description,
          language: repo.language,
          isPrivate: repo.private,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        alert("Imported successfully");
        console.log("This is special: ", data);
        // Redirect to the chat page for the imported repository
        // router.push(`/dev/${data.chatId}`);
      } else {
        console.error('Import failed:', data.error);
        alert('Failed to import repository: ' + (data.error || 'Unknown error'));
      }
    } catch (error) {
      console.error('Error importing repository:', error);
      alert('Failed to import repository. Please try again.');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-8">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Let's build something new.
              </h1>
              <p className="text-gray-600">
                Import an existing Git Repository to reverse engineer and generate its architecture
              </p>
            </div>
            
            <ImportGitRepository onImport={handleImport} />
             
            {importing && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
                  <div className="flex items-center space-x-3">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                    <span className="text-lg font-medium">Importing repository...</span>
                  </div>
                  <p className="text-gray-600 mt-2">
                    Please wait while we analyze your repository and generate the architecture.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}