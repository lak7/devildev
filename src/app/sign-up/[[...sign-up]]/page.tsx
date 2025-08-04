"use client";

import { SignUp, SignUpButton } from "@clerk/nextjs";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMobile } from "@/util/useMobile";
import { useEffect } from "react";

export default function Page() {
  const isMobile = useMobile();

  // Add a useEffect to inject custom CSS for Clerk components
  useEffect(() => {
    // Create a style element
    const style = document.createElement('style');
    
    // Add enhanced CSS rules for modern Clerk components
    style.textContent = `
      .cl-card {
        width: 100% !important;
        max-width: 100% !important;
        background: transparent !important;
        box-shadow: none !important;
      }
      .cl-formButtonPrimary {
        margin: 0 auto !important;
        display: block !important;
        width: 100% !important;
        background: #ef4444 !important;
        border: none !important;
        border-radius: 12px !important;
        font-weight: 700 !important;
        text-transform: uppercase !important;
        letter-spacing: 0.5px !important;
        transition: all 0.3s ease !important;
        color: white !important;
      }
      .cl-formButtonPrimary:hover {
        transform: translateY(-1px) !important;
        background: #dc2626 !important;
        box-shadow: 0 8px 25px rgba(239, 68, 68, 0.3) !important;
      }
      .cl-socialButtonsBlockButton {
        margin: 0 auto !important;
        justify-content: center !important;
        width: 100% !important;
        background: rgba(0, 0, 0, 0.3) !important;
        border: 1px solid rgba(239, 68, 68, 0.4) !important;
        border-radius: 12px !important;
        backdrop-filter: blur(10px) !important;
        transition: all 0.3s ease !important;
        color: white !important;
      }
      .cl-socialButtonsBlockButton:hover {
        border-color: rgba(239, 68, 68, 0.7) !important;
        background: rgba(239, 68, 68, 0.1) !important;
        transform: translateY(-1px) !important;
      }
      .cl-formFieldInput__emailAddress, .cl-formFieldInput {
        text-align: center !important;
        background: rgba(0, 0, 0, 0.5) !important;
        border: 1px solid rgba(239, 68, 68, 0.4) !important;
        border-radius: 12px !important;
        backdrop-filter: blur(10px) !important;
        transition: all 0.3s ease !important;
        color: white !important;
      }
      .cl-formFieldInput__emailAddress:focus, .cl-formFieldInput:focus {
        border-color: #ef4444 !important;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2) !important;
        background: rgba(0, 0, 0, 0.7) !important;
      }
      .cl-formFieldInput__emailAddress::placeholder, .cl-formFieldInput::placeholder {
        text-align: center !important;
        color: rgba(255, 255, 255, 0.5) !important;
      }
      .cl-headerTitle, .cl-headerSubtitle {
        text-align: center !important;
      }
      .cl-headerTitle {
        color: white !important;
        font-weight: 700 !important;
        font-size: 2rem !important;
      }
      .cl-headerSubtitle {
        color: white !important;
        font-weight: 500 !important;
      }
      @media (max-width: 640px) {
        .cl-headerTitle {
          font-size: 1.5rem !important;
        }
        .cl-headerSubtitle {
          font-size: 0.875rem !important;
        }
      }
      .cl-main {
        padding: 0 !important;
        margin: 0 auto !important;
        width: 100% !important;
      }
      .cl-form {
        width: 100% !important;
      }
      .cl-formFieldRow {
        width: 100% !important;
      }
      .cl-dividerText {
        text-align: center !important;
        color: rgba(255, 255, 255, 0.6) !important;
        text-transform: uppercase !important;
        font-size: 12px !important;
        letter-spacing: 1px !important;
      }
      .cl-dividerLine {
        background: linear-gradient(90deg, transparent, rgba(239, 68, 68, 0.4), transparent) !important;
        height: 1px !important;
      }
      .cl-identityPreview {
        margin: 0 auto !important;
      }
      .cl-formFieldLabel {
        color: white !important;
        font-weight: 500 !important;
        text-transform: uppercase !important;
        font-size: 12px !important;
        letter-spacing: 0.5px !important;
      }
      .cl-footerActionLink {
        color: rgba(255, 255, 255, 0.8) !important;
        transition: all 0.3s ease !important;
      }
      .cl-footerActionLink:hover {
        color: white !important;
        text-shadow: 0 0 8px rgba(255, 255, 255, 0.3) !important;
      }
      .cl-footerActionLink[href*="sign-up"] {
        color: black !important;
      }
      .cl-footerActionLink[href*="sign-up"]:hover {
        color: #333 !important;
      }
    `;
    
    // Append the style element to the document head
    document.head.appendChild(style);
    
    // Clean up function to remove the style element when component unmounts
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center overflow-hidden">
      {/* Simple gradient background to match website */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-red-500/10 to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-red-500/10 to-transparent" />
      </div>

      {/* Grid pattern to match website */}
      <div
        className="fixed inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(239, 68, 68, 0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(239, 68, 68, 0.5) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
          backgroundColor: "black",
        }}
      />

  

      {/* Main container with modern glass morphism */}
      <div className={`${isMobile ? 'w-[90vw] h-[85vh]' : 'w-[85vw] max-w-6xl h-[85vh]'} relative z-10`}>
        {/* Return to Home Button */}
        <Link
          href="/"
          className={`absolute ${isMobile ? 'top-4 left-4' : 'top-6 left-6'} z-20 group`}
        >
          <div className="flex items-center gap-3 px-4 py-2 rounded-xl bg-black/40 backdrop-blur-md border border-red-500/30 hover:border-red-500/60 transition-all duration-300 hover:bg-black/60">
            <div className="w-2 h-2 bg-red-500 rounded-full group-hover:scale-125 transition-transform duration-300"></div>
            <span className={`text-white font-mono tracking-wider ${isMobile ? 'text-xs' : 'text-sm'}`}>
              RETURN
            </span>
          </div>
        </Link>

        {/* Modern Sign In Panel */}
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ 
            duration: 0.8, 
            ease: [0.25, 0.46, 0.45, 0.94],
            type: "spring",
            damping: 25,
            stiffness: 200
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <div className={`${isMobile ? 'w-[85%] max-w-sm' : 'max-w-lg w-full'} flex justify-center`}>
            <div className="relative w-full group">
              {/* Glow effect */}
              <div className="absolute -inset-1 bg-gradient-to-r from-red-500/20 via-red-500/30 to-red-500/20 rounded-2xl blur-xl opacity-0 "></div>
              
              {/* Main panel */}
              <div className="relative bg-black/40 backdrop-blur-xl border border-red-500/30 rounded-2xl p-8 md:p-10  shadow-2xl">
                {/* Header badge */}
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <div className="bg-black/80 backdrop-blur-sm px-6 py-2 rounded-full border border-red-500/40 shadow-lg">
                    <span className="text-white font-mono text-xs tracking-[0.2em] uppercase font-semibold">
                      Secure Authentication
                    </span>
                  </div>
                </div>
                
                
                {/* Logo */}
                <div className="flex justify-center w-full">
                  <img 
                    src="/favicon.jpg" 
                    alt="DevilDev Logo" 
                    className="w-16 h-16 rounded-full"
                  />
                </div>

                <div className="flex justify-center w-full">
                <SignUp
                  appearance={{
                    layout: {
                      socialButtonsVariant: "blockButton",
                      socialButtonsPlacement: "top",
                      termsPageUrl: "https://clerk.dev/terms",
                    },
                    elements: {
                      logoImageUrl: "/favicon.jpg",
                      rootBox: "w-full flex justify-center",
                      card: "bg-transparent shadow-none w-full",
                      main: "w-full flex justify-center",
                      form: "w-full",
                      formButtonPrimary:
                        "bg-[#F8791A] hover:bg-[#F8791A]/90 text-black font-mono tracking-wider transition-all duration-300 transform hover:scale-[1.02] w-full",
                      headerTitle:
                        `text-white font-mono ${isMobile ? 'text-2xl' : 'text-3xl'} tracking-widest text-center font-bold`,
                      headerSubtitle: `text-white font-mono ${isMobile ? 'text-sm' : 'text-base'} tracking-wide text-center`,
                      socialButtonsBlockButton:
                        "font-mono border-[#F8791A]/30 hover:border-[#F8791A] text-[#F8791A] tracking-wider transition-all duration-300 w-full",
                      dividerLine: "bg-[#F8791A]/30",
                      dividerText: "text-[#F8791A]/50 font-mono tracking-wider text-center",
                      formFieldLabel: "text-[#F8791A] font-mono tracking-wider",
                      formFieldInput:
                        "font-mono bg-black/50 border-[#F8791A]/30 text-[#F8791A] focus:border-[#F8791A] focus:ring-[#F8791A]/50 tracking-wider text-center w-full",
                      formFieldRow: "w-full",
                      footerActionLink:
                        "text-[#F8791A] hover:text-[#F8791A]/80 font-mono tracking-wider transition-all duration-300",
                      footer: "hidden",
                      footerAction: "hidden",
                      formFieldAction: "hidden",
                      alert: "hidden",
                    },
                  }}
                />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
        
      </div>

      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"/>


      <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-red-500/40"></div>
      <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-red-500/40"></div>
      <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-red-500/40"></div>
      <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-red-500/40"></div>

      {/* Corner accents */}
      <div className="absolute top-8 left-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
      <div className="absolute top-8 right-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
      <div className="absolute bottom-8 left-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
      <div className="absolute bottom-8 right-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
      

      {/* Enhanced Custom Styles */}
      <style jsx global>{`
        @keyframes floating {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(180deg);
          }
        }
        
        @keyframes glow-pulse {
          0%, 100% {
            box-shadow: 0 0 20px rgba(239, 68, 68, 0.2);
          }
          50% {
            box-shadow: 0 0 40px rgba(239, 68, 68, 0.4);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        
        .animate-floating {
          animation: floating 6s ease-in-out infinite;
        }
        
        .animate-glow-pulse {
          animation: glow-pulse 3s ease-in-out infinite;
        }
        
        .animate-shimmer {
          background: linear-gradient(
            90deg,
            transparent 25%,
            rgba(239, 68, 68, 0.1) 50%,
            transparent 75%
          );
          background-size: 200% 100%;
          animation: shimmer 2s infinite;
        }
        
        /* Custom scrollbar for potential overflow */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
        }
        
        ::-webkit-scrollbar-thumb {
          background: rgba(239, 68, 68, 0.3);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(239, 68, 68, 0.5);
        }
      `}</style>
    </div>
  );
}
