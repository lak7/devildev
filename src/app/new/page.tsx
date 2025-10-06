'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import ImportGitRepository from '@/components/ImportGitRepository';
import { checkInfo, checkPackageAndFramework } from '../../../actions/reverse-architecture';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GlowingEffect } from '@/components/ui/glow-effect';
import GithubOAuthDeprecatedNotice from '@/components/GithubOAuthDeprecatedNotice';
import { Loader2, Github, ArrowLeft, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Image from 'next/image';
import { submitFeedback } from '../../../actions/feedback';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useUser } from '@clerk/nextjs';
import Nav from '@/components/core/Nav';
import Link from 'next/link';
import useUserSubscription from '@/hooks/useSubscription';
import { maxProjectSizeFree, maxProjectSizePro } from '../../../Limits';
import PricingDialog from '@/components/PricingDialog';

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
  const { isLoaded, isSignedIn, user } = useUser();
  const [isImportInfoOpen, setIsImportInfoOpen] = useState(false);
  const [isTooBigDialogOpen, setIsTooBigDialogOpen] = useState(false);
    // Feedback dialog state
    const [isFeedbackOpen, setIsFeedbackOpen] = useState(false);
    const [feedbackText, setFeedbackText] = useState('');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState(false);
    const [feedbackMessage, setFeedbackMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const { userSubscription, isLoadingUserSubscription, isErrorUserSubscription } = useUserSubscription();

  const handleImport = async (repo: Repository, installationId?: string | null) => {
    setImporting(true); 
    try { 
      if(isLoadingUserSubscription){
        return;
      } 
      const res = await checkPackageAndFramework(repo.id.toString(), repo.fullName, userSubscription ? maxProjectSizePro : maxProjectSizeFree, installationId || undefined);
      const {result: response, project: project} = res;
      // const {repoInfo: response, defaultBranch: project} = await checkInfo(repo.id.toString(), repo.fullName);
      let cleanedResult = response;
      if (typeof response === 'string') { 
        // Remove markdown code blocks (```json...``` or ```...```)
        cleanedResult = response
          .replace(/^```json\s*/i, '')
          .replace(/^```\s*/, '')
          .replace(/\s*```\s*$/, '')
          .trim();
      } 

      const parsedResponse = typeof cleanedResult === 'string' 
        ? JSON.parse(cleanedResult)  
        : cleanedResult; 

      if (parsedResponse && project) {
        if(parsedResponse.isValid){
          router.push(`/project/${project.id}`);
        } else {
          setIsImportInfoOpen(true);
        }
      } else if(res.status === "tooBig"){
        setIsTooBigDialogOpen(true);
      } else {
        setIsImportInfoOpen(true);
      }
    } catch (error) {
      console.error('Error importing repository:', error);
    } finally {
      setImporting(false);
    }
  };

  // Function to handle feedback submission
  const handleFeedbackSubmit = async () => {
    if (!feedbackText.trim() || isSubmittingFeedback) return;
    
    setIsSubmittingFeedback(true);
    setFeedbackMessage(null);
    
    try {
      const result = await submitFeedback("new", feedbackText);
      
      if (result.success) {
        setFeedbackMessage({
          type: 'success',
          text: 'Thank you for your feedback! We appreciate your input.'
        });
        setFeedbackText(''); 
        
        // Close dialog after a short delay to show success message
        setTimeout(() => {
          setIsFeedbackOpen(false);
          setFeedbackMessage(null);
        }, 2000);
      } else {
        setFeedbackMessage({
          type: 'error',
          text: result.error || 'Failed to submit feedback. Please try again.'
        });
      }
    } catch (error) {
      console.error('Error submitting feedback:', error);
      setFeedbackMessage({
        type: 'error',
        text: 'Failed to submit feedback. Please try again.'
      });
    } finally {
      setIsSubmittingFeedback(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-black to-zinc-950 text-white flex flex-col">
      {/* Header */}
      <Nav setIsFeedbackOpen={setIsFeedbackOpen} isMCP={false} isProject={true} />
      

      {/* Main Content */}
      <ImportGitRepository onImport={handleImport} />

      {/* Loading Overlay */}
      {importing && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
          <Card className="relative bg-neutral-950 border border-white/20 text-white rounded-xl shadow-2xl max-w-sm w-full mx-4">
            <GlowingEffect disabled={false} spread={35} proximity={100}
              inactiveZone={0.01} glow={true} className="rounded-xl" />
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center space-x-3 mb-4">
                <Loader2 className="h-6 w-6 animate-spin text-red-400" />
                <span className="text-lg font-medium">Importing repository...</span>
              </div>
              <p className="text-gray-400">
                Please wait while we analyze your repository and generate the architecture.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Feedback Dialog */}
      {isFeedbackOpen && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-gray-600 rounded-lg p-6 w-full max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Send Feedback</h3>
              <button
                onClick={() => setIsFeedbackOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Share your experience, report bugs, or suggest features..."
                className="w-full bg-black border border-gray-600 rounded-md px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-gray-400 resize-none h-32"
                maxLength={1000}
                disabled={isSubmittingFeedback}
              />
              
              {/* Success/Error Message */}
              {feedbackMessage && (
                <div className={`p-3 rounded-md text-sm ${
                  feedbackMessage.type === 'success' 
                    ? 'bg-green-900/50 border border-green-600/50 text-green-300' 
                    : 'bg-red-900/50 border border-red-600/50 text-red-300'
                }`}>
                  {feedbackMessage.text}
                </div>
              )}
              
              <div className="flex justify-between">
                <button
                  onClick={() => {
                    setIsFeedbackOpen(false);
                    setFeedbackMessage(null);
                    setFeedbackText('');
                  }}
                  disabled={isSubmittingFeedback}
                  className="px-4 py-2 text-gray-400 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleFeedbackSubmit}
                  disabled={!feedbackText.trim() || isSubmittingFeedback}
                  className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200 disabled:bg-gray-600 disabled:text-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isSubmittingFeedback && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  <span>{isSubmittingFeedback ? 'Sending...' : 'Send'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Info Dialog */}
      {isImportInfoOpen && (
        <div className="fixed inset-0 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-black border border-gray-600 rounded-lg p-6 w-full max-w-md mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Project type not supported yet</h3>
              <button
                onClick={() => setIsImportInfoOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3 text-sm text-gray-300">
              <p>Only React.js and Next.js projects are supported for import right now.</p>
              <p>If your repository already uses React or Next.js, please make sure the project is at the repository root (for example, that your <code>package.json</code> and app code are not inside a nested folder like <code>/app</code> or <code>/frontend</code>).</p>
              <p>Support for additional frameworks is in progress. Thanks for your patience!</p>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsImportInfoOpen(false)}
                className="px-4 py-2 bg-white text-black rounded-md hover:bg-gray-200"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Too Big Project - Pricing Dialog */}
      <PricingDialog 
        open={isTooBigDialogOpen} 
        onOpenChange={setIsTooBigDialogOpen}
        description="Your project exceeds the size limit for Free users. Upgrade to Pro to import larger repositories and unlock extended features."
      />

      <GithubOAuthDeprecatedNotice />
    </div>
  );
}