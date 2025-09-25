"use client";

import { useState, useEffect, useTransition, useRef } from "react";
import Image from "next/image";
import { useUser } from "@clerk/nextjs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Edit, Trash2, Moon, Sun, SlidersHorizontal, User as UserIcon, Loader2, Github } from "lucide-react";
// import { saveUserProfile, getCurrentUserProfile } from "@/actions/user";
import { saveUserProfile, getCurrentUserProfile } from "../../../actions/user";
import { disconnectGitHubOAuth } from "../../../actions/github";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const menuItems = [
  { id: "profile", title: "Profile", icon: UserIcon },
  { id: "integrations", title: "Integrations", icon: SlidersHorizontal },
];

interface Props {
  userId: string;
}

export default function SettingsClient({ userId }: Props) {
    const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");
  const [isDark, setIsDark] = useState(true);
  const { user } = useUser();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [level, setLevel] = useState("beginner");
  const [preferredIde, setPreferredIde] = useState("vscode");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const hasPrefilledRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [profileLoading, setProfileLoading] = useState(true);
  const [githubOAuthConnected, setGithubOAuthConnected] = useState<boolean | null>(null);
  const [githubAppConnected, setGithubAppConnected] = useState<boolean | null>(null);
  const [isGithubStatusLoading, setIsGithubStatusLoading] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [isDisconnectDialogOpen, setIsDisconnectDialogOpen] = useState(false);
  const [showDisconnectHighlight, setShowDisconnectHighlight] = useState(true);
  const [installationId, setInstallationId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (hasPrefilledRef.current) return;
      try {
        const res = await getCurrentUserProfile();
        if (!cancelled && (res as any)?.success && (res as any).data) {
          const data = (res as any).data as {
            email: string;
            name: string | null;
            username: string | null;
            level: string | null;
            preferredIde: string | null;
          };
          setEmail((prev) => prev || data.email || "");
          setName((prev) => (prev ? prev : (data.name || "")));
          setUsername((prev) => (prev ? prev : (data.username || "")));
          setLevel((prev) => (prev ? prev : (data.level || "beginner").toLowerCase()));
          setPreferredIde((prev) => (prev ? prev : (data.preferredIde || "vscode").toLowerCase()));
          hasPrefilledRef.current = true;
          setProfileLoading(false);
          return;
        }
      } catch (e) {
        // ignore and fallback
      }
      if (!cancelled && user && !hasPrefilledRef.current) {
        setEmail((prev) => prev || user.primaryEmailAddress?.emailAddress || "");
        const publicMeta = (user.publicMetadata || {}) as any;
        setName((prev) => (prev ? prev : ((publicMeta.name as string) || "")));
        setUsername((prev) => (prev ? prev : ((publicMeta.username as string) || "")));
        setLevel((prev) => (prev ? prev : (((publicMeta.level as string) || "beginner").toLowerCase())));
        setPreferredIde((prev) => (prev ? prev : (((publicMeta.preferredIde as string) || "vscode").toLowerCase())));
        hasPrefilledRef.current = true;
        setProfileLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  // Frontend-only demo state for GitHub OAuth connection
  useEffect(() => {
    checkGithubOAuthStatus();
    checkAppInstallation();
  }, []);



  const handleGithubOAuthDisconnect = () => {
    setMessage(null);
    setError(null);
    setIsDisconnecting(true);
    startTransition(async () => {
      const res = await disconnectGitHubOAuth();
      if ((res as any)?.success) {
        setGithubOAuthConnected(false);
        setMessage("GitHub disconnected");
        setIsDisconnectDialogOpen(true);
      } else {
        setError((res as any)?.error || "Failed to disconnect GitHub");
      }
      setIsDisconnecting(false);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);
    setError(null);
    if (!userId) {
      setError("Not authenticated");
      return;
    }
    const formData = new FormData();
    formData.set("name", name);
    formData.set("username", username);
    formData.set("level", level);
    formData.set("preferredIde", preferredIde);
    startTransition(async () => {
      const res = await saveUserProfile(userId, formData);
      if ((res as any)?.error) {
        setError((res as any).error || "Failed to update");
      } else {
        setMessage("Saved");
      }
    });
  };

  const checkAppInstallation = async () => {
    try {
      const res = await fetch('/api/github/app/installations', { cache: 'no-store' });
      const data = await res.json();
      const list = (data?.installations || []) as Array<{ installationId: bigint }>;
      if (list.length > 0) {
        setInstallationId(String(list[0].installationId));
        setGithubAppConnected(true);
      }
    } catch (e) {
      // ignore
    }finally{
      setIsGithubStatusLoading(false);
    }
  };

  const checkGithubOAuthStatus = async () => { 
    setIsGithubStatusLoading(true);
    try {
      const response = await fetch('/api/github/status');
      const data = await response.json();
      setGithubOAuthConnected(data.isConnected); 
      setIsGithubStatusLoading(false);
    } catch (error) {
      console.error('Error checking GitHub status:', error);
    }
  };

  // Inline sections to avoid redefining component types each render (which can remount inputs)

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-black text-white relative">
        {showDisconnectHighlight && activeTab === "integrations" && githubOAuthConnected && (
          <div className="pointer-events-none fixed inset-0 bg-black/60 z-10" />
        )}
        <Sidebar className="w-64 border-r border-zinc-800 bg-black">
          <SidebarContent className="p-6 bg-black text-zinc-300">
            <div className="mb-8 flex items-center gap-3">
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
            </div>
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

          <div className="border-t border-zinc-800 p-4 bg-black text-zinc-300">
            <div className="flex items-center gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user?.imageUrl || "/favicon.jpg"} />
                <AvatarFallback className="bg-zinc-800 text-white text-xs">{(user?.firstName?.[0] || "U") + (user?.lastName?.[0] || "")}</AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="text-sm font-medium text-white">{user?.fullName || user?.username || "User"}</div>
              </div>
            </div>
          </div>
        </Sidebar>

        {activeTab === "profile" ? (
          <main className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Profile</h1>
                <p className="text-zinc-400">Manage your account settings and preferences</p>
              </div>

              {profileLoading ? (
                <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8 flex items-center justify-center h-64">
                  <div className="flex items-center gap-3 text-zinc-300">
                    <Loader2 className="h-5 w-5 animate-spin" />
                    <span>Loading profile...</span>
                  </div>
                </div>
              ) : (
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-8">
                <div className="mb-12">
                  <div className="mb-6">
                    <p className="text-zinc-400">Set your account details</p>
                  </div>

                  <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="username" className="text-zinc-300">Username</Label>
                          <Input
                            id="username"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="unique username"
                            className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus-visible:ring-red-600"
                          />
                          <p className="text-xs text-zinc-500">Must be unique. 3-30 chars, letters/numbers/_ . -</p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="name" className="text-zinc-300">Name</Label>
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus-visible:ring-red-600"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="flex w-full justify-start items-center gap-4">
                            <Label htmlFor="level" className="text-zinc-300">Level</Label>
                          <select
                            id="level"
                            value={level}
                            onChange={(e) => setLevel(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                          >
                            <option value="beginner">Beginner</option>
                            <option value="intermediate">Intermediate</option>
                            <option value="advanced">Advanced</option>
                          </select>
                            </div>
                         
                        </div>
                        <div className="space-y-2">
                            <div className="flex  w-full justify-start items-center gap-4">
                            <Label htmlFor="preferredIde" className="text-zinc-300">Preferred IDE</Label>
                          <select
                            id="preferredIde"
                            value={preferredIde}
                            onChange={(e) => setPreferredIde(e.target.value)}
                            className="bg-zinc-900 border border-zinc-800 text-white rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-red-600"
                          >
                            <option value="cursor">Cursor</option>
                            <option value="vscode">VS Code</option>
                            <option value="windsurf">Windsurf</option>
                            <option value="other">Other</option>
                          </select>
                            </div>
                         
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-zinc-300">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={email}
                          disabled
                          className="bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 cursor-none"
                        />
                        <p className="text-xs text-zinc-500">Email cannot be changed.</p>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button type="submit" disabled={isPending} className="bg-red-600 hover:bg-red-700">
                          {isPending ? "Saving..." : "Save changes"}
                        </Button>
                        {message && <span className="text-green-400 text-sm">{message}</span>}
                        {error && <span className="text-red-400 text-sm">{error}</span>}
                      </div>
                    </div>

                    <div className="flex flex-col items-center space-y-4">
                      <Avatar className="h-24 w-24">
                        <AvatarImage src={user?.imageUrl || "/favicon.jpg"} />
                        <AvatarFallback className="bg-muted text-muted-foreground text-lg">{(user?.firstName?.[0] || "U") + (user?.lastName?.[0] || "")}</AvatarFallback>
                      </Avatar>
                      <div className="flex gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={async (e) => {
                            const inputEl = e.currentTarget;
                            const file = inputEl.files?.[0];
                            // Clear immediately to avoid React synthetic event pooling issues
                            inputEl.value = "";
                            if (!file || !user) return;
                            setError(null);
                            setMessage(null);
                            setAvatarUploading(true);
                            try {
                              await user.setProfileImage({ file });
                              setMessage("Avatar updated");
                            } catch (err) {
                              setError("Failed to update avatar");
                            } finally {
                              setAvatarUploading(false);
                            }
                          }}
                        />
                        <Button
                          type="button"
                          variant="secondary"
                          size="sm"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={avatarUploading}
                          className="bg-zinc-900 border border-zinc-800 text-zinc-300"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          {avatarUploading ? "Uploading..." : "Edit photo"}
                        </Button>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
              )}
            </div>
          </main>
        ) : (
          <main className="flex-1 overflow-auto">
            <div className="max-w-6xl mx-auto p-8">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-white mb-2">Integrations</h1>
                <p className="text-zinc-400">Connect third-party services to enhance your workflow</p>
              </div>

              {/* GitHub App */}
              <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-6 md:p-8 mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div className="flex items-start gap-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/60 border border-zinc-700">
                      <Github className="h-6 w-6 text-zinc-200" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-xl font-semibold text-white">GitHub App</h2>
                        {githubAppConnected ? (
                          <Badge className="bg-emerald-600 hover:bg-emerald-600/90">Installed</Badge>
                        ) : (
                          <Badge variant="secondary" className="bg-zinc-800 text-zinc-200 hover:bg-zinc-800">Not installed</Badge>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-zinc-400 max-w-prose">
                        Install the GitHub App to grant repository access for automated workflows and deeper integration.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                  <Button
              onClick={() => window.location.href = '/api/github/auth'}
              variant="outline"
              className={`border-white/20 text-black cursor-pointer  hover:bg-white/10 hover:border-white/40 hover:text-white ${githubAppConnected ? "" : "bg-green-700 text-white hover:bg-green-700/90 hover:border-green-700/90 hover:text-white"}`}
            >
              {githubAppConnected ? 'Configure GitHub App' : 'Install GitHub App'}
            </Button>
                  </div>
                </div>

                {message && (
                  <div className="mt-6 text-sm text-zinc-300">
                    {message}
                  </div>
                )}
                {error && (
                  <div className="mt-2 text-sm text-red-400">
                    {error}
                  </div>
                )}
              </div>

              {/* GitHub OAuth */}

              <div className={`relative bg-zinc-900 rounded-lg border border-zinc-800 p-6 md:p-8 transition-all ${!githubOAuthConnected ? "opacity-60 grayscale hover:cursor-not-allowed" : ""}`}>
                 <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                   <div className="flex items-start gap-4">
                     <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-zinc-800/60 border border-zinc-700">
                       <Github className="h-6 w-6 text-zinc-200" />
                     </div>
                     <div>
                       <div className="flex items-center gap-3">
                         <h2 className="text-xl font-semibold text-white">GitHub OAuth</h2>
                         {githubOAuthConnected ? (
                           <Badge className="bg-red-600">Deprecated</Badge>
                         ) : (
                           <Badge variant="secondary" className="bg-zinc-800 text-zinc-200 hover:bg-zinc-800">Deprecated</Badge>
                         )}
                       </div>
                       <p className="mt-1 text-sm text-zinc-400 max-w-prose">
                         Authenticate with GitHub to import repositories, manage issues, and streamline your development.
                       </p>
                     </div>
                   </div>
 
                   <div className="flex items-center gap-3 relative">
                    {githubOAuthConnected ? (
                      <>
                        {showDisconnectHighlight && (
                          <svg
                            className="absolute -left-5 -top-4 -rotate-45 md:-left-7 md:-top-7 h-8 w-8 md:h-10 md:w-10 text-white drop-shadow-[0_0_6px_rgba(255,255,255,0.8)] animate-bounce z-20"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                            aria-hidden="true"
                            focusable="false"
                          >
                            <path d="M12 2c.552 0 1 .448 1 1v8.586l2.293-2.293a1 1 0 1 1 1.414 1.414l-4 4a1 1 0 0 1-1.414 0l-4-4A1 1 0 1 1 8.707 9.293L11 11.586V3c0-.552.448-1 1-1z" />
                          </svg>
                        )}
                        <Button
                          onClick={() => { setShowDisconnectHighlight(false); handleGithubOAuthDisconnect(); }}
                          disabled={isDisconnecting}
                          className={`bg-red-600 hover:bg-red-700 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed ${showDisconnectHighlight ? "relative z-20" : ""}`}
                        >
                        {isDisconnecting ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Disconnecting...
                          </span>
                        ) : (
                          "Disconnect"
                        )}
                        </Button>
                      </>
                    ) : (
                       <Button className="bg-red-600 text-white  opacity-50 cursor-not-allowed">Connect GitHub</Button>
                     )}
                   </div>
                 </div>
                 {error && (
                   <div className="mt-2 text-sm text-red-400">
                     {error}
                   </div>
                 )}
               </div>

             
            </div>
          </main>
        )}
      </div>
      {/* Success dialog for GitHub OAuth disconnect */}
      <Dialog open={isDisconnectDialogOpen} onOpenChange={setIsDisconnectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnected successfully</DialogTitle>
            <DialogDescription>
              Your GitHub OAuth account has been disconnected.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setIsDisconnectDialogOpen(false)} className="bg-white text-black hover:bg-zinc-200">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}


