"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Github,
  Twitter,
  Mail,
  ArrowRight,
  Code2,
  Zap,
  Sparkles,
} from "lucide-react";

export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      setIsSubmitted(true);
      setTimeout(() => setIsSubmitted(false), 3000);
      setEmail("");
    }
  };

  return (
    <div className="min-h-screen bg-black text-white relative overflow-hidden">
      {/* Animated background gradient */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,0,0,0.15), transparent 40%)`,
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

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-red-500/30 rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              animationDuration: `${2 + Math.random() * 2}s`,
            }}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8">
        {/* Logo */}
        <div className="mb-8 transform hover:scale-105 transition-transform duration-300">
          <Image
            src="/devildev-logo.png"
            alt="DevilDev Logo"
            width={400}
            height={120}
            className="w-auto h-32 md:h-40 lg:h-48 drop-shadow-2xl"
            priority
          />
        </div>

        {/* Main description */}
        <div className="text-center mb-12 space-y-6">
          <p className="text-lg sm:text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed px-4">
            We're crafting the{" "}
            <span className="text-red-400 font-semibold">
              ultimate development experience
            </span>{" "}
            that will revolutionize how you build and ship applications.
          </p>
        </div>

        {/* Status indicator */}
        <div className="mb-8">
          <div className="flex items-center space-x-3 text-red-400 bg-gray-900/50 px-6 py-3 rounded-full border border-gray-800/50 backdrop-blur-sm">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
            <span className="text-sm font-mono tracking-wider">
              INITIALIZING SYSTEMS
            </span>
            <div
              className="w-2 h-2 bg-red-500 rounded-full animate-ping"
              style={{ animationDelay: "0.5s" }}
            ></div>
          </div>
        </div>

        {/* Email Signup */}
        <div className="w-full max-w-md mb-12">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Input
              type="email"
              placeholder="Enter your email for early access"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500 backdrop-blur-sm h-12"
              required
            />
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-8 h-12 group transition-all duration-300 font-semibold"
              disabled={isSubmitted}
            >
              {isSubmitted ? (
                "Subscribed!"
              ) : (
                <>
                  Notify Me
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>
          <p className="text-xs text-gray-500 mt-3 text-center">
            Be the first to experience pure development power. No spam, just
            wicked updates.
          </p>
        </div>

        {/* Social Links */}
        <div className="flex space-x-4">
          <a
            href="https://github.com/lak7"
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-full bg-gray-900/50 border border-gray-700 hover:border-red-500 hover:bg-red-500/10 transition-all duration-300 group backdrop-blur-sm"
          >
            <Github className="h-5 w-5 text-gray-400 group-hover:text-red-400" />
          </a>
          <a
            href="mailto:lakshaygupta2511@gmail.com?subject=DevilDev%20Coming%20Soon%20-%20Inquiry"
            className="p-4 rounded-full bg-gray-900/50 border border-gray-700 hover:border-red-500 hover:bg-red-500/10 transition-all duration-300 group backdrop-blur-sm"
          >
            <Mail className="h-5 w-5 text-gray-400 group-hover:text-red-400" />
          </a>
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

      {/* Enhanced corner decorations */}
      <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-red-500/40"></div>
      <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-red-500/40"></div>
      <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-red-500/40"></div>
      <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-red-500/40"></div>

      {/* Additional corner accents */}
      <div className="absolute top-8 left-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
      <div className="absolute top-8 right-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
      <div className="absolute bottom-8 left-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
      <div className="absolute bottom-8 right-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
    </div>
  );
}
