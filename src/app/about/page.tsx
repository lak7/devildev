"use client";

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Github, Twitter, Linkedin, Code, Zap, Heart, Users, Target, Lightbulb } from 'lucide-react';
import Noise from '@/components/Noise/Noise';

interface Particle {
  id: number;
  left: string;
  top: string;
  animationDelay: string;
  animationDuration: string;
}

const AboutPage = () => {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    const handleMouseMove = (e: globalThis.MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  useEffect(() => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < 50; i++) {
      newParticles.push({
        id: i,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 20}s`,
        animationDuration: `${20 + Math.random() * 20}s`
      });
    }
    setParticles(newParticles);
  }, []);

  const teamMembers = [
    {
      name: "Alex Chen",
      role: "Founder & CEO",
      image: "/hero-devil.png",
      bio: "Full-stack engineer with 8+ years of experience building scalable applications.",
      social: { github: "#", twitter: "#", linkedin: "#" }
    },
    {
      name: "Sarah Johnson",
      role: "Lead Designer",
      image: "/hero-devil.png",
      bio: "UI/UX designer passionate about creating beautiful and intuitive user experiences.",
      social: { github: "#", twitter: "#", linkedin: "#" }
    },
    {
      name: "Mike Rodriguez",
      role: "Backend Engineer",
      image: "/hero-devil.png",
      bio: "Systems architect specializing in distributed systems and cloud infrastructure.",
      social: { github: "#", twitter: "#", linkedin: "#" }
    }
  ];

  const values = [
    {
      icon: <Code className="w-8 h-8" />,
      title: "Innovation",
      description: "We push the boundaries of what's possible with cutting-edge technology and creative solutions."
    },
    {
      icon: <Zap className="w-8 h-8" />,
      title: "Performance",
      description: "Every line of code is optimized for speed, efficiency, and exceptional user experience."
    },
    {
      icon: <Heart className="w-8 h-8" />,
      title: "Passion",
      description: "We love what we do and it shows in every project we deliver to our clients."
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: "Collaboration",
      description: "Great software is built by great teams working together towards a common goal."
    },
    {
      icon: <Target className="w-8 h-8" />,
      title: "Precision",
      description: "Attention to detail and meticulous planning ensure we hit every target."
    },
    {
      icon: <Lightbulb className="w-8 h-8" />,
      title: "Creativity",
      description: "We think outside the box to solve complex problems with elegant solutions."
    }
  ];

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden relative">
      <Noise />
      
      {/* Animated background particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-red-500/20 rounded-full animate-pulse"
            style={{
              left: particle.left,
              top: particle.top,
              animationDelay: particle.animationDelay,
              animationDuration: particle.animationDuration,
            }}
          />
        ))}
      </div>

      {/* Cursor glow effect */}
      <div 
        className="fixed pointer-events-none z-50 w-96 h-96 rounded-full opacity-10"
        style={{
          background: `radial-gradient(circle, rgba(239, 68, 68, 0.4) 0%, transparent 70%)`,
          left: mousePosition.x - 192,
          top: mousePosition.y - 192,
          transition: 'all 0.1s ease-out'
        }}
      />

      <div className="relative z-10">
        {/* Header */}
        <header className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 via-black to-red-900/20" />
          <div className="relative max-w-7xl mx-auto px-6 py-20 text-center">
            <div className="flex justify-center mb-8">
              <Image
                src="/devildev-logo.png"
                alt="DevilDev Logo"
                width={120}
                height={120}
                className="rounded-full border-2 border-red-500/50 shadow-lg shadow-red-500/25"
              />
            </div>
            <h1 className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-white via-red-100 to-red-200 bg-clip-text text-transparent">
              About DevilDev
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
              We are the <span className="text-red-400 font-semibold">first engineers</span> who transform 
              visionary ideas into reality through cutting-edge technology and relentless innovation.
            </p>
          </div>
        </header>

        {/* Mission Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="grid md:grid-cols-2 gap-16 items-center">
              <div>
                <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
                  Our <span className="text-red-400">Mission</span>
                </h2>
                <p className="text-lg text-gray-300 mb-6 leading-relaxed">
                  At DevilDev, we believe that exceptional software is born from the perfect blend of 
                  technical expertise, creative vision, and unwavering dedication. We don't just write code; 
                  we craft digital experiences that push boundaries and exceed expectations.
                </p>
                <p className="text-lg text-gray-300 leading-relaxed">
                  Our mission is to be the catalyst that transforms ambitious ideas into industry-leading 
                  products, helping businesses and individuals achieve their most audacious goals through 
                  the power of technology.
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 to-orange-500/20 rounded-3xl blur-xl" />
                <div className="relative bg-gray-900/50 backdrop-blur-sm border border-gray-800 rounded-3xl p-8">
                  <h3 className="text-2xl font-bold mb-4 text-red-400">What Sets Us Apart</h3>
                  <ul className="space-y-4 text-gray-300">
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      <span>10+ years of combined engineering experience</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      <span>Full-stack expertise across modern technologies</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      <span>Agile development with rapid prototyping</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                      <span>24/7 support and maintenance</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values Section */}
        <section className="py-20 px-6 bg-gradient-to-b from-black to-gray-900/50">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-white">
              Our <span className="text-red-400">Values</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {values.map((value, index) => (
                <div 
                  key={index}
                  className="group relative bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-red-500/50 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative">
                    <div className="text-red-400 mb-4 group-hover:scale-110 transition-transform duration-300">
                      {value.icon}
                    </div>
                    <h3 className="text-xl font-bold mb-3 text-white">{value.title}</h3>
                    <p className="text-gray-300 leading-relaxed">{value.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="py-20 px-6">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-white">
              Meet Our <span className="text-red-400">Team</span>
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {teamMembers.map((member, index) => (
                <div 
                  key={index}
                  className="group relative bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-2xl p-8 hover:border-red-500/50 transition-all duration-300"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="relative text-center">
                    <div className="relative w-24 h-24 mx-auto mb-6">
                      <Image
                        src={member.image}
                        alt={member.name}
                        fill
                        className="rounded-full object-cover border-2 border-red-500/50 group-hover:border-red-400 transition-colors duration-300"
                      />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-white">{member.name}</h3>
                    <p className="text-red-400 font-medium mb-4">{member.role}</p>
                    <p className="text-gray-300 text-sm leading-relaxed mb-6">{member.bio}</p>
                    <div className="flex justify-center gap-4">
                      <a href={member.social.github} className="text-gray-400 hover:text-red-400 transition-colors">
                        <Github className="w-5 h-5" />
                      </a>
                      <a href={member.social.twitter} className="text-gray-400 hover:text-red-400 transition-colors">
                        <Twitter className="w-5 h-5" />
                      </a>
                      <a href={member.social.linkedin} className="text-gray-400 hover:text-red-400 transition-colors">
                        <Linkedin className="w-5 h-5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 bg-gradient-to-r from-red-900/20 via-black to-red-900/20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-4xl md:text-5xl font-bold mb-8 text-white">
              Ready to Build Something <span className="text-red-400">Amazing</span>?
            </h2>
            <p className="text-xl text-gray-300 mb-12 leading-relaxed">
              Let's turn your vision into reality. Our team is ready to tackle your most ambitious projects.
            </p>
            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              <a 
                href="/contact"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-xl transition-colors duration-300 shadow-lg shadow-red-600/25"
              >
                Get In Touch
              </a>
              <a 
                href="/dev"
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-4 border border-red-500 text-red-400 hover:bg-red-500/10 font-semibold rounded-xl transition-colors duration-300"
              >
                View Our Work
              </a>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-6 border-t border-gray-800">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex justify-center mb-6">
              <Image
                src="/devildev-logo.png"
                alt="DevilDev Logo"
                width={60}
                height={60}
                className="rounded-full"
              />
            </div>
            <p className="text-gray-400 mb-4">
              © 2024 DevilDev. All rights reserved.
            </p>
            <p className="text-gray-500 text-sm">
              Crafted with ❤️ by the DevilDev team
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default AboutPage;