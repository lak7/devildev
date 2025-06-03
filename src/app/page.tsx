"use client";

import type React from "react";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Github, Twitter, Mail, ArrowRight } from "lucide-react";

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
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(255,0,0,0.1), transparent 40%)`,
        }}
      />

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-20">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
            backgroundSize: "50px 50px",
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4">
        {/* Logo */}
        <div className="mb-8">
          <Image
            src="/devildev-logo.png"
            alt="DevilDev Logo"
            width={400}
            height={120}
            className="w-auto h-24 md:h-32 lg:h-40"
            priority
          />
        </div>

        {/* Coming Soon Text */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4 bg-gradient-to-r from-white via-red-200 to-red-400 bg-clip-text text-transparent">
            Coming Soon
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Something wicked this way comes. We're crafting the ultimate
            development experience that will revolutionize how you build and
            deploy applications.
          </p>
        </div>

        {/* Countdown or Progress Indicator */}
        <div className="mb-12">
          <div className="flex items-center space-x-2 text-red-400">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping"></div>
            <span className="text-sm font-mono">INITIALIZING SYSTEMS...</span>
            <div className="w-2 h-2 bg-red-500 rounded-full animate-ping animation-delay-200"></div>
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
              className="flex-1 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500"
              required
            />
            <Button
              type="submit"
              className="bg-red-600 hover:bg-red-700 text-white px-6 group transition-all duration-300"
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
          <p className="text-xs text-gray-500 mt-2 text-center">
            Be the first to know when we launch. No spam, just pure development
            power.
          </p>
        </div>

        {/* Social Links */}
        {/* <div className="flex space-x-6">
          <a
            href="#"
            className="p-3 rounded-full bg-gray-900/50 border border-gray-700 hover:border-red-500 hover:bg-red-500/10 transition-all duration-300 group"
          >
            <Github className="h-5 w-5 text-gray-400 group-hover:text-red-400" />
          </a>
          <a
            href="#"
            className="p-3 rounded-full bg-gray-900/50 border border-gray-700 hover:border-red-500 hover:bg-red-500/10 transition-all duration-300 group"
          >
            <Twitter className="h-5 w-5 text-gray-400 group-hover:text-red-400" />
          </a>
          <a
            href="#"
            className="p-3 rounded-full bg-gray-900/50 border border-gray-700 hover:border-red-500 hover:bg-red-500/10 transition-all duration-300 group"
          >
            <Mail className="h-5 w-5 text-gray-400 group-hover:text-red-400" />
          </a>
        </div> */}
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

      {/* Corner decorations */}
      <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-red-500/30"></div>
      <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-red-500/30"></div>
      <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-red-500/30"></div>
      <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-red-500/30"></div>
    </div>
  );
}
