"use client"

import { useState, useEffect } from "react"
import { useUser } from "@clerk/nextjs"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { GlowingEffect } from "@/components/ui/glow-effect"
import { getGitHubStatus, initiateGitHubConnection, type GitHubStatus } from "../../../actions/github"

export default function ConnectMCPPage() {
  const { isSignedIn } = useUser()
  const [githubStatus, setGithubStatus] = useState<GitHubStatus>({ isConnected: false })
  const [githubLoading, setGithubLoading] = useState(false)
  const [statusLoading, setStatusLoading] = useState(true)

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
                    <strong>Install the Claude Code CLI:</strong>
                    <pre className="bg-neutral-800 p-4 rounded-lg mt-3 text-sm overflow-x-auto border border-white/5">
                      <code className="text-green-400">npm install -g @claude-code/cli</code>
                    </pre>
                  </li>
                  <li>
                    <strong>Authenticate with MCP:</strong>
                    <p>Run the authentication command and follow the browser prompts:</p>
                    <pre className="bg-neutral-800 p-4 rounded-lg mt-3 text-sm overflow-x-auto">
                      <code className="text-green-400">claude-code login --mcp</code>
                    </pre>
                  </li>
                  <li>
                    <strong>Configure Project Settings:</strong>
                    <p>Navigate to your project directory and initialize Claude Code:</p>
                    <pre className="bg-neutral-800 p-4 rounded-lg mt-3 text-sm overflow-x-auto">
                      <code className="text-green-400">
                        cd my-project
                        <br />
                        claude-code init
                      </code>
                    </pre>
                    <p>
                      This will create a <code className="text-yellow-400">.claude-code.json</code> file. Ensure the{" "}
                      <code className="text-yellow-400">mcpUrl</code> is correctly set.
                    </p>
                  </li>
                  <li>
                    <strong>Deploy to MCP:</strong>
                    <p>Once configured, you can deploy your code directly to MCP:</p>
                    <pre className="bg-neutral-800 p-4 rounded-lg mt-3 text-sm overflow-x-auto border border-white/5">
                      <code className="text-green-400">claude-code deploy --target mcp-production</code>
                    </pre>
                  </li>
                </ol>
                <p className="text-sm text-gray-400">
                  For more advanced configurations, refer to the official Claude Code documentation.
                </p>
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
                          <code className="text-yellow-400">File &gt; Preferences &gt; Settings</code> (or{" "}
                          <code className="text-yellow-400">Code &gt; Preferences &gt; Settings</code> on macOS).
                        </p>
                      </li>
                      <li>
                        <strong>Navigate to Extensions:</strong>
                        <p>In the settings search bar, type "MCP" or navigate to the Extensions section.</p>
                      </li>
                      <li>
                        <strong>Install MCP Connector Extension:</strong>
                        <p>Search for and install the "MCP Connector" extension from the Cursor Marketplace.</p>
                      </li>
                      <li>
                        <strong>Configure Extension Settings:</strong>
                        <p>
                          After installation, click on the gear icon next to the "MCP Connector" extension and select
                          "Extension Settings".
                        </p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                          <li>
                            Set <code className="text-yellow-400">MCP Host</code> to{" "}
                            <code className="text-green-400">https://api.mcp.example.com</code>
                          </li>
                          <li>
                            Enter your <code className="text-yellow-400">API Key</code> obtained from the MCP dashboard.
                          </li>
                        </ul>
                      </li>
                      <li>
                        <strong>Restart Cursor:</strong>
                        <p>Restart Cursor for the changes to take effect.</p>
                      </li>
                    </ol>
                    <p className="text-sm text-gray-400">Ensure your network allows connections to the MCP host.</p>
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
                    <p>Windsurf provides a robust way to interact with MCP. Follow these steps:</p>
                    <ol className="list-decimal list-inside space-y-4">
                      <li>
                        <strong>Download Windsurf Client:</strong>
                        <p>Download the latest Windsurf client from the official website.</p>
                        <pre className="bg-neutral-800 p-4 rounded-lg mt-3 text-sm overflow-x-auto border border-white/5">
                          <code className="text-green-400">
                            curl -O https://downloads.windsurf.com/client.zip
                            <br />
                            unzip client.zip
                          </code>
                        </pre>
                      </li>
                      <li>
                        <strong>Configure Connection Profile:</strong>
                        <p>
                          Open the Windsurf client and go to{" "}
                          <code className="text-yellow-400">Connection Profiles &gt; Add New</code>.
                        </p>
                        <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
                          <li>
                            <strong>Profile Name:</strong> <code className="text-yellow-400">MCP Production</code>
                          </li>
                          <li>
                            <strong>Host:</strong> <code className="text-green-400">mcp.your-organization.com</code>
                          </li>
                          <li>
                            <strong>Port:</strong> <code className="text-green-400">443</code> (or as specified by your MCP
                            admin)
                          </li>
                          <li>
                            <strong>Authentication Method:</strong> Select <code className="text-yellow-400">API Key</code>{" "}
                            and paste your key.
                          </li>
                        </ul>
                      </li>
                      <li>
                        <strong>Test Connection:</strong>
                        <p>Click the "Test Connection" button to verify your settings.</p>
                      </li>
                      <li>
                        <strong>Connect to MCP:</strong>
                        <p>Once the test is successful, select your new profile and click "Connect".</p>
                      </li>
                    </ol>
                    <p className="text-sm text-gray-400">
                      Ensure your firewall allows outbound connections on the specified port.
                    </p>
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
