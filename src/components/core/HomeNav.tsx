import Link from "next/link";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { SignOutButton } from "@clerk/nextjs";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";

export default function HomeNav() {
  const router = useRouter();
  const { user } = useUser();
  return (
    <nav className=" max-w-6xl mx-auto top-4 left-0 right-0 z-40 bg-black/80 backdrop-blur-md flex items-center justify-between h-16  flex-shrink-0 relative  ">

              {/* Logo on the left */}
              <div className="flex z-20 items-center">
                <button
                  onClick={() => router.push('/')}
                  className="flex items-center cursor-pointer hover:opacity-80 transition-opacity group"
                  title="Go to Home"
                >
                  <Image
                  src="/bold01.png"
                  alt="DevilDev Logo"
                  width={15000}
                  height={4000}
                  className="h-full w-11 "
                  priority
                />
                </button>
                
              </div>

              {/* Navigation links in center */}
              <div className="flex z-10 absolute w-full justify-center items-center">
                 {/* Navigation links in center */}
              <div className="hidden md:flex items-center justify-center space-x-12">
                <a
                  href="/"
                  className="text-white font-medium text-sm px-5 py-1  rounded-4xl bg-zinc-800/50 border border-gray-700/50 transition-all duration-200"
                >
                  Home
                </a>
                <a
                  href="/community"
                  className="text-gray-400 font-medium text-sm transition-colors duration-200 hover:text-white"
                >
                  Community
                </a>
                <a
                  href="/contact"
                  className="text-gray-400 font-medium text-sm transition-colors duration-200 hover:text-white"
                >
                  Contact
                </a>
              </div>
              </div>   

              {/* Projects button on the right */}
              <div className="flex z-20 items-center space-x-3">
              <Link
                      className="bg-white h-8 hidden md:flex items-center justify-center text-sm font-normal tracking-wide rounded-full text-black dark:text-secondary-foreground w-fit px-4 shadow-[inset_0_1px_2px_rgba(255,255,255,0.25),0_3px_3px_-1.5px_rgba(16,24,40,0.06),0_1px_1px_rgba(16,24,40,0.08)] border border-white/[0.12]"
                      href="/project"
                    >
                      Projects
                    </Link>
                    <div className="flex items-center">
          <Popover>
           <PopoverTrigger asChild>
             <button className="w-8 h-8 rounded-full flex items-center justify-center focus:outline-none focus:ring-2 focus:ring-gray-500/50">
               <Avatar className="size-8 ring-2 ring-gray-600/30 hover:ring-gray-500/50 transition-all duration-200">
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
        </nav>
  )
}