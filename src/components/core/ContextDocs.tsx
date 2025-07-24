"use client"

import * as React from "react"
import { ChevronRight, File, Folder, Copy, Download, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import JSZip from "jszip"

interface FileNode {
  type: "file" | "folder"
  content?: string
  children?: Record<string, FileNode>
}

export default function FileExplorer({projectRules, plan, phaseCount, phases}: {projectRules: string, plan: string, phaseCount: number, phases: string[]}) {
  // Sample file structure with content
  const fileStructure: Record<string, FileNode> = { 
    Phases: { 
      type: "folder" as const,
      children: {
        ...Object.assign(
          {},
          ...phases.map((content, i) => ({
            [`Phase_${i + 1}.md`]: {
              type: "file" as const,
              content,
            },
          }))
        ),
      },
    },
    "PROJECT_RULES.md": {
          type: "file" as const,
          content: projectRules,
        },
        "PLAN.md": {
          type: "file" as const,
          content: plan,
        },
  }
  const [selectedFile, setSelectedFile] = React.useState<string>("PROJECT_RULES.md")
  const [selectedContent, setSelectedContent] = React.useState<string>("")
 
  React.useEffect(() => {
    // Get content for selected file
    console.log("Navigating to file:", selectedFile)
    const pathParts = selectedFile.split("/")
    let current: any = fileStructure

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]
      console.log(`Looking for part "${part}" in:`, Object.keys(current))
      
      if (current[part]) {
        current = current[part]
        console.log(`Found "${part}":`, current)
        
        // If this is not the last part and current is a folder, navigate to its children
        if (i < pathParts.length - 1 && current.type === "folder" && current.children) {
          current = current.children
          console.log(`Navigating to children of "${part}":`, Object.keys(current))
        }
      } else {
        // If we can't find the part, reset content and break
        console.log(`Could not find part "${part}"`)
        setSelectedContent("")
        return
      }
    }

    if (current?.content) {
      console.log("Setting content for:", selectedFile)
      setSelectedContent(current.content)
    } else {
      console.log("No content found for:", selectedFile)
      setSelectedContent("")
    }
  }, [selectedFile, fileStructure])

  React.useEffect(() => {
    console.log("FROM FILE EXPLORER: ", phases);
  }, [phases]);

  // Function to add files to zip recursively
  const addFilesToZip = (zip: any, node: Record<string, FileNode>, currentPath = "") => {
    Object.entries(node).forEach(([name, item]) => {
      const fullPath = currentPath ? `${currentPath}/${name}` : name

      if (item.type === "folder" && item.children) {
        // Create folder and recursively add its contents
        const folder = zip.folder(fullPath)
        if (folder) {
          addFilesToZip(zip, item.children, fullPath)
        }
      } else if (item.type === "file" && item.content) {
        // Add file with its content
        zip.file(fullPath, item.content)
      }
    })
  }

  // Function to handle download
  const handleDownload = async () => {
    try {
      const zip = new (JSZip as any)()
      
      // Add all files from the file structure to the zip
      addFilesToZip(zip, fileStructure)
      
      // Generate the zip file
      const content = await zip.generateAsync({ type: "blob" })
      
      // Create download link
      const url = window.URL.createObjectURL(content)
      const link = document.createElement("a")
      link.href = url
      link.download = "project-documentation.zip"
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error("Error creating zip file:", error)
    }
  }

  const renderFileTree = (node: Record<string, FileNode>, path = "") => {
    return Object.entries(node).map(([name, item]) => {
      const fullPath = path ? `${path}/${name}` : name

      if (item.type === "folder") {
        return (
          <FileTreeFolder key={fullPath} name={name} path={fullPath}>
            {item.children && renderFileTree(item.children, fullPath)}
          </FileTreeFolder>
        )
      }

      return (
        <FileTreeFile
          key={fullPath}
          name={name}
          path={fullPath}
          isSelected={selectedFile === fullPath}
          onClick={() => setSelectedFile(fullPath)}
        />
      )
    })
  }

  const getFileExtension = (filename: string) => {
    return filename.split(".").pop() || ""
  }

  const getBreadcrumbs = () => {
    return selectedFile.split("/")
  }

  return (
    <div className="h-full bg-black text-white flex">
  {/* File Explorer Sidebar */}
  <div className="w-64 bg-black border-r border-white/20 flex flex-col">
    <div className="p-3 h-11 border-b border-white/20">
      <h2 className="text-sm font-medium text-white tracking-wider">EXPLORER</h2>
    </div>
    <ScrollArea className="flex-1">
      <div className="p-2">{renderFileTree(fileStructure)}</div>
    </ScrollArea>
  </div>

  {/* Main Content Area */}
  <div className="flex-1 flex flex-col min-w-0"> 
    {/* Breadcrumb Header */}
    <div className="h-11 bg-black border-b border-white/20 flex items-center px-4 justify-between flex-shrink-0"> {/* Added flex-shrink-0 */}
      <div className="flex items-center gap-2 text-sm text-white/80">
        {getBreadcrumbs().map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="w-3 h-3 text-white/60" />}
            <span className={index === getBreadcrumbs().length - 1 ? "text-white font-medium" : "text-white/60"}>{crumb}</span>
          </React.Fragment>
        ))}
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="w-8 h-8 text-white/60 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/30 transition-all duration-200">
          <Copy className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-8 h-8 text-white/60 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/30 transition-all duration-200"
          onClick={handleDownload}
        >
          <Download className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 text-white/60 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/30 transition-all duration-200">
          <ExternalLink className="w-4 h-4" />
        </Button>
      </div>
    </div>

    {/* Code Editor Area */}
    <div className="flex-1 relative overflow-hidden min-w-0"> {/* Added min-w-0 */}
      <div 
        className="h-full overflow-auto"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255, 255, 255, 0.3) transparent'
        }}
      > 
        <style jsx>{`
          div::-webkit-scrollbar {
            height: 8px;
            width: 8px;
          }
          
          div::-webkit-scrollbar-track {
            background: transparent;
          }
          
          div::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.3);
            border-radius: 4px;
            border: none;
          }
          
          div::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.5);
          }
          
          div::-webkit-scrollbar-corner {
            background: transparent;
          }
        `}</style>
        <div className="flex min-w-max"> {/* Added min-w-max to allow horizontal expansion */}
          {/* Line Numbers */}
          <div className="bg-black px-4 py-4 text-white/40 text-sm font-mono select-none border-r border-white/10 min-w-[60px] flex-shrink-0"> {/* Added flex-shrink-0 */}
            {selectedContent.split("\n").map((_, index) => (
              <div key={index} className="leading-6 text-right hover:text-white/80 transition-colors duration-200">
                {index + 1}
              </div>
            ))}
          </div>

          {/* Code Content */}
          <div className="bg-black p-4 min-w-0"> {/* Removed flex-1, added min-w-0 */}
            <pre className="text-sm font-mono leading-6 text-white/90 whitespace-pre"> {/* Added whitespace-pre */}
              <code
                dangerouslySetInnerHTML={{
                  __html: highlightCode(selectedContent, getFileExtension(selectedFile.split("/").pop() || "")),
                }}
              />
            </pre>
          </div>
        </div>
      </div>
    </div>
  </div>
  </div>
  )
}

