'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { BrainCircuit, FolderKanban, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { useUser, SignOutButton } from '@clerk/nextjs';

interface NavProps {
  setIsFeedbackOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isMCP: boolean;
  isProject: boolean;
}

export default function Nav({ setIsFeedbackOpen, isMCP = false, isProject = false }: NavProps) {
  const router = useRouter();
  const { user } = useUser();
  return (
    <nav className='w-full flex justify-center items-center backdrop-blur-sm border-b border-gray-800/50'>
    <div className="sticky top-0 z-40 bg-black/80 backdrop-blur-md  w-full px-14 ">
      <div className="w-full py-3 ">
        <div className="flex items-start justify-between ">
          {/* Logo on left */}
          <button
                onClick={() => router.push('/')}
                className="flex items-center cursor-pointer hover:opacity-80 transition-opacity group"
                title="Go to Home"
              >
                <Image
                src="/text01.png"
                alt="DevilDev Logo"
                width={15000}
                height={4000}
                className="h-full w-32 "
                priority
              />
              </button>

              <div className="flex items-center space-x-3">

                {isProject && (
                    <button
                    onClick={() => window.open('/project')}
                    className="flex items-center space-x-2 px-3 py-2 bg-black hover:bg-gray-900 border border-white/50 hover:border-gray-300 rounded-lg transition-all duration-200 group"
                    title="Send Feedback"
                  >
                    <FolderKanban className="h-4 w-4 text-white group-hover:text-gray-300 transition-colors" />
                    <span className="text-sm text-white group-hover:text-gray-300 transition-colors hidden sm:block">
                      Projects
                    </span>
                  </button>
                )}

                {isMCP && (
                       <button
                       onClick={() => window.open('/connect-mcp', '_blank')}
                       className="flex items-center space-x-2 px-3 py-2 bg-black hover:bg-gray-900 border border-white/50 hover:border-gray-300 rounded-lg transition-all duration-200 group"
                       title="Send Feedback"
                     >
                       <BrainCircuit className="h-4 w-4 text-white group-hover:text-gray-300 transition-colors" />
                       <span className="text-sm text-white group-hover:text-gray-300 transition-colors hidden sm:block">
                         Connect MCP
                       </span>
                     </button>
                )}
     

          {/* Feedback button */}
          <button
            onClick={() => setIsFeedbackOpen(true)}
            className="flex items-center space-x-2 px-3 py-2 bg-black hover:bg-gray-900 border border-white/50 hover:border-gray-300 rounded-lg transition-all duration-200 group"
            title="Send Feedback"
          >
            <MessageSquare className="h-4 w-4 text-white group-hover:text-gray-300 transition-colors" />
            <span className="text-sm text-white group-hover:text-gray-300 transition-colors hidden sm:block">
              Feedback
            </span>
          </button>

          {/* User Avatar */}
          <div className="flex items-center">
          <Popover>
           <PopoverTrigger asChild>
             <button className="w-8 h-8 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gray-500/50">
               <Avatar className="size-9 ring-2 ring-gray-600/30 hover:ring-gray-500/50 transition-all duration-200">
                 <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                 <AvatarFallback className="bg-red-500/20 text-red-400 font-semibold">
                   {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress.charAt(0) || "U"}
                 </AvatarFallback>
               </Avatar>
             </button>
           </PopoverTrigger>
           <PopoverContent align="end" className="w-64 p-3 mt-2 bg-black border border-gray-700 text-white">
             <div className="flex items-center gap-3 pb-3 border-b border-gray-800">
               <Avatar className="size-10">
                 <AvatarImage src={user?.imageUrl} alt={user?.fullName || "User"} />
                 <AvatarFallback className="bg-red-500/20 text-red-400 font-semibold">
                   {user?.firstName?.charAt(0) || user?.emailAddresses?.[0]?.emailAddress.charAt(0) || "U"}
                 </AvatarFallback>
               </Avatar>
               <div className="min-w-0">
                 <p className="text-sm font-medium truncate">{user?.fullName || "User"}</p>
                 <p className="text-xs text-gray-400 truncate">{user?.emailAddresses?.[0]?.emailAddress || ""}</p>
               </div>
             </div>
             <div className="pt-3">
               <SignOutButton>
                 <button className="w-full px-3 py-2 text-sm bg-white text-black rounded-md hover:bg-gray-200 transition-colors">
                   Sign out
                 </button>
               </SignOutButton>
             </div>
           </PopoverContent>
         </Popover>
          </div>
        </div>

          
         
        </div>
      </div>
    </div>
    </nav>
  )
}