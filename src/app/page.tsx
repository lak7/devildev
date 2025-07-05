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
  Globe,
  Ban,
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
                  className="flex-1 bg-gray-900/50 border-gray-300 text-white placeholder-gray-400 focus:border-red-500 focus:ring-red-500 backdrop-blur-sm min-h-[48px] py-3 px-4 text-base sm:text-sm"
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

      {/* Features */}
      <section className="relative bg-black py-24 px-6 overflow-hidden">
      {/* Background Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="flex space-x-8 text-8xl md:text-9xl lg:text-[12rem] font-bold text-white/5 tracking-wider">
          <span>IDEA</span>
          <span>GUIDE</span>
          <span>CODE</span>
        </div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Heading */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
            Core Features
          </h2>
        </div>
        
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {/* Fee-less transactions */}
          <div className="bg-red-950/20 backdrop-blur-sm border border-red-500/20 rounded-2xl p-8 text-center md:text-left shadow-lg shadow-red-500/10">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
              <Ban className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              Idea to
              <br />
              Architecture
            </h3>
            <p className="text-gray-300 text-base lg:text-lg leading-relaxed">
              Input an idea → Get detailed tech stack, architecture diagram, and execution phases.
            </p>
          </div>

          {/* Lightning-fast trades */}
          <div className="bg-red-950/20 backdrop-blur-sm border border-red-500/20 rounded-2xl p-8 text-center md:text-left shadow-lg shadow-red-500/10">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              Real-Time Screen
              <br />
              Companion
            </h3>
            <p className="text-gray-300 text-base lg:text-lg leading-relaxed">
              Share your screen with devildev. It watches and guides you like a senior engineer.
            </p>
          </div>

          {/* Global market */}
          <div className="bg-red-950/20 backdrop-blur-sm border border-red-500/20 rounded-2xl p-8 text-center md:text-left shadow-lg shadow-red-500/10">
            <div className="inline-flex items-center justify-center w-16 h-16 mb-6 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg">
              <Globe className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-2xl lg:text-3xl font-bold text-white mb-4">
              Vibecoding-Optimized
              <br />
              Prompts
            </h3>
            <p className="text-gray-300 text-base lg:text-lg leading-relaxed">
              Get high-quality coding prompts to integrate APIs, DBs, auth, UI libs in one go.
            </p>
          </div>
        </div>
      </div>
    </section>

      {/* Footer */}
      <footer className="relative bg-black border-t border-gray-800/50 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12">
            {/* Company Info */}
            <div className="md:col-span-2 space-y-4">
              <Image
                src="/textlogo.png"
                alt="DevilDev Logo"
                width={150}
                height={45}
                className="w-auto h-10 drop-shadow-lg"
              />
              <p className="text-gray-400 text-base leading-relaxed max-w-md">
                Your AI coding companion that turns ideas into full-blown tech architecture, 
                real-time dev assistance, and detailed code prompts.
              </p>
              <div className="flex space-x-4">
                <a
                  href="/devlogs"
                  className="p-3 rounded-full bg-gray-900/50 border border-gray-700 hover:border-red-500 hover:bg-red-500/10 transition-all duration-300 group backdrop-blur-sm"
                  title="Dev Logs"
                >
                  <Code2 className="h-5 w-5 text-gray-400 group-hover:text-red-400" />
                </a>
                <a
                  href="mailto:contact@devildev.com"
                  className="p-3 rounded-full bg-gray-900/50 border border-gray-700 hover:border-red-500 hover:bg-red-500/10 transition-all duration-300 group backdrop-blur-sm"
                  title="Contact"
                >
                  <Mail className="h-5 w-5 text-gray-400 group-hover:text-red-400" />
                </a>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h4 className="text-white font-semibold text-lg">Quick Links</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="#features"
                    className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center space-x-2"
                  >
                    <Sparkles className="h-4 w-4" />
                    <span>Features</span>
                  </a>
                </li>
                <li>
                  <a
                    href="/devlogs"
                    className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center space-x-2"
                  >
                    <Code2 className="h-4 w-4" />
                    <span>Devlogs</span>
                  </a>
                </li>
              </ul>
            </div>

            {/* Contact */}
            <div className="space-y-4">
              <h4 className="text-white font-semibold text-lg">Contact</h4>
              <ul className="space-y-3">
                <li>
                  <a
                    href="mailto:contact@devildev.com"
                    className="text-gray-400 hover:text-white transition-colors duration-300 flex items-center space-x-2"
                  >
                    <Mail className="h-4 w-4" />
                    <span>contact@devildev.com</span>
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-12 pt-8 border-t border-gray-800/50">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-gray-500 text-sm">
                © 2025 <span className="text-red-400">DevilDev</span>. All rights reserved.
              </p>
              <p className="text-gray-500 text-sm">
                Built with <span className="text-red-400">❤️</span> by the <span className="text-red-400">DevilDev</span> team
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Success Dialog */}
      <SuccessDialog isOpen={showSuccessDialog} onClose={handleCloseDialog} />
    </div>
  );
}
