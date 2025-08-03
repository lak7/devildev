"use client"

import * as React from "react"
import { ChevronRight, File, Folder, Copy, Download, ExternalLink, Check, Clock, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import JSZip from "jszip"

interface FileNode {
  type: "file" | "folder"
  content?: string
  children?: Record<string, FileNode>
  isGenerating?: boolean
  isComplete?: boolean
} 

interface StreamingFile {
  fileName: string
  content: string
  isComplete: boolean
}

export default function FileExplorer({
  projectRules, 
  plan, 
  phaseCount, 
  phases, 
  prd, 
  projectStructure, 
  uiUX,
  streamingUpdates = [],
  isGenerating = false,
  downloadButtonRef
}: {
  projectRules: string
  plan: string
  phaseCount: number
  phases: string[]
  prd: string
  projectStructure: string
  uiUX: string
  streamingUpdates?: StreamingFile[]
  isGenerating?: boolean
  downloadButtonRef?: React.RefObject<HTMLButtonElement | null>
}) {

  const [selectedFile, setSelectedFile] = React.useState<string>("PROJECT_RULES.md")
  const [selectedContent, setSelectedContent] = React.useState<string>("")
  const [isCopied, setIsCopied] = React.useState<boolean>(false)

  // Create dynamic file structure with streaming updates
  const createFileStructure = React.useCallback((): Record<string, FileNode> => {
    // Base structure with static content
    const baseStructure: Record<string, FileNode> = {
      Docs: {
        type: "folder" as const,
        children: {
          "Bug_Tracking.md": {
            type: "file" as const,
            content: "Bug Tracking System",
            isComplete: true
          },
          "Project_Structure.md": {
            type: "file" as const,
            content: projectStructure || "# Project Structure\n\nGenerating...",
            isGenerating: !projectStructure && isGenerating,
            isComplete: !!projectStructure
          },
          "UI_UX.md": {
            type: "file" as const,
            content: uiUX || "# UI/UX Documentation\n\nGenerating...",
            isGenerating: !uiUX && isGenerating,
            isComplete: !!uiUX
          },
        },
      },
      Phases: { 
        type: "folder" as const,
        children: phases.length > 0 ? Object.assign(
          {},
          ...phases.map((content, i) => ({
            [`Phase_${i + 1}.md`]: {
              type: "file" as const,
              content,
              isComplete: true
            },
          }))
        ) : {},
      },
      "PROJECT_RULES.md": {
        type: "file" as const,
        content: `# Development Agent Workflow

## Primary Directive
You are a development agent implementing a project based on established documentation. Your goal is to build a cohesive, well-documented, and maintainable software product. **ALWAYS** consult documentation before taking any action and maintain strict consistency with project standards.

## Core Workflow Process

### **Before Starting Any Development Session**
1. **Read Project Overview**: Consult ''PRD.md'' to understand the overall software concept, goals, and requirements
2. **Check Current Phase**: Review ''PLAN.md'' to identify the current development phase and overall project status
3. **⚠️ VERIFY PREVIOUS PHASE APPROVAL**: Check ''HUMAN_REVIEW.md'' to ensure previous phase (if any) has "APPROVED" status
4. **Access Phase Tasks**: Navigate to ''/Phases/Phase_N.md'' (where N is current phase number) to see available tasks
5. **Verify Prerequisites**: Ensure all dependencies and prerequisites for the current phase are met

**⚠️ CRITICAL: IF PREVIOUS PHASE IS NOT APPROVED IN HUMAN_REVIEW.md, DO NOT START NEW PHASE ⚠️**

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

## **CRITICAL: Human Review Process**

### **Phase Completion Protocol - MANDATORY**

**⚠️ ABSOLUTE RULE: DO NOT PROCEED TO NEXT PHASE WITHOUT HUMAN APPROVAL ⚠️**

When all tasks in a phase are technically complete:

#### Step 1: Pre-Review Preparation
1. **Update README.md**: Ensure setup instructions are current and complete
2. **Environment Configuration**: Verify all required environment variables are documented in README.md
3. **Deliverable Documentation**: Create clear documentation of what was built in this phase
4. **Prepare HUMAN_REVIEW.md Entry**: Create the review template with testing checklist (DO NOT create separate testing files)

#### Step 2: Request Human Review
**IMMEDIATELY** notify the human with this exact message:

🔄 PHASE [N] COMPLETION - HUMAN REVIEW REQUIRED

Phase [N] technical implementation is complete. Before proceeding to Phase [N+1], 
I need your review and approval.

I have prepared a review template in HUMAN_REVIEW.md with testing checklist.

REQUIRED ACTIONS FOR YOU:
1. Follow the setup instructions in README.md
2. Complete the testing checklist in HUMAN_REVIEW.md
3. Mark your approval status in HUMAN_REVIEW.md

❌ I WILL NOT PROCEED TO NEXT PHASE UNTIL HUMAN_REVIEW.md IS PROPERLY COMPLETED
✅ I will only continue after you fill out the complete review in HUMAN_REVIEW.md

CRITICAL: Even if you say "next phase" or "continue", I will ONLY proceed after 
checking that HUMAN_REVIEW.md contains your completed review for this phase.

#### Step 3: Human Review Requirements
The human must complete the review template in HUMAN_REVIEW.md with:
- **Phase Testing Checklist**: Complete all testing items
- **Environment Setup Verification**: Confirm setup worked
- **Issues Documentation**: Report any problems found
- **Overall Assessment**: Provide feedback on functionality
- **Approval Status**: Mark as APPROVED or NEEDS_REVISION

**⚠️ CRITICAL: AGENT MUST VERIFY HUMAN_REVIEW.md IS COMPLETED BEFORE PROCEEDING ⚠️**

#### Step 4: Review Verification Protocol
**BEFORE MOVING TO NEXT PHASE, AGENT MUST:**
1. **Check HUMAN_REVIEW.md**: Verify the review entry for current phase exists and is complete
2. **Validate Review Content**: Ensure all required fields are filled out
3. **Confirm Approval Status**: Verify status is marked as "APPROVED"
4. **Ignore Verbal Instructions**: Even if human says "next phase" or "continue", DO NOT proceed without proper HUMAN_REVIEW.md completion

**IF HUMAN_REVIEW.md IS NOT PROPERLY COMPLETED:**
- Remind human to complete the review template
- Do not accept verbal approvals or shortcuts
- Wait until proper documentation is provided

#### Step 5: Issue Resolution Protocol
**IF HUMAN REPORTS ISSUES IN HUMAN_REVIEW.md:**
1. **STOP ALL FORWARD PROGRESS**: Do not move to next phase
2. **Problem Analysis**: Thoroughly analyze reported issues
3. **Solution Implementation**: Fix all reported problems completely
4. **Update HUMAN_REVIEW.md**: Add resolution details to the review entry
5. **Request Re-Review**: Ask human to update their review in HUMAN_REVIEW.md after testing fixes
6. **Repeat Until Approved**: Continue this cycle until HUMAN_REVIEW.md shows "APPROVED"

#### Step 6: Phase Finalization
**ONLY AFTER HUMAN_REVIEW.md SHOWS "APPROVED" STATUS:**
1. Mark final checkbox in ''/Phases/Phase_N.md'' as complete
2. Update ''PLAN.md'' to reflect phase completion
3. Move to next phase initialization

**⚠️ CRITICAL: NEVER ACCEPT VERBAL APPROVALS - ONLY HUMAN_REVIEW.md DOCUMENTATION ⚠️**

### **Human Review Documentation Template**

The agent must create this exact template in ''/HUMAN_REVIEW.md'' for each phase review:

markdown
# Human Review Log

## Phase [N] Review - [Date]

### Testing Checklist:
**Setup & Environment:**
- [ ] Followed README.md setup instructions successfully
- [ ] Added/updated .env variables as documented
- [ ] All dependencies installed without errors
- [ ] Application starts/runs without issues

**Feature Testing:**
- [ ] [Specific deliverable 1] - works as expected
- [ ] [Specific deliverable 2] - works as expected  
- [ ] [Specific deliverable 3] - works as expected
[Add one checkbox for each key deliverable from the phase]

**Integration Testing:**
- [ ] All features work together properly
- [ ] No console errors or warnings
- [ ] Performance is acceptable
- [ ] UI/UX matches expected design (if applicable)

### Issues Found:
[List any problems, bugs, or concerns discovered during testing]
- Issue 1: [Description]
- Issue 2: [Description]
[If no issues: "No issues found"]

### Overall Assessment:
[Your feedback on the phase deliverables - functionality, code quality, documentation, etc.]

### Status: [APPROVED/NEEDS_REVISION]

**Reviewer:** [Your Name]  
**Review Date:** [Date]  
**Ready for Next Phase:** [YES/NO]

### Agent Notes:
[Space for agent to add resolution details if issues were reported]

---

**⚠️ AGENT REQUIREMENT: NEVER CREATE SEPARATE TESTING INSTRUCTION FILES ⚠️**
All testing instructions must be embedded in the HUMAN_REVIEW.md template as checklists.

## File Reference Hierarchy (Check in This Order)

1. **''/HUMAN_REVIEW.md''** - Check human approval status for current phase
2. **''/Docs/Bug_Tracking.md''** - Check for known issues and solutions FIRST
3. **''PRD.md''** - Overall project understanding and requirements
4. **''PLAN.md''** - Current phase status and development strategy
5. **''/Phases/Phase_N.md''** - Specific task details and requirements
6. **''/Docs/Project_Structure.md''** - File organization and structure guidelines
7. **''/Docs/UI_UX.md''** - Design system and user experience requirements
8. **Architecture documentation** - Technical implementation guidance

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
- **⚠️ PROCEED TO NEXT PHASE WITHOUT HUMAN_REVIEW.md COMPLETION** - ABSOLUTE PROHIBITION
- **Mark Phase Complete Without Documented Human Review** - Human must complete HUMAN_REVIEW.md template
- **Accept Verbal Approvals** - Only documented reviews in HUMAN_REVIEW.md are valid
- **Create Separate Testing Instruction Files** - All testing info goes in HUMAN_REVIEW.md template
- **Ignore "NEEDS_REVISION" Status** - Must fix all issues before proceeding
- **Move Forward on Human Say-So Without Documentation** - Even if human says "continue", check HUMAN_REVIEW.md first

### ALWAYS:
- **Document All Problems and Solutions** - Log everything in ''/Docs/Bug_Tracking.md''
- **Follow Established Workflow Process** - Complete each step in the defined sequence
- **Maintain Consistency** - Align with existing patterns and conventions
- **Verify Prerequisites** - Ensure all dependencies are met before starting
- **Test Thoroughly** - Validate functionality before marking tasks complete
- **Update Documentation** - Keep all project docs current with changes
- **Consider Impact** - Evaluate how changes affect other components
- **Seek Pattern Compliance** - Follow architectural and design patterns
- **⚠️ VERIFY HUMAN_REVIEW.md COMPLETION** - Check documentation before proceeding to next phase
- **Create Review Templates** - Prepare proper HUMAN_REVIEW.md templates with testing checklists
- **Wait for Documented Approval** - Only proceed when HUMAN_REVIEW.md shows "APPROVED" status
- **Embed Testing Instructions** - Include all testing info in HUMAN_REVIEW.md template, not separate files
- **Validate Review Completeness** - Ensure all fields in HUMAN_REVIEW.md are filled before proceeding

## Success Metrics

Your implementation is successful when:
- All phase tasks are completed according to specifications
- **Human has reviewed and approved the phase deliverables**
- Code is maintainable, well-documented, and follows project standards
- No errors or warnings exist in the development environment
- All functionality works as designed in the PRD
- Documentation accurately reflects the current state of the project
- Future developers can easily understand and extend your work
- **Human can successfully set up and test the application**

## Remember
Every decision should support the overall project goals while maintaining consistency with established patterns. Build software that is not just functional, but also maintainable, scalable, and aligned with the project vision outlined in the PRD. **Most importantly, never proceed without human verification - the human review process is crucial for ensuring quality and preventing cascading errors in subsequent phases.**`,
        isComplete: true
      },
      "HUMAN_REVIEW.md": {
        type: "file" as const,
        content: `# Human Review Log

## Phase [N] Review - [Date]

### Deliverables Tested:
- [ ] [Feature/Component 1]
- [ ] [Feature/Component 2]
- [ ] [Feature/Component 3]

### Environment Setup:
- [ ] README.md instructions followed
- [ ] .env variables configured
- [ ] Dependencies installed successfully
- [ ] Application runs without errors

### Issues Found:
[List any problems encountered during testing]

### Overall Assessment:
[Human feedback on functionality, usability, and completeness]

### Status: [APPROVED/NEEDS_REVISION]

**Reviewer:** [Human Name]  
**Review Date:** [Date]  
**Approved for Next Phase:** [YES/NO]

---`,
        isComplete: true
      },
      "PLAN.md": {
        type: "file" as const,
        content: plan || "# Development Plan\n\nGenerating...",
        isGenerating: !plan && isGenerating,
        isComplete: !!plan
      },
      "PRD.md": {
        type: "file" as const,
        content: prd || "# Product Requirements Document\n\nGenerating...",
        isGenerating: !prd && isGenerating,
        isComplete: !!prd
      },
    };

    // Apply streaming updates to the structure
    streamingUpdates.forEach(update => {
      const pathParts = update.fileName.split('/');
      let current: any = baseStructure;
      
      // Navigate to the correct location in the structure
      for (let i = 0; i < pathParts.length - 1; i++) {
        const part = pathParts[i];
        if (!current[part]) {
          current[part] = {
            type: "folder" as const,
            children: {}
          };
        }
        current = current[part].children;
      }
      
      // Update or create the file
      const fileName = pathParts[pathParts.length - 1];
      current[fileName] = {
        type: "file" as const,
        content: update.content,
        isGenerating: !update.isComplete,
        isComplete: update.isComplete
      };
    });

    return baseStructure;
  }, [projectRules, plan, phaseCount, phases, prd, projectStructure, uiUX, streamingUpdates, isGenerating]);

  const fileStructure = createFileStructure();

  // Auto-select file being generated
  React.useEffect(() => {
    if (isGenerating && streamingUpdates.length > 0) {
      const currentlyGenerating = streamingUpdates.find(f => !f.isComplete);
      if (currentlyGenerating && currentlyGenerating.fileName !== selectedFile) {
        setSelectedFile(currentlyGenerating.fileName);
      }
    }
  }, [streamingUpdates, isGenerating, selectedFile]);

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
          isGenerating={item.isGenerating}
          isComplete={item.isComplete}
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
    <div className="p-3 h-11 border-b border-white/20 flex items-center justify-between">
      <h2 className="text-sm font-medium text-white tracking-wider">EXPLORER</h2>
      {/* Progress indicator */}
      {isGenerating && streamingUpdates.length > 0 && (
        <div className="text-xs text-yellow-400 flex items-center gap-1">
          <Clock className="w-3 h-3 animate-pulse" />
          <span>{streamingUpdates.filter(f => f.isComplete).length}/{streamingUpdates.length}</span>
        </div>
      )}
    </div>
    <ScrollArea className="flex-1">
      <div className="p-2">{renderFileTree(fileStructure)}</div>
    </ScrollArea>
  </div>

  {/* Main Content Area */}
  <div className="flex-1 flex flex-col min-w-0"> 
    {/* Breadcrumb Header */}
    <div className="h-11 bg-black border-b border-white/20 flex items-center px-4 justify-between flex-shrink-0">
      <div className="flex items-center gap-2 text-sm text-white/80">
        {getBreadcrumbs().map((crumb, index) => (
          <React.Fragment key={index}>
            {index > 0 && <ChevronRight className="w-3 h-3 text-white/60" />}
            <span className={index === getBreadcrumbs().length - 1 ? "text-white font-medium" : "text-white/60"}>{crumb}</span>
          </React.Fragment>
        ))}
        
        {/* Generation Status */}
        {isGenerating && (
          <div className="ml-4 flex items-center gap-2 text-xs text-yellow-400">
            <Clock className="w-3 h-3 animate-pulse" />
            <span>Generating documentation...</span>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        {/* Show current file being generated */}
        {isGenerating && streamingUpdates.length > 0 && (
          <div className="text-xs text-yellow-400 mr-2 flex items-center gap-1">
            <div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse"></div>
            {(() => {
              const currentFile = streamingUpdates.find(f => !f.isComplete);
              return currentFile ? `Generating ${currentFile.fileName}` : 'Processing...';
            })()}
          </div>
        )}
        
        <Button 
          variant="ghost" 
          size="icon" 
          className="w-8 h-8 text-white/60 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/30 transition-all duration-200"
          onClick={handleCopy}
          disabled={isGenerating}
        >
          {isCopied ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
        </Button>
        <Button 
          ref={downloadButtonRef}
          variant="ghost" 
          size="icon" 
          className="w-8 h-8 text-white/60 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/30 transition-all duration-200 z-[100]"
          onClick={handleDownload}
          disabled={isGenerating}
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>
    </div>

    {/* Code Editor Area */}
    <div className="flex-1 relative overflow-hidden min-w-0">
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
        <div className="flex min-w-max">
          {/* Line Numbers */}
          <div className="bg-black px-4 py-4 text-white/40 text-sm font-mono select-none border-r border-white/10 min-w-[60px] flex-shrink-0">
            {selectedContent.split("\n").map((_, index) => (
              <div key={index} className="leading-6 text-right hover:text-white/80 transition-colors duration-200">
                {index + 1}
              </div>
            ))}
          </div>

          {/* Code Content */}
          <div className="bg-black p-4 min-w-0">
            <pre className="text-sm font-mono leading-6 text-white/90 whitespace-pre">
              <code
                dangerouslySetInnerHTML={{
                  __html: highlightCode(selectedContent, getFileExtension(selectedFile.split("/").pop() || "")),
                }}
              />
              {/* Typing cursor for active generation */}
              {isGenerating && streamingUpdates.some(f => f.fileName === selectedFile && !f.isComplete) && (
                <span className="inline-block w-2 h-5 bg-yellow-400 ml-1 animate-pulse"></span>
              )}
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
  const [isOpen, setIsOpen] = React.useState(path === "components" || path === "app" || path === "Docs" || path === "Phases")

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
  isGenerating = false,
  isComplete = true,
  onClick,
}: {
  name: string
  path: string
  isSelected: boolean
  isGenerating?: boolean
  isComplete?: boolean
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

  const getStatusIcon = () => {
    if (isGenerating) {
      return <Clock className="w-3 h-3 text-yellow-400 animate-pulse" />
    }
    if (isComplete) {
      return <CheckCircle className="w-3 h-3 text-green-400" />
    }
    return null
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
      <span className="text-sm truncate flex-1 text-left">{name}</span>

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