function FileTreeFolder({
  name,
  path,
  children,
}: {
  name: string
  path: string
  children: React.ReactNode
}) {
  const [isOpen, setIsOpen] = React.useState(path === "components" || path === "app")

  return (
    <div className="mb-1">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
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
  )
}

function FileTreeFile({
  name,
  path,
  isSelected,
  onClick,
}: {
  name: string
  path: string
  isSelected: boolean
  onClick: () => void
}) {
  const getFileIcon = (filename: string) => {
    const ext = filename.split(".").pop()
    switch (ext) {
      case "tsx":
      case "ts":
        return "#3b82f6" // blue-500
      case "css":
        return "#06b6d4" // cyan-500
      case "json":
        return "#f59e0b" // amber-500
      default:
        return "#9ca3af" // gray-400
    }
  }

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
      <File className="w-4 h-4 mr-2 flex-shrink-0" style={{ color: getFileIcon(name) }} />
      <span className="text-sm truncate">{name}</span>
    </Button>
  )
}

function highlightCode(code: string, extension: string): string {
  // Clean syntax highlighting similar to VS Code
  const highlighted = code
    // Strings
    .replace(/(".*?")/g, '<span style="color: #ce9178">$1</span>')
    .replace(/('.*?')/g, '<span style="color: #ce9178">$1</span>')
    // Comments
    .replace(/(\/\/.*$)/gm, '<span style="color: #6a9955">$1</span>')
    .replace(/(\/\*[\s\S]*?\*\/)/g, '<span style="color: #6a9955">$1</span>')
    // Keywords
    .replace(
      /\b(import|export|from|interface|type|const|let|var|function|class|extends|implements|return|if|else|for|while|do|switch|case|break|continue|try|catch|finally|throw|new|this|super|static|public|private|protected|readonly|async|await|default)\b/g,
      '<span style="color: #569cd6">$1</span>',
    )
    // Types
    .replace(
      /\b(string|number|boolean|object|any|void|null|undefined|React|useState|useEffect|useRef)\b/g,
      '<span style="color: #4ec9b0">$1</span>',
    )
    // Decorators
    .replace(/(@\w+)/g, '<span style="color: #dcdcaa">$1</span>')
    // Brackets and braces
    .replace(/(\{|\}|\[|\]|\(|\))/g, '<span style="color: #ffd700">$1</span>')
    // JSX tags
    .replace(/(<\/?[\w\s="/.':;#-\/\?]+>)/g, '<span style="color: #92c5f7">$1</span>')

  return highlighted
}
