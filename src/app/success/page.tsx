"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Check, ArrowRight, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { FlickeringGrid } from "@/components/ui/flickering-grid";
import useUserSubscription from "@/hooks/useSubscription";

export default function SuccessPage() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showContent, setShowContent] = useState(false);
  const [countdown, setCountdown] = useState(25);
  
  // Clear subscription cookies and fetch fresh data on mount
  useEffect(() => {
    // Delete subscription-related cookies to bypass cache
    document.cookie = 'subscription_status=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'subscription_signature=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    document.cookie = 'subscription_user_id=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    
    // Force a fresh fetch by adding a cache-busting parameter
    fetch(`/api/user/subscription-status?refresh=${Date.now()}`, {
      credentials: 'include',
    }).catch(err => console.error('Failed to refresh subscription:', err));
  }, []);

  // Fetch fresh subscription status (will get fresh data after cookies are cleared)
  const { userSubscription, isLoadingUserSubscription } = useUserSubscription();

  useEffect(() => {
    setMounted(true);
    const timer = setTimeout(() => setShowContent(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      router.push("/");
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown, router]);

  // Show loading state while fetching subscription
  if (isLoadingUserSubscription) {
    return (
      <div className="h-screen bg-black text-white relative overflow-hidden flex items-center justify-center">
        {/* Animated background gradient */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(34,197,94,0.15), rgba(220,38,38,0.1), transparent 60%)`,
          }}
        />

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `
                linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
              `,
              backgroundSize: "60px 60px",
            }}
          />
        </div>

        {/* Loading Content */}
        <div className="relative z-10 flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-green-400" />
          <p className="text-lg text-gray-300">Verifying your subscription...</p>
        </div>
      </div>
    );
  }

  if(userSubscription) {
    return (
        <div className="h-screen bg-black text-white relative overflow-hidden flex items-center justify-center">
          {/* Animated background gradient */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              background: `radial-gradient(circle at 50% 50%, rgba(34,197,94,0.15), rgba(220,38,38,0.1), transparent 60%)`,
            }}
          />
    
          {/* Grid pattern overlay */}
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `
                  linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
                  linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
                `,
                backgroundSize: "60px 60px",
              }}
            />
          </div>
    
          {/* Left side flickering grid */}
          <div className="hidden sm:block absolute left-0 top-0 h-full w-1/4 sm:w-1/3 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-transparent to-black z-10" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black via-black/90 to-transparent z-10" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/90 to-transparent z-10" />
            {mounted && (
              <FlickeringGrid
                className="h-full w-full"
                squareSize={2.5}
                gridGap={2.5}
                color="#22c55e"
                maxOpacity={0.4}
                flickerChance={0.03}
              />
            )}
          </div>
    
          {/* Right side flickering grid */}
          <div className="hidden sm:block absolute right-0 top-0 h-full w-1/4 sm:w-1/3 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-l from-transparent via-transparent to-black z-10" />
            <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black via-black/90 to-transparent z-10" />
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black via-black/90 to-transparent z-10" />
            {mounted && (
              <FlickeringGrid
                className="h-full w-full"
                squareSize={2.5}
                gridGap={2.5}
                color="#22c55e"
                maxOpacity={0.4}
                flickerChance={0.03}
              />
            )}
          </div>
    
          {/* Main Content - Centered */}
          <div className="relative z-10 px-4 flex justify-center -mt-28">
            <div
              className={`max-w-2xl mx-auto text-center transition-all duration-700 ${
                showContent ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
              }`}
            >
              {/* Success Icon */}
              <div className="mb-6 flex justify-center">
                <div className="relative">
                <Image
                    src="/pro2.png"
                    alt="DevilDev Pro"
                    width={200}
                    height={67}
                    className="w-full max-w-[150px] md:max-w-[200px] h-auto"
                    priority
                  />
                </div>
              </div>
    
              {/* Success Message */}
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black mb-4">
                <span className="bg-gradient-to-r from-green-300 via-green-400 to-emerald-500 bg-clip-text text-transparent">
                  Thank you for your purchase!
                </span>
              </h1>
    
              <p className="text-lg md:text-xl text-gray-300 mb-8">
                Your subscription has been{" "}
                <span className="text-green-400 font-semibold">successfully activated</span>
              </p>
    
              
    
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <Button
                  onClick={() => router.push("/project")}
                  className="w-full cursor-pointer sm:w-auto px-6 py-3 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white font-semibold shadow-[0_0_20px_rgba(34,197,94,0.3)] hover:shadow-[0_0_30px_rgba(34,197,94,0.5)] transition-all duration-300"
                >
                  Go to Projects
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                <Button
                  onClick={() => router.push("/new")}
                  variant="outline"
                  className="w-full cursor-pointer sm:w-auto px-6 py-3 border-2 border-zinc-600 hover:border-green-500/50 bg-transparent text-white hover:bg-green-500/10 hover:text-white transition-all duration-300"
                >
                  Create New Project
                </Button>
              </div>
    
              {/* Countdown Timer */}
              <div className="mt-6 text-gray-400 text-sm">
                Redirecting to home page in <span className="text-green-400 font-semibold">{countdown}</span> seconds...
              </div>
            </div>
          </div>
    
          {/* Subtle glow effects */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        </div>
      );
  }

  return (
    <div className="h-screen bg-black text-white relative overflow-hidden flex items-center justify-center">
        <h1>Something went wrong</h1>
    </div>
  )

  
}