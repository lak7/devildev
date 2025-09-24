

"use client";

import { useState } from "react";
import Image from "next/image";
import {
  Calendar,
  LayoutDashboard,
  Activity,
  BarChart3,
  Settings,
  Users,
  CheckSquare,
  Moon,
  Sun,
  ChevronDown,
  SlidersHorizontal,
  User,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Edit, Trash2 } from "lucide-react";

const menuItems = [
  { id: "profile", title: "Profile", icon: User },
  { id: "integrations", title: "Integrations", icon: SlidersHorizontal },
];

function Profile() {
    return (
        <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
            <p className="text-zinc-400">Manage your account settings and preferences</p>
          </div>

          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8">
          <div className="mb-12">
        <div className="mb-6">
          <p className="text-zinc-400">Set your account details</p>
        </div>
  
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-zinc-300">Name</Label>
                <Input
                  id="name"
                  defaultValue="Bartosz"
                  className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus-visible:ring-red-600"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surname" className="text-zinc-300">Surname</Label>
                <Input
                  id="surname"
                  defaultValue="Mcdaniel"
                  className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus-visible:ring-red-600"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">Email</Label>
              <Input
                id="email"
                type="email"
                defaultValue="bartmcdaniel@niceguys.com"
                className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus-visible:ring-red-600"
              />
            </div>
          </div>
  
          <div className="flex flex-col items-center space-y-4">
            <Avatar className="h-24 w-24">
              <AvatarImage src="/favicon.jpg" />
              <AvatarFallback className="bg-muted text-muted-foreground text-lg">BM</AvatarFallback>
            </Avatar>
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-700"
              >
                <Edit className="h-4 w-4 mr-2" />
                Edit photo
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="bg-zinc-900 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white hover:border-zinc-700"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
          </div>
        </div>
      </main>
       
    );
}

function Integrations() {
    return (
        <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto p-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Integrations</h1>
            <p className="text-zinc-400">Manage your account settings and preferences</p>
          </div>

          <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8">
          <div className="mb-12">
        <div className="mb-6">
          <p className="text-zinc-400">Set your account details</p>
        </div>

      </div>
          </div>
        </div>
      </main>
       
    );
}



export default function AppSidebar() {
    const [activeTab, setActiveTab] = useState("profile");
  const [isDark, setIsDark] = useState(true);

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-black text-white">
      <Sidebar className="w-64 border-r border-zinc-800 bg-black">
      <SidebarContent className="p-6 bg-black text-zinc-300">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-3">
          
          <Image
                src="/text01.png"
                alt="DevilDev Logo"
                width={15000}
                height={4000}
                className="h-full w-32 "
                priority
              />
        </div>


        {/* Navigation Menu */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.id}>
                  <SidebarMenuButton
                    onClick={() => setActiveTab(item.id)}
                    isActive={activeTab === item.id}
                    className="group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors text-zinc-300 hover:text-white hover:bg-zinc-900"
                  >
                    <item.icon className="h-5 w-5 text-zinc-500 " />
                    <span className="flex-1">{item.title}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Bottom User Profile */}
      <div className="border-t border-zinc-800 p-4 bg-black text-zinc-300">
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src="/placeholder.svg" />
            <AvatarFallback className="bg-zinc-800 text-white text-xs">BM</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <div className="text-sm font-medium text-white">Bartosz Mcdaniel</div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsDark(!isDark)}
            className="h-8 w-8 p-0 text-white hover:bg-zinc-900"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </div>
      </div>
    </Sidebar>
  
    {activeTab === "profile" ? <Profile /> : <Integrations />}
      </div>
    </SidebarProvider>
  );
}