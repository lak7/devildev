'use client'

import { useRouter } from 'next/navigation'
import { GlowDiv } from '@/components/ui/GlowDiv'
import { useEffect, useState } from 'react';
import { useUser } from '@clerk/nextjs';

export default function GithubOAuthDeprecatedNotice() {
  const router = useRouter()
  const { isLoaded, isSignedIn, user } = useUser();
  const [githubOAuthConnected, setGithubOAuthConnected] = useState<boolean>(false);
  const [isGithubStatusLoading, setIsGithubStatusLoading] = useState(false);

  useEffect(() => {
    if (isSignedIn && isLoaded) {

      checkGithubOAuthStatus();
    }
  }, [isSignedIn, isLoaded]);

  const checkGithubOAuthStatus = async () => {
    if(localStorage.getItem('githubOAuthConnected') === 'true'){
      setGithubOAuthConnected(true);
      setIsGithubStatusLoading(false);
      return;
    }else if(localStorage.getItem('githubOAuthConnected') === 'false'){
      setGithubOAuthConnected(false);
      setIsGithubStatusLoading(false);
      return;
    }
    setIsGithubStatusLoading(true);
    try {
      const response = await fetch('/api/github/status');
      const data = await response.json();
      setGithubOAuthConnected(data.isConnected);
      localStorage.setItem('githubOAuthConnected', data.isConnected.toString());
      setIsGithubStatusLoading(false);
    } catch (error) {
      console.error('Error checking GitHub status:', error);
    }
  };

  if(githubOAuthConnected){
    return (
<div className="fixed bottom-4 right-4 z-50 notice-anim">
      <GlowDiv variant="red" size="md" className="w-64 h-64 p-4 flex flex-col justify-between">
        <div>
          <div className="flex flex-col items-start text-center">
            <div className="relative">
              <div className="absolute -inset-6 rounded-2xl bg-yellow-500/20 blur-2xl" aria-hidden="true" />
              <div className="w-full px-2 h-7 bg-yellow-500/20 rounded-sm flex items-center justify-center">
                <span className="text-sm">{"⚠️ IMPORTANT NOTICE"} </span>
              </div>
            </div>
            <h1 className="mt-3 text-md sm:text-xl font-bold tracking-tight text-left text-white">
              Github OAuth is Deprecated. Please <span className="text-red-500">Disconnect</span>  it from the settings page.
            </h1>
          </div>
        </div>
        <button
          onClick={() => router.push('/settings?tab=integrations')}
          className="mt-3 px-3 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white text-sm cursor-pointer"
        >
          Go to Settings
        </button>
      </GlowDiv>
      <style jsx>{`
        @keyframes gentle-float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-4px); }
        }
        .notice-anim { animation: gentle-float 3.5s ease-in-out infinite; }
      `}</style>
    </div>
    )
  }


  return null;
}


