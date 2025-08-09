"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GlowingEffect } from "@/components/ui/glow-effect"
import { getGitHubStatus, initiateGitHubConnection, type GitHubStatus } from "../../../actions/github"
import Image from "next/image"

export default function ConnectMCPPage() {
  const { isSignedIn } = useUser()
  const [githubStatus, setGithubStatus] = useState<GitHubStatus>({ isConnected: false })
  const [githubLoading, setGithubLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(true)
  const [copied, setCopied] = useState(false)

  // Function to fetch GitHub status
  const fetchGithubStatus = async () => {
    if (!isSignedIn) return;
    
    try {
      const result = await getGitHubStatus();
      if (result.success && result.data) {
        setGithubStatus(result.data);
      } else {
        console.error('Failed to fetch GitHub status:', result.error);
        // Set default status if fetch fails
        setGithubStatus({ isConnected: false });
      }
    } catch (error) {
      console.error('Error fetching GitHub status:', error);
      // Set default status if there's an exception
      setGithubStatus({ isConnected: false });
    } finally {
      setStatusLoading(false);
    }
  };

  // Function to handle GitHub connection
  const handleGithubConnect = async () => {
    setGithubLoading(true);
    try {
      const result = await initiateGitHubConnection();
      if (result.success && result.redirectUrl) {
        window.location.href = result.redirectUrl;
      } else {
        console.error('Failed to initiate GitHub connection:', result.error);
        alert('Failed to connect GitHub. Please try again.');
        setGithubLoading(false);
      }
    } catch (error) {
      console.error('Error connecting GitHub:', error);
      alert('Failed to connect GitHub. Please try again.');
      setGithubLoading(false);
    }
  };

  useEffect(() => {
    if (isSignedIn) {
      fetchGithubStatus();
    }
    // Keep loading until signed in and GitHub status is fetched
  }, [isSignedIn]);



  // Show loading state until GitHub details are fully fetched
  if (statusLoading) {
    return (
      <div className="h-dvh overflow-hidden bg-black text-white p-4 sm:p-6 lg:p-8 xl:p-12">
        <div className="w-full max-w-7xl mx-auto flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-4"></div>
            <p className="text-gray-400">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show GitHub connection required page if not connected
  if (!githubStatus.isConnected) {
    return (
      <div className="h-dvh overflow-hidden bg-black text-white p-4 sm:p-6 lg:p-8 xl:p-12">
        <div className="w-full max-w-4xl mx-auto flex items-center justify-center h-full">
          <Card className="relative bg-neutral-950 border border-white/20 lg:border-white/69 text-white rounded-xl lg:rounded-2xl shadow-2xl w-full max-w-2xl">
            <GlowingEffect disabled={false} spread={35} proximity={100}
              inactiveZone={0.01} glow={true} className="rounded-xl lg:rounded-2xl" />
            <CardHeader className="p-6 sm:p-8 lg:p-10 text-center border-b border-white/5">
              <CardTitle className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-3">
                GitHub Connection Required
              </CardTitle>
              <CardDescription className="text-gray-400 text-base sm:text-lg">
                You need to connect your GitHub account to access MCP integration features
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 sm:p-8 lg:p-10 space-y-6 text-center">
   

              <Button
                onClick={handleGithubConnect}
                disabled={githubLoading}
                className="relative w-full h-12 bg-white text-black hover:bg-gray-100 transition-all duration-200 font-semibold text-base rounded-lg"
              >
                <GlowingEffect disabled={githubLoading} spread={35} proximity={69}
                  inactiveZone={0.01} glow={true} className="rounded-lg" />
                {githubLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-black mr-2"></div>
                    Connecting...
                  </div>
                ) : (
                  "Connect GitHub Account"
                )}
              </Button>

              <p className="text-xs text-gray-500 mt-4">
                Your GitHub data is secure and only used for development workflow integration
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Show MCP connection instructions if GitHub is connected
  return (
    <div className="h-dvh overflow-hidden bg-black text-white p-4 sm:p-6 lg:p-8 xl:p-12">
      <div className="w-full max-w-7xl mx-auto">
        <Tabs defaultValue="claude-code" className="w-full">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 h-full">
            {/* Left side - Header and Tabs */}
            <div className="w-full lg:w-[40%] flex flex-col h-auto lg:h-[calc(100vh-5rem)]">
              <div className="text-center lg:text-left mb-8 lg:mb-16 mt-4 lg:mt-16">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-3 lg:mb-4">
                  Connect to MCP
                </h1>
                <p className="text-gray-400 text-base sm:text-lg max-w-md mx-auto lg:mx-0">
                  Choose your preferred development environment and follow the setup instructions to integrate with MCP
                </p>
              </div>

              <TabsList className="flex flex-row lg:flex-col w-full justify-stretch items-stretch gap-3 lg:gap-4 bg-transparent h-auto lg:h-36">
                <TabsTrigger
                  value="claude-code"
                  className="relative flex-1 lg:aspect-square h-16 lg:h-32 rounded-lg border transition-all duration-200 flex items-center justify-center
                             border-gray-500 bg-black text-gray-400 hover:border-gray-300 hover:text-gray-300
                             data-[state=active]:border-white data-[state=active]:bg-white/69 data-[state=active]:text-black
                             focus:outline-none focus:ring-offset-black text-sm sm:text-base lg:text-3xl font-semibold"
                >
                  <GlowingEffect disabled={false} spread={35} proximity={69}
                    inactiveZone={0.01} glow={true} className="rounded-lg" />
                  Claude Code
                </TabsTrigger>
                <TabsTrigger
                  value="cursor"
                  className="relative flex-1 lg:aspect-square h-16 lg:h-32 rounded-lg border transition-all duration-200 flex items-center justify-center
                             border-gray-500 bg-black text-gray-400 hover:border-gray-300 hover:text-gray-300
                             data-[state=active]:border-white data-[state=active]:bg-white/69 data-[state=active]:text-black
                             focus:outline-none focus:ring-offset-black text-sm sm:text-base lg:text-3xl font-semibold"
                >
                  <GlowingEffect disabled={false} spread={35} proximity={69}
                    inactiveZone={0.01} glow={true} className="rounded-lg" />
                  Cursor
                </TabsTrigger>
                <TabsTrigger
                  value="windsurf"
                  className="relative flex-1 lg:aspect-square h-16 lg:h-32 rounded-lg border transition-all duration-200 flex items-center justify-center
                             border-gray-500 bg-black text-gray-400 hover:border-gray-300 hover:text-gray-300
                             data-[state=active]:border-white data-[state=active]:bg-white/69 data-[state=active]:text-black
                             focus:outline-none focus:ring-offset-black text-sm sm:text-base lg:text-3xl font-semibold"
                >
                  <GlowingEffect disabled={false} spread={35} proximity={69}
                    inactiveZone={0.01} glow={true} className="rounded-lg" />
                  Windsurf
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Right side - Content */}
            <div className="w-full lg:w-[60%] h-auto lg:h-[calc(100vh-5rem)]">
              <TabsContent value="claude-code" className="mt-4 lg:mt-0 h-auto lg:h-full">
                <Card className="relative bg-neutral-950 border border-white/20 lg:border-white/69 text-white rounded-xl lg:rounded-2xl shadow-2xl h-auto lg:h-full flex flex-col">
                  <GlowingEffect disabled={false} spread={35} proximity={100}
                    inactiveZone={0.01} glow={true} className="rounded-xl lg:rounded-2xl" />
                  <CardHeader className="p-4 sm:p-6 lg:p-6 border-b border-white/5 flex-shrink-0">
                    <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">Claude Code Connection Instructions</CardTitle>
                    <CardDescription className="text-gray-500 mt-1 lg:mt-2 text-sm sm:text-base">
                      Steps to configure your environment for Claude Code.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 lg:p-6 space-y-4 lg:space-y-6 text-gray-300 overflow-y-auto flex-1 max-h-[60vh] lg:max-h-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-500">
                <p>To connect to MCP using Claude Code, follow these detailed steps:</p>
                <ol className="list-decimal list-inside space-y-4">
                  <li>
                    <strong>Run this command to add Devilev MCP to claude code:</strong>
                    <div className="relative">
                      <pre className="bg-neutral-800 p-6 rounded-lg mt-3 text-sm border border-white/5 min-h-[80px] flex items-center whitespace-pre-wrap break-words">
                        <code className="text-green-400">claude mcp add --transport http DevilDev{'\n'}https://devildev-mcp-server.laks.workers.dev/mcp</code>
                      </pre>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText('claude mcp add --transport http DevilDev https://devildev-mcp-server.laks.workers.dev/mcp');
                          setCopied(true);
                          setTimeout(() => setCopied(false), 1000);
                        }}
                        className="absolute top-5 right-3 p-2 bg-neutral-700 hover:bg-neutral-600 rounded-md transition-colors duration-200 border border-white/10 hover:border-white/20"
                        title={copied ? "Copied!" : "Copy to clipboard"}
                      >
                        {copied ? (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-green-400"
                          >
                            <path d="M20 6 9 17l-5-5"/>
                          </svg>
                        ) : (
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className="text-gray-400 hover:text-white"
                          >
                            <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
                            <path d="m4 16-2-2v-8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2"/>
                          </svg>
                        )}
                      </button>
                    </div>
                  </li>
                </ol>
              </CardContent>
            </Card>
          </TabsContent>

              <TabsContent value="cursor" className="mt-4 lg:mt-0 h-auto lg:h-full">
                <Card className="relative bg-neutral-950 border border-white/20 lg:border-white/69 text-white rounded-xl lg:rounded-2xl shadow-2xl h-auto lg:h-full flex flex-col">
                  <GlowingEffect disabled={false} spread={35} proximity={100}
                    inactiveZone={0.01} glow={true} className="rounded-xl lg:rounded-2xl" />
                  <CardHeader className="p-4 sm:p-6 lg:p-6 border-b border-white/5 flex-shrink-0">
                    <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">Cursor Connection Instructions</CardTitle>
                    <CardDescription className="text-gray-500 mt-1 lg:mt-2 text-sm sm:text-base">
                      Guide to setting up Cursor for MCP integration.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 lg:p-6 space-y-4 lg:space-y-6 text-gray-300 overflow-y-auto flex-1 max-h-[60vh] lg:max-h-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-500">
                    <p>Connecting Cursor to MCP enhances your development workflow. Here's how:</p>
                    <ol className="list-decimal list-inside space-y-4">
                      <li>
                        <strong>Open Cursor Settings:</strong>
                        <p>
                          Launch Cursor and go to{" "}
                          <code className="text-yellow-400">Settings &gt; Cursor Settings &gt; Tools {"&"} Integrations</code>
                        </p>
                      </li>
                      <li>
                        <strong>Navigate to MCP Tools Section:</strong>
                        <p>Click Add a Custom MCP Server.</p>
                      </li>
                      <li>
                        <strong>Configure devildev MCP server in mcp.json file and paste this:</strong>
                        <pre className="bg-neutral-800 p-4 rounded-lg mt-3 text-sm overflow-x-auto border border-white/5">
                      <code className="text-green-400">{`{
    "mcpServers": {
      "DevilDev-mcp-server": {
        "url": "https://devildev-mcp-server.laks.workers.dev/mcp"
      }
    }
  }`}</code>
                    </pre>
                      </li>
                      <li>
                        <strong>Click Needs Login in MCP Tools section:</strong>
                        <Image src="/cursor-login.png" alt="Cursor MCP Login" width={1000} height={1000} />
                      </li>
                    </ol>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="windsurf" className="mt-4 lg:mt-0 h-auto lg:h-full">
                <Card className="relative bg-neutral-950 border border-white/20 lg:border-white/69 text-white rounded-xl lg:rounded-2xl shadow-2xl h-auto lg:h-full flex flex-col">
                  <GlowingEffect disabled={false} spread={35} proximity={100}
                    inactiveZone={0.01} glow={true} className="rounded-xl lg:rounded-2xl" />
                  <CardHeader className="p-4 sm:p-6 lg:p-6 border-b border-white/5 flex-shrink-0">
                    <CardTitle className="text-xl sm:text-2xl lg:text-3xl font-bold">Windsurf Connection Instructions</CardTitle>
                    <CardDescription className="text-gray-500 mt-1 lg:mt-2 text-sm sm:text-base">
                      How to establish a connection to MCP using Windsurf.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 lg:p-6 space-y-4 lg:space-y-6 text-gray-300 overflow-y-auto flex-1 max-h-[60vh] lg:max-h-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-500">
  <p>Connecting Windsurf to MCP servers expands your development workflow with external tools and data sources. Here's how to add DevilDev MCP server:</p>
  <ol className="list-decimal list-inside space-y-4">
    <li>
      <strong>Open Windsurf Settings:</strong>
      <p>
        Launch Windsurf and navigate to{" "}
        <code className="text-yellow-400">Settings → Cascade → Plugins</code>
      </p>
    </li>
    <li>
      <strong>Access MCP Configuration:</strong>
      <p>Click on <strong>Manage Plugins</strong>, then select <strong>View Raw Config</strong> to edit the mcp_config.json file.</p>
    </li>
    <li>
      <strong>Add DevilDev MCP server configuration:</strong>
      <div className="relative">
        <pre className="bg-neutral-800 p-6 rounded-lg mt-3 text-sm border border-white/5 min-h-[120px] flex items-center whitespace-pre-wrap break-words">
          <code className="text-green-400">{`{
  "mcpServers": {
    "DevilDev-mcp-server": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://devildev-mcp-server.laks.workers.dev/mcp"
      ]
    }
  }
}`}</code>
        </pre>
        <button
          onClick={() => {
            navigator.clipboard.writeText(`{
  "mcpServers": {
    "DevilDev-mcp-server": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://devildev-mcp-server.laks.workers.dev/mcp"
      ]
    }
  }
}`);
            setCopied(true);
            setTimeout(() => setCopied(false), 1000);
          }}
          className="absolute top-5 right-3 p-2 bg-neutral-700 hover:bg-neutral-600 rounded-md transition-colors duration-200 border border-white/10 hover:border-white/20"
          title={copied ? "Copied!" : "Copy to clipboard"}
        >
          {copied ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-green-400"
            >
              <path d="M20 6 9 17l-5-5"/>
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="text-gray-400 hover:text-white"
            >
              <rect width="14" height="14" x="8" y="8" rx="2" ry="2"/>
              <path d="m4 16-2-2v-8a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2"/>
            </svg>
          )}
        </button>
      </div>
    </li>
    <li>
      <strong>Save and Refresh:</strong>
      <p>
        Save the configuration file with <code className="text-yellow-400">Ctrl+S</code> (Windows) or{" "}
        <code className="text-yellow-400">Cmd+S</code> (Mac), then click <strong>Refresh</strong> in the Manage Plugins section.
      </p>
    </li>
    <li>
      <strong>Verify Connection:</strong>
      <p>Your DevilDev MCP server should now appear in the available tools list within Cascade. You can start using it in your chat prompts and development workflow.</p>
    </li>
  </ol>
</CardContent>

                </Card>
              </TabsContent>
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  )
} 
