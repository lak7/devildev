"use client"

import * as React from "react"
import { ChevronRight, File, Folder, Copy, ExternalLink, Check, Loader2, Server } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface SandboxViewerProps {
  sandboxData: {
    sandboxId: string;
    sandboxUrl: string;
    filesList: Array<{
      name: string;
      type: "file" | "dir";
      path: string;
      size?: number;
    }>;
  } | null;
  isDeploying: boolean;
}

interface FileNode {
  type: "file" | "dir";
  name: string;
  path: string;
  size?: number;
  children?: Record<string, FileNode>;
}

export default function SandboxViewer({
  sandboxData,
  isDeploying
}: SandboxViewerProps) {
  const [selectedFile, setSelectedFile] = React.useState<string | null>(null);
  const [isCopied, setIsCopied] = React.useState<boolean>(false);
  const [isIdCopied, setIsIdCopied] = React.useState<boolean>(false);
  const [expandedFolders, setExpandedFolders] = React.useState<Set<string>>(new Set());

  // Build file tree from flat filesList
  const buildFileTree = React.useCallback((): Record<string, FileNode> => {
    if (!sandboxData?.filesList || sandboxData.filesList.length === 0) {
      return {};
    }

    const tree: Record<string, FileNode> = {};
    
    // Create a map to quickly check if a specific path has children
    const pathHasChildren = new Map<string, boolean>();
    sandboxData.filesList.forEach(item => {
      const itemPath = item.path;
      // Check if any other item has this item's path as a parent
      const hasChildren = sandboxData.filesList.some(otherItem => 
        otherItem.path !== itemPath && otherItem.path.startsWith(itemPath + '/')
      );
      pathHasChildren.set(itemPath, hasChildren);
    });

    // Build the tree structure
    sandboxData.filesList.forEach(item => {
      const pathParts = item.path.split('/').filter(part => part.length > 0);
      let current: Record<string, FileNode> = tree;

      pathParts.forEach((part, index) => {
        const currentPath = '/' + pathParts.slice(0, index + 1).join('/');
        const isLastPart = index === pathParts.length - 1;

        if (isLastPart) {
          // This is the actual file/folder item
          // Check if this specific path has children
          const hasChildren = pathHasChildren.get(item.path) || false;
          const shouldBeDir = hasChildren || item.type === "dir";

          if (!current[part]) {
            current[part] = {
              type: shouldBeDir ? "dir" : item.type,
              name: item.name,
              path: item.path,
              size: item.size,
              children: shouldBeDir ? {} : undefined
            };
          } else {
            // Node already exists - ensure it's a directory if it has children
            if (shouldBeDir) {
              current[part].type = "dir";
              if (!current[part].children) {
                current[part].children = {};
              }
            }
            // Update metadata
            current[part].name = item.name;
            current[part].size = item.size;
          }
        } else {
          // Intermediate directory - must be a directory
          if (!current[part]) {
            current[part] = {
              type: "dir",
              name: part,
              path: currentPath,
              children: {}
            };
          } else {
            // Ensure it's marked as directory
            current[part].type = "dir";
            if (!current[part].children) {
              current[part].children = {};
            }
          }
          current = current[part].children!;
        }
      });
    });

    return tree;
  }, [sandboxData]);

  const fileTree = buildFileTree();

  const toggleFolder = React.useCallback((path: string, isOpen: boolean) => {
    setExpandedFolders(prev => {
      const newExpanded = new Set(prev);
      if (isOpen) {
        newExpanded.add(path);
      } else {
        newExpanded.delete(path);
      }
      return newExpanded;
    });
  }, []);

  const handleCopyUrl = async () => {
    if (!sandboxData?.sandboxUrl) return;
    try {
      await navigator.clipboard.writeText(sandboxData.sandboxUrl);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  const handleCopySandboxId = async () => {
    if (!sandboxData?.sandboxId) return;
    try {
      await navigator.clipboard.writeText(sandboxData.sandboxId);
      setIsIdCopied(true);
      setTimeout(() => {
        setIsIdCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Failed to copy Sandbox ID:", error);
    }
  };

  const getFileExtension = (filename: string) => {
    return filename.split(".").pop() || "";
  };

  const getFileIconColor = (filename: string) => {
    const ext = getFileExtension(filename);
    switch (ext) {
      case "tsx":
      case "ts":
      case "jsx":
      case "js":
        return "#3b82f6"; // blue-500
      case "css":
      case "scss":
        return "#06b6d4"; // cyan-500
      case "json":
        return "#f59e0b"; // amber-500
      case "md":
        return "#10b981"; // green-500
      default:
        return "#9ca3af"; // gray-400
    }
  };

  const renderFileTree = (node: Record<string, FileNode>, path = "") => {
    // Sort: directories first, then files, both alphabetically
    const entries = Object.entries(node).sort(([nameA, itemA], [nameB, itemB]) => {
      // Directories come before files
      if (itemA.type === "dir" && itemB.type === "file") return -1;
      if (itemA.type === "file" && itemB.type === "dir") return 1;
      // Within same type, sort alphabetically
      return nameA.localeCompare(nameB);
    });

    return entries.map(([name, item]) => {
      const fullPath = item.path;

      if (item.type === "dir") {
        const isOpen = expandedFolders.has(fullPath);
        return (
          <FileTreeFolder 
            key={fullPath} 
            name={name} 
            path={fullPath}
            isOpen={isOpen}
            onToggle={(open) => toggleFolder(fullPath, open)}
          >
            {item.children && Object.keys(item.children).length > 0 && renderFileTree(item.children, fullPath)}
          </FileTreeFolder>
        );
      }

      return (
        <FileTreeFile
          key={fullPath}
          name={name}
          path={fullPath}
          size={item.size}
          isSelected={selectedFile === fullPath}
          onClick={() => setSelectedFile(fullPath)}
          iconColor={getFileIconColor(name)}
        />
      );
    });
  };

  const selectedFileData = sandboxData?.filesList.find(f => f.path === selectedFile);

  return (
    <div className="h-full bg-black text-white flex">
      {/* File Explorer Sidebar */}
      <div className="w-64 bg-black border-r border-white/20 flex flex-col h-full">
        <div className="p-3 h-11 border-b border-white/20 flex items-center justify-between flex-shrink-0">
          <h2 className="text-sm font-medium text-white tracking-wider">SANDBOX FILES</h2>
        </div>
        <ScrollArea className="flex-1 min-h-0">
          <div className="p-2">
            {sandboxData && sandboxData.filesList.length > 0 ? (
              renderFileTree(fileTree)
            ) : (
              <div className="text-white/60 text-sm p-2">No files available</div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="h-11 bg-black border-b border-white/20 flex items-center px-4 justify-between flex-shrink-0">
          <div className="flex items-center gap-2 text-sm text-white/80">
            <Server className="w-4 h-4 text-white/60" />
            <span className="text-white font-medium">Sandbox</span>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-auto p-4">
          {isDeploying ? (
            <div className="flex flex-col items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-red-500 mb-4" />
              <p className="text-white/80 text-sm">Deploying sandbox...</p>
            </div>
          ) : sandboxData ? (
            <div className="space-y-6">
              {/* Sandbox ID */}
              <div className="bg-gray-900/50 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white/80">Sandbox ID</label>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="w-8 h-8 text-white/60 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/30 transition-all duration-200"
                    onClick={handleCopySandboxId}
                  >
                    {isIdCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-white font-mono text-sm break-all">{sandboxData.sandboxId}</p>
              </div>

              {/* Deployed URL */}
              <div className="bg-gray-900/50 border border-white/10 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-white/80">Deployed URL</label>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-white/60 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/30 transition-all duration-200"
                      onClick={handleCopyUrl}
                    >
                      {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="w-8 h-8 text-white/60 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/30 transition-all duration-200"
                      onClick={() => window.open(sandboxData.sandboxUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <a
                  href={sandboxData.sandboxUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 text-sm break-all underline flex items-center gap-1"
                >
                  {sandboxData.sandboxUrl}
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              {/* File Statistics */}
              <div className="bg-gray-900/50 border border-white/10 rounded-lg p-4">
                <label className="text-sm font-medium text-white/80 mb-2 block">Statistics</label>
                <div className="space-y-1 text-sm text-white/60">
                  <p>Total Files: {sandboxData.filesList.filter(f => f.type === 'file').length}</p>
                  <p>Total Directories: {sandboxData.filesList.filter(f => f.type === 'dir').length}</p>
                </div>
              </div>

              {/* Selected File Details */}
              {selectedFileData && (
                <div className="bg-gray-900/50 border border-white/10 rounded-lg p-4">
                  <label className="text-sm font-medium text-white/80 mb-2 block">Selected File</label>
                  <div className="space-y-1 text-sm">
                    <p className="text-white">
                      <span className="text-white/60">Name: </span>
                      {selectedFileData.name}
                    </p>
                    <p className="text-white">
                      <span className="text-white/60">Path: </span>
                      <span className="font-mono text-white/80">{selectedFileData.path}</span>
                    </p>
                    {selectedFileData.size !== undefined && (
                      <p className="text-white">
                        <span className="text-white/60">Size: </span>
                        {selectedFileData.size} bytes
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <Server className="h-12 w-12 text-white/20 mb-4" />
              <p className="text-white/60 text-sm">No sandbox deployed yet</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function FileTreeFolder({
  name,
  path,
  isOpen,
  onToggle,
  children,
}: {
  name: string;
  path: string;
  isOpen: boolean;
  onToggle: (open: boolean) => void;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-1">
      <Collapsible open={isOpen} onOpenChange={onToggle}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-start h-8 px-2 text-white/80 hover:bg-white/10 hover:text-white font-normal border border-transparent hover:border-white/20 transition-all duration-200 rounded-lg"
          >
            <ChevronRight className={`w-4 h-4 mr-2 transition-transform duration-200 ${isOpen ? "rotate-90 text-white" : "text-white/60"}`} />
            <Folder className="w-4 h-4 mr-2 text-red-400" />
            <span className="text-sm">{name}</span>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="ml-4 border-l border-white/10 pl-2">{children}</div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}

function FileTreeFile({
  name,
  path,
  size,
  isSelected,
  iconColor,
  onClick,
}: {
  name: string;
  path: string;
  size?: number;
  isSelected: boolean;
  iconColor: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      className={`w-full justify-start h-8 px-2 mb-1 font-normal transition-all duration-200 rounded-lg border ${
        isSelected 
          ? "bg-white/20 text-white border-white/40" 
          : "text-white/80 hover:bg-white/10 hover:text-white border-transparent hover:border-white/20"
      }`}
      onClick={onClick}
    >
      <File className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: iconColor }} />
      <span className="text-sm truncate flex-1 text-left">{name}</span>
    </Button>
  );
}

