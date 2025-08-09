"use client"

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { GlowingEffect } from "@/components/ui/glow-effect"

export default function ConnectMCPPage() {
  return (
    <div className="h-dvh overflow-hidden bg-black text-white p-6 sm:p-8 lg:p-12">
      <div className="w-full max-w-7xl mx-auto">
        <Tabs defaultValue="claude-code" className="w-full">
                      <div className="flex gap-8 h-full">
              {/* Left side - 40% width */}
              <div className="w-[40%] flex flex-col h-[calc(100vh-5rem)]">
                <div className="text-left mb-16 mt-16">
                  <h1 className="text-5xl font-bold bg-gradient-to-r from-white via-gray-200 to-gray-400 bg-clip-text text-transparent mb-4">
                    Connect to MCP
                  </h1>
                  <p className="text-gray-400 text-lg">
                    Choose your preferred development environment and follow the setup instructions to integrate with MCP
                  </p>
                </div>

                <TabsList className="flex flex-col w-full justify-stretch items-stretch gap-4 bg-transparent h-36">
             <TabsTrigger
               value="claude-code"
               className="relative aspect-square rounded-lg border transition-all duration-200 flex items-center justify-center
                          border-gray-500 bg-black text-gray-400 hover:border-gray-300 hover:text-gray-300
                          data-[state=active]:border-white data-[state=active]:bg-white/69 data-[state=active]:text-black
                          focus:outline-none focus:ring-offset-black text-3xl font-semibold"
             >
               <GlowingEffect disabled={false} spread={35} proximity={69}
           inactiveZone={0.01} glow={true} className="rounded-lg" />
               Claude Code
             </TabsTrigger>
             <TabsTrigger
               value="cursor"
               className="relative aspect-square rounded-lg border transition-all duration-200 flex items-center justify-center
                          border-gray-500 bg-black text-gray-400 hover:border-gray-300 hover:text-gray-300
                          data-[state=active]:border-white data-[state=active]:bg-white/69 data-[state=active]:text-black
                          focus:outline-none focus:ring-offset-black text-3xl font-semibold"
             >
               <GlowingEffect disabled={false} spread={35} proximity={69}
           inactiveZone={0.01} glow={true} className="rounded-lg" />
               Cursor
             </TabsTrigger>
             <TabsTrigger
               value="windsurf"
               className="relative  aspect-square rounded-lg border transition-all duration-200 flex items-center justify-center
                          border-gray-500 bg-black text-gray-400 hover:border-gray-300 hover:text-gray-300
                          data-[state=active]:border-white data-[state=active]:bg-white/69 data-[state=active]:text-black
                          focus:outline-none focus:ring-offset-black text-3xl font-semibold"
             >
               <GlowingEffect disabled={false} spread={35} proximity={69}
           inactiveZone={0.01} glow={true} className="rounded-lg" />
               Windsurf
             </TabsTrigger>
              </TabsList>
            </div>

            {/* Right side - 60% width */}
            <div className="w-[60%] h-[calc(100vh-5rem)]">
              <TabsContent value="claude-code" className="mt-0 h-full">
            <Card className="relative bg-neutral-950 border border-white/69 text-white rounded-2xl shadow-2xl h-full flex flex-col">
              <GlowingEffect disabled={false} spread={35} proximity={100}
          inactiveZone={0.01} glow={true} className="rounded-2xl" />
              <CardHeader className="p-6 border-b border-white/5 flex-shrink-0">
                <CardTitle className="text-3xl font-bold">Claude Code Connection Instructions</CardTitle>
                <CardDescription className="text-gray-500 mt-2">
                  Steps to configure your environment for Claude Code.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6 text-gray-300 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-500">
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

              <TabsContent value="cursor" className="mt-0 h-full">
            <Card className="relative bg-neutral-950 border border-white/69 text-white rounded-2xl shadow-2xl h-full flex flex-col">
            <GlowingEffect disabled={false} spread={35} proximity={100}
          inactiveZone={0.01} glow={true} className="rounded-2xl" />
              <CardHeader className="p-6 border-b border-white/5 flex-shrink-0">
                <CardTitle className="text-3xl font-bold">Cursor Connection Instructions</CardTitle>
                <CardDescription className="text-gray-500 mt-2">
                  Guide to setting up Cursor for MCP integration.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6 text-gray-300 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-500">
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

              <TabsContent value="windsurf" className="mt-0 h-full">
            <Card className="relative bg-neutral-950 border border-white/69 text-white rounded-2xl shadow-2xl h-full flex flex-col">
            <GlowingEffect disabled={false} spread={35} proximity={100}
          inactiveZone={0.01} glow={true} className="rounded-2xl" />
              <CardHeader className="p-6 border-b border-white/5 flex-shrink-0">
                <CardTitle className="text-3xl font-bold">Windsurf Connection Instructions</CardTitle>
                <CardDescription className="text-gray-500 mt-2">
                  How to establish a connection to MCP using Windsurf.
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6 text-gray-300 overflow-y-auto flex-1 [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-600 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-500">
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
