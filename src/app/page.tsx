"use client";

import type React from "react";

import { useState, useEffect, MouseEvent } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { joinWaitlist } from "../../actions/user";
import {
  Github,
  Twitter,
  Mail,
  ArrowRight,
  Code2,
  Zap,
  Sparkles,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
} from "lucide-react";

// Success Dialog Component
const SuccessDialog = ({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/10 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative bg-black/90 border border-gray-700/50 rounded-3xl p-8 max-w-sm w-full shadow-2xl backdrop-blur-xl ring-1 ring-white/10">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200 hover:bg-gray-800/50 rounded-full p-1"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Content */}
        <div className="space-y-2">
          {/* Header */}
          <h2 className="text-2xl font-bold text-white text-left">
            Thank You!
          </h2>

          {/* Message */}
          <p className="text-sm text-gray-300 leading-relaxed text-left">
            You've been added to our waitlist. We'll notify you when we launch!
          </p>

          {/* Hell Satan GIF */}
          <div className="flex justify-center pt-5">
            <div className="rounded-xl overflow-hidden shadow-lg ring-1 ring-white/20">
              <Image
                src="/hell-satan.gif"
                alt="Hell Satan"
                width={200}
                height={200}
                className="w-full h-auto"
                unoptimized
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ComingSoonPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [alreadyJoined, setAlreadyJoined] = useState(false);
  const [error, setError] = useState("");
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  // Check localStorage on component mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("devildev-waitlist-email");
    if (savedEmail) {
      setAlreadyJoined(true);
      setEmail(savedEmail);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    // If already joined, show success dialog
    if (alreadyJoined) {
      setShowSuccessDialog(true);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const result = await joinWaitlist(email.trim());

      if (result.success) {
        // Store email in localStorage
        localStorage.setItem("devildev-waitlist-email", email.trim());
        setAlreadyJoined(true);
        setShowSuccessDialog(true);
      } else if (result.error) {
        if (result.error === "Email already in waitlist") {
          // If email already exists in DB, store it in localStorage too
          localStorage.setItem("devildev-waitlist-email", email.trim());
          setAlreadyJoined(true);
          setShowSuccessDialog(true);
        } else {
          setError(result.error);
        }
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
      console.error("Error submitting waitlist:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCloseDialog = () => {
    setShowSuccessDialog(false);
  };

  const getButtonText = () => {
    if (isSubmitting) return "Joining...";
    if (alreadyJoined) return "Already Joined!";
    return "Join Waitlist";
  };

  const getButtonIcon = () => {
    if (isSubmitting) return <Loader2 className="ml-2 h-4 w-4 animate-spin" />;
    return (
      <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
    );
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

      {/* Navbar */}
      <nav className="relative z-10 border-b border-white/10 backdrop-blur-md bg-black/20">
        <div className="max-w-7xl mx-auto px-6 py-2">
          <div className="flex items-center justify-between">
            {/* Logo and Navigation Items */}
            <div className="flex items-center space-x-8">
              <Image
                src="/textlogo.png"
                alt="DevilDev Logo"
                width={150}
                height={45}
                className="w-auto h-10 drop-shadow-lg"
                priority
              />
              
              {/* Navigation Items */}
              <div className="hidden md:flex items-center space-x-6">
                <a
                  href="#features"
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-300 font-medium relative group"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Features</span>
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></span>
                </a>
                <a
                  href="/devlogs"
                  className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors duration-300 font-medium relative group"
                >
                  <Code2 className="h-4 w-4" />
                  <span>Devlogs</span>
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-red-500 transition-all duration-300 group-hover:w-full"></span>
                </a>
              </div>
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button className="text-gray-300 hover:text-white transition-colors duration-300">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <div className="relative z-10 flex items-center justify-center min-h-[calc(100vh-120px)] px-6 mt-10">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="space-y-8">
            {/* Headline */}
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white leading-tight">
              Build Like a Pro.{" "}
              <span className="text-red-400">Without Being One.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-gray-300 leading-relaxed max-w-2xl">
              Devildev is your AI coding companion that turns your idea into a full-blown tech architecture, real-time dev assistant, and detailed code prompts — all in one go.
            </p>

            {/* Email Signup */}
            <div className="max-w-md">
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row gap-3"
              >
                <Input
                  type="email"
                  placeholder={
                    alreadyJoined
                      ? "Already joined waitlist!"
                      : "Enter your email for early access"
                  }
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 bg-gray-900/50 border-gray-700 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500 backdrop-blur-sm min-h-[48px] py-3 px-4 text-base sm:text-sm"
                  required
                  disabled={alreadyJoined}
                />
                <Button
                  type="submit"
                  className={`px-8 h-12 group transition-all duration-300 font-semibold bg-red-600 hover:bg-red-700 text-white`}
                  disabled={isSubmitting}
                >
                  {getButtonText()}
                  {getButtonIcon()}
                </Button>
              </form>

              {/* Error message */}
              {error && (
                <div className="mt-3 flex items-center gap-2 text-red-400 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              <p className="text-xs text-gray-500 mt-3">
                Be the first to experience pure development power. Get early access to Devildev.
              </p>
            </div>

            {/* Social Links */}
            <div className="flex space-x-4">
              <a
                href="/devlogs"
                className="p-4 rounded-full bg-gray-900/50 border border-gray-700 hover:border-red-500 hover:bg-red-500/10 transition-all duration-300 group backdrop-blur-sm"
                title="Dev Logs"
              >
                <Code2 className="h-5 w-5 text-gray-400 group-hover:text-red-400" />
              </a>
              {/* <a
                href="https://github.com/lak7"
                target="_blank"
                rel="noopener noreferrer"
                className="p-4 rounded-full bg-gray-900/50 border border-gray-700 hover:border-red-500 hover:bg-red-500/10 transition-all duration-300 group backdrop-blur-sm"
              >
                <Github className="h-5 w-5 text-gray-400 group-hover:text-red-400" />
              </a> */}
              <a
                href="mailto:contact@devildev.com?subject=DevilDev%20Coming%20Soon%20-%20Inquiry"
                className="p-4 rounded-full bg-gray-900/50 border border-gray-700 hover:border-red-500 hover:bg-red-500/10 transition-all duration-300 group backdrop-blur-sm"
              >
                <Mail className="h-5 w-5 text-gray-400 group-hover:text-red-400" />
              </a>
            </div>
          </div>

          {/* Right Column - Hero Image */}
          <div className="flex justify-center lg:justify-end">
            <div className="relative p-8">
              <Image
                src="/hero-devil.png"
                alt="Hero Devil"
                width={600}
                height={600}
                className="w-full max-w-lg h-auto drop-shadow-2xl"
                priority
              />
              
              {/* Corner accents outside hero image */}
              <div className="absolute -top-4 -left-4 w-8 h-8 border-l-2 border-t-2 border-red-500/40"></div>
              <div className="absolute -top-4 -right-4 w-8 h-8 border-r-2 border-t-2 border-red-500/40"></div>
              <div className="absolute -bottom-4 -left-4 w-8 h-8 border-l-2 border-b-2 border-red-500/40"></div>
              <div className="absolute -bottom-4 -right-4 w-8 h-8 border-r-2 border-b-2 border-red-500/40"></div>
              
              {/* Corner accent dots outside hero image */}
              <div className="absolute -top-2 -left-2 w-1.5 h-1.5 bg-red-500/60 rounded-full"></div>
              <div className="absolute -top-2 -right-2 w-1.5 h-1.5 bg-red-500/60 rounded-full"></div>
              <div className="absolute -bottom-2 -left-2 w-1.5 h-1.5 bg-red-500/60 rounded-full"></div>
              <div className="absolute -bottom-2 -right-2 w-1.5 h-1.5 bg-red-500/60 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500 to-transparent"></div>

      {/* Enhanced corner decorations */}
      {/* <div className="absolute top-4 left-4 w-12 h-12 border-l-2 border-t-2 border-red-500/40"></div>
      <div className="absolute top-4 right-4 w-12 h-12 border-r-2 border-t-2 border-red-500/40"></div>
      <div className="absolute bottom-4 left-4 w-12 h-12 border-l-2 border-b-2 border-red-500/40"></div>
      <div className="absolute bottom-4 right-4 w-12 h-12 border-r-2 border-b-2 border-red-500/40"></div> */}

      {/* Additional corner accents */}
      {/* <div className="absolute top-8 left-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
      <div className="absolute top-8 right-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
      <div className="absolute bottom-8 left-8 w-2 h-2 bg-red-500/60 rounded-full"></div>
      <div className="absolute bottom-8 right-8 w-2 h-2 bg-red-500/60 rounded-full"></div> */}

      {/* Success Dialog */}
      <SuccessDialog isOpen={showSuccessDialog} onClose={handleCloseDialog} />
    </div>
  );
}
