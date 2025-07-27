"use client"

import * as React from "react"
import { ChevronRight, File, Folder, Copy, Download, ExternalLink, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import JSZip from "jszip"

interface FileNode {
  type: "file" | "folder"
  content?: string
  children?: Record<string, FileNode>
} 

export default function FileExplorer({projectRules, plan, phaseCount, phases, prd, projectStructure, uiUX}: {projectRules: string, plan: string, phaseCount: number, phases: string[], prd: string, projectStructure: string, uiUX: string}) {
  // Sample file structure with content
  const fileStructure: Record<string, FileNode> = { 
    Docs: {
      type: "folder" as const,
      children: {
        "Bug_Tracking.md": {
          type: "file" as const,
          content: "Bug Tracking System",
        },
        "Project_Structure.md": {
          type: "file" as const,
          content: projectStructure,
        },
        "UI_UX.md": {
          type: "file" as const,
          content: uiUX,
        },
      },
    },
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
          content: `# Development Agent Workflow

## Primary Directive
You are a development agent implementing a project based on established documentation. Your goal is to build a cohesive, well-documented, and maintainable software product. **ALWAYS** consult documentation before taking any action and maintain strict consistency with project standards.

## Core Workflow Process

### Before Starting Any Development Session
1. **Read Project Overview**: Consult ''PRD.md'' to understand the overall software concept, goals, and requirements
2. **Check Current Phase**: Review ''PLAN.md'' to identify the current development phase and overall project status
3. **Access Phase Tasks**: Navigate to ''/Phases/Phase_N.md'' (where N is current phase number) to see available tasks
4. **Verify Prerequisites**: Ensure all dependencies and prerequisites for the current phase are met

### Task Execution Protocol

#### 1. Task Selection & Assessment
- **Select Next Task**: Choose the next unchecked task from ''/Phases/Phase_N.md''
- **Read Task Completely**: Understand the full scope, requirements, and expected deliverables
- **Assess Complexity**:
  - **Simple Task**: Can be completed in one implementation cycle (15-30 minutes)
  - **Complex Task**: Requires breaking down into smaller subtasks - create a detailed todo list first

#### 2. Pre-Implementation Research
- **Documentation Review**: Read all referenced documentation in the task description
- **Architecture Consultation**: Check ''PLAN.md'' and architecture details for implementation guidance
- **Dependency Verification**: Ensure all required components, packages, and services are available
- **Context Understanding**: Review related completed tasks to maintain consistency

#### 3. Implementation Guidelines

##### For All Development Tasks:
- **Project Structure Compliance**: 
  - **ALWAYS** check ''/Docs/Project_Structure.md'' before:
    - Creating any files or folders
    - Running installation commands
    - Adding new dependencies
    - Modifying build configurations
    - Changing project organization

##### For UI/UX Implementation:
- **Design System Adherence**:
  - **MANDATORY** consultation of ''/Docs/UI_UX.md'' before implementing any visual elements
  - Follow established design patterns, color schemes, and typography
  - Implement responsive design according to specified breakpoints
  - Ensure accessibility standards are met
  - Maintain consistent user experience across all components

##### For Backend/API Development:
- **Architecture Alignment**: Follow patterns established in architecture documentation
- **Data Validation**: Implement proper input validation and error handling
- **Security Standards**: Apply authentication, authorization, and data protection measures
- **Performance Considerations**: Optimize database queries and API response times

##### For Testing Implementation:
- **Test Coverage**: Write comprehensive tests for all new functionality
- **Test Documentation**: Include test cases in relevant documentation
- **Integration Testing**: Verify component interactions work correctly

#### 4. Error Handling & Documentation Protocol

##### When Encountering Errors:
1. **Check Known Issues**: **FIRST** consult "/Docs/Bug_Tracking.md" for similar problems and solutions
2. **Analyze Root Cause**: Identify the underlying cause of the error
3. **Implement Solution**: Apply appropriate fix based on error analysis
4. **Document Everything**: Log complete error details in "/Docs/Bug_Tracking.md":
   - Error description and context
   - Steps to reproduce
   - Root cause analysis
   - Solution implemented
   - Prevention measures
   - Timestamp and phase information

##### For New Issues:
- **Immediate Documentation**: Log any new errors or challenges in "/Docs/Bug_Tracking.md"
- **Solution Tracking**: Document all attempted solutions, even if unsuccessful
- **Pattern Recognition**: Note if error relates to existing patterns or introduces new complexity

#### 5. Code Quality & Standards

##### Before Committing Code:
- **Code Review**: Self-review code for clarity, efficiency, and maintainability
- **Naming Conventions**: Follow established naming patterns from existing codebase
- **Documentation**: Add inline comments for complex logic and JSDoc for functions
- **Type Safety**: Ensure proper typing (if using TypeScript) with strict compilation
- **Performance**: Verify code doesn't introduce performance regressions

##### File Organization:
- **Consistent Structure**: Follow patterns established in ''/Docs/Project_Structure.md''
- **Logical Grouping**: Organize related files and components together
- **Clear Naming**: Use descriptive names that indicate purpose and functionality

#### 6. Task Completion Verification

##### Mark Task Complete ONLY When:
- [ ] **Functionality Implemented**: All required features work as specified
- [ ] **Documentation Updated**: Relevant docs reflect changes made
- [ ] **Structure Compliance**: All files/folders follow project structure guidelines
- [ ] **UI/UX Compliance**: Visual elements match design specifications (if applicable)
- [ ] **Error-Free Operation**: No console errors, warnings, or runtime issues
- [ ] **Testing Passed**: All relevant tests pass and new tests added where needed
- [ ] **Code Quality**: Code follows established patterns and standards
- [ ] **Dependencies Resolved**: All prerequisites and dependencies satisfied

##### Post-Completion Actions:
- **Update Phase Document**: Check off completed task in ''/Phases/Phase_N.md''
- **Update Documentation**: Refresh any affected documentation files
- **Prepare Next Task**: Review next available task and its requirements

## File Reference Hierarchy (Check in This Order)

1. **''/Docs/Bug_Tracking.md''** - Check for known issues and solutions FIRST
2. **''PRD.md''** - Overall project understanding and requirements
3. **''PLAN.md''** - Current phase status and development strategy
4. **''/Phases/Phase_N.md''** - Specific task details and requirements
5. **''/Docs/Project_Structure.md''** - File organization and structure guidelines
6. **''/Docs/UI_UX.md''** - Design system and user experience requirements
7. **Architecture documentation** - Technical implementation guidance

## Critical Rules & Prohibitions

### NEVER:
- **Skip Documentation Consultation** - Always read relevant docs before implementing
- **Mark Tasks Complete Without Testing** - Verify everything works before checking off
- **Ignore Project Structure Guidelines** - Follow established patterns consistently
- **Implement UI Without Design Review** - Check UI_UX.md for every visual element
- **Fix Errors Without Checking Bug_Tracking.md** - Review known issues first
- **Create Files Without Structure Verification** - Consult Project_Structure.md for placement
- **Add Dependencies Without Documentation** - Follow established dependency management
- **Commit Code With Errors or Warnings** - Resolve all issues before completion

### ALWAYS:
- **Document All Problems and Solutions** - Log everything in ''/Docs/Bug_Tracking.md''
- **Follow Established Workflow Process** - Complete each step in the defined sequence
- **Maintain Consistency** - Align with existing patterns and conventions
- **Verify Prerequisites** - Ensure all dependencies are met before starting
- **Test Thoroughly** - Validate functionality before marking tasks complete
- **Update Documentation** - Keep all project docs current with changes
- **Consider Impact** - Evaluate how changes affect other components
- **Seek Pattern Compliance** - Follow architectural and design patterns

## Success Metrics

Your implementation is successful when:
- All phase tasks are completed according to specifications
- Code is maintainable, well-documented, and follows project standards
- No errors or warnings exist in the development environment
- All functionality works as designed in the PRD
- Documentation accurately reflects the current state of the project
- Future developers can easily understand and extend your work

## Remember
Every decision should support the overall project goals while maintaining consistency with established patterns. Build software that is not just functional, but also maintainable, scalable, and aligned with the project vision outlined in the PRD.`,
        },
    "PLAN.md": {
          type: "file" as const,
          content: plan,
        },
    "PRD.md": {
          type: "file" as const,
          content: prd,
        },
  }
  const [selectedFile, setSelectedFile] = React.useState<string>("PROJECT_RULES.md")
  const [selectedContent, setSelectedContent] = React.useState<string>("")
  const [isCopied, setIsCopied] = React.useState<boolean>(false)
 
  React.useEffect(() => {
    // Get content for selected file
    const pathParts = selectedFile.split("/")
    let current: any = fileStructure

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i]
      
      if (current[part]) {
        current = current[part]
        
        // If this is not the last part and current is a folder, navigate to its children
        if (i < pathParts.length - 1 && current.type === "folder" && current.children) {
          current = current.children
        }
      } else {
        // If we can't find the part, reset content and break
        setSelectedContent("")
        return
      }
    }

    if (current?.content) {
      setSelectedContent(current.content)
    } else {
      setSelectedContent("")
    }
  }, [selectedFile, fileStructure])


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

  // Function to handle copy
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(selectedContent)
      setIsCopied(true)
      
      // Reset the copy state after 1.5 seconds
      setTimeout(() => {
        setIsCopied(false)
      }, 1500)
    } catch (error) {
      console.error("Failed to copy content:", error)
    }
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
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-8 h-8 text-white/60 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/30 transition-all duration-200"
          onClick={handleCopy}
        >
          {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
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
