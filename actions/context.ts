"use server"

import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";

// Streaming update callback type
export type StreamingUpdateCallback = (
  fileName: string,
  content: string,
  isComplete: boolean
) => void;

export async function numberOfPhases(conversationHistory: any[] = [], architectureData: any) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const llm = new ChatOpenAI({openAIApiKey: openaiKey})
    const template = `
You are an expert software development project manager specializing in breaking down projects into optimal development phases. Your task is to analyze a project's architecture and determine the appropriate number of phases (1-10) with meaningful phase names based on the actual components and their complexity.

## Input Data:
- Conversation History: {conversation_history}
- Architecture Details: {architecture_data}

## Analysis Instructions:

### Step 1: Analyze Architecture Components
Examine each component in the architecture_data to understand:
- **Component complexity**: Simple UI vs complex blockchain integration
- **Dependencies**: Which components depend on others
- **Technology stack**: Familiar vs cutting-edge technologies
- **Integration requirements**: External APIs, third-party services
- **Development sequence**: Logical order of implementation

### Step 2: Complexity Scoring (1-10 scale)

**Score factors:**
- **Component Count & Diversity** (0-2 points): More diverse components = higher complexity
- **Technology Complexity** (0-2 points): Blockchain, AI, real-time features = higher scores
- **Integration Complexity** (0-2 points): Multiple external services, complex data flows
- **Infrastructure Requirements** (0-2 points): Advanced deployment, monitoring, security
- **Development Dependencies** (0-2 points): Sequential vs parallel development needs

**Scoring Guidelines:**
- 1-2: Single component, basic functionality
- 3-4: 2-3 components, standard web tech
- 5-6: 4-5 components, some advanced features
- 7-8: 6-7 components, multiple integrations, advanced tech
- 9-10: 8+ components, cutting-edge tech, complex integrations

### Step 3: Phase Generation Strategy

**Analyze the architecture to identify natural phases based on:**

1. **Foundation Requirements**: What core infrastructure needs to be built first?
2. **Functional Groupings**: Group components that serve the same business function
3. **Technical Dependencies**: Components that must be built together (not separately)
4. **Integration Logical Units**: Combine external services with the features that use them
5. **Development Efficiency**: Avoid splitting tightly coupled functionality

**Critical Rules for Logical Phases:**
- **Never separate a feature from its required integration**
- **Group interdependent components** in the same phase
- **Combine backend APIs with their external service integrations**
- **Don't create phases for components that can't function independently**
- **Merge phases that would be developed by the same developer simultaneously**

### Step 4: Phase Naming Guidelines

Create meaningful phase names that reflect:
- **Complete functional deliverable** (not just technical components)
- **End-to-end feature implementation** including all required integrations
- **Business value or user capability** delivered in that phase
- **Logical milestone** that can be tested and demonstrated

**Phase Naming Patterns:**
- "Core Feature + Required Integration" (e.g., "Text Summarization with AI Processing")
- "Complete User Flow" (e.g., "User Registration & Authentication System") 
- "End-to-End Functionality" (e.g., "Payment Processing & Transaction Management")
- "Infrastructure + Foundation" (e.g., "Database Setup & API Foundation")

**Avoid These Naming Patterns:**
- Separating features from their required services
- Generic names like "Backend Development" or "Frontend Development"  
- Technical component names without business context
- Names that suggest incomplete functionality

### Step 5: Validation Rules

Ensure phases follow logical development flow:
- Early phases: Infrastructure, core backend, databases
- Middle phases: Feature development, integrations
- Later phases: Testing, optimization, deployment
- Each phase should represent meaningful progress
- Avoid phases that are too granular or too broad

## Output Requirements:

Return ONLY a valid JSON object in this exact format:


{{
  "numberOfPhases": "X",
  "phases": {{
    "Phase 1": "Phase name describing the goal",
    "Phase 2": "Phase name describing the goal",
    "Phase X": "Phase name describing the goal"
  }}
}}


## Analysis Process:

1. **Read and understand** all components in architecture_data
2. **Identify tightly coupled components** that must be developed together
3. **Group functional units** - don't separate features from their required integrations
4. **Map technical dependencies** to ensure logical development sequence  
5. **Determine complexity score** based on overall system complexity
6. **Create consolidated phases** that represent complete, testable functionality
7. **Generate meaningful phase names** that reflect the complete feature being delivered
8. **Validate logical coherence** - ensure each phase delivers working functionality

**Phase Consolidation Rules:**
- If Component A cannot work without Component B, they belong in the same phase
- External service integrations should be grouped with the features that use them
- API endpoints should be grouped with their frontend implementations when tightly coupled
- Don't create separate phases for incremental additions to the same core functionality

**Examples of Good Phase Logic:**
- ✅ "Text Summarization with OpenAI Integration" (combines feature + required service)
- ✅ "User Authentication & Profile Management" (complete user system)
- ✅ "Payment Processing & Stripe Integration" (complete payment flow)
- ❌ "Backend API Development" + "OpenAI Integration" (artificially separated)
- ❌ "Frontend UI" + "Backend Integration" (should be feature-based grouping)

**Important**: Do not use generic templates. Generate phases specifically based on the actual architecture components, their technologies, connections, and purposes as described in the architecture_data.

Now analyze the provided project data and return the appropriate JSON response.`

const prompt = PromptTemplate.fromTemplate(template);
const chain = prompt.pipe(llm).pipe(new StringOutputParser());
const formattedHistory = conversationHistory.map(msg => 
    `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
).join('\n');
const result = await chain.invoke({conversation_history: formattedHistory, architecture_data: JSON.stringify(architectureData)});
return result;
}

export async function generateProjectRules(conversationHistory: any[] = [], architectureData: any) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const llm = new ChatOpenAI({openAIApiKey: openaiKey})
    const template = `You are an expert software architect creating PROJECT_RULES.md - the master control file that guides AI coding assistants through the entire development process.

**INPUTS:**
- Conversation History: {conversation_history}
- Architecture Data: {architecture_data}

**CONTEXT:** This is the first file any AI assistant will read. It must provide complete project context and clear workflow instructions.

**OUTPUT FORMAT:**

---

# PROJECT RULES

## 🎯 Project Overview
**Project Name:** [Extract from conversation]
**Description:** [2-3 sentence project summary]
**Tech Stack:** [Primary technologies from architecture]
**Target Users:** [Who will use this application]

## 🔄 Current Development Status
**Current Phase:** NOT_STARTED
**Last Updated:** [Current date and time]
**Next Action:** Read PLAN.md and begin Phase 1

## 🧠 AI Assistant Workflow Instructions

### 📖 Getting Started (CRITICAL - READ FIRST)
1. **Read PLAN.md** - Understand the complete project structure and phase breakdown
2. **Update Phase Status** - Change "Current Phase" above from NOT_STARTED to 1 
3. **Update PLAN.md** - Change target phase status from NOT_STARTED to IN_PROGRESS
4. **Navigate to phases/PHASE_1.md** - Begin executing the detailed todo list
5. **Check off todos** as you complete them in the PHASE_N.md file
6. **Update phase status** to COMPLETED when all todos are checked and criteria met

### 🔄 Phase Transition Protocol
**When completing any phase:**
1. Verify all todos in phases/PHASE_N.md are checked (✅)
2. Confirm all acceptance criteria are met
3. Update current phase status in this file: NOT_STARTED → 1 → 2 → 3 → 4 → COMPLETED
4. Update corresponding phase status in PLAN.md: NOT_STARTED → IN_PROGRESS → COMPLETED
5. Move to next phases/PHASE_N.md file
6. Begin new phase todo list

### 📋 Todo Management Rules
- **ALWAYS** work from phases/PHASE_N.md todo lists
- **NEVER** skip todos - complete them in order
- **CHECK OFF** each todo as you complete it: "- [ ] becomes ""- [x]""
- **VALIDATE** each todo works before checking it off
- **ASK** for clarification if any todo is unclear

## 🏗️ Architecture Guidelines

### Frontend Rules ([Extract framework from architecture])
- **Component Structure:** [Specific to chosen framework]
- **File Organization:** [Based on architecture decisions]
- **State Management:** [Based on chosen solution]
- **Styling:** [Based on chosen approach]
- **TypeScript:** Strict mode enabled, proper interfaces for all props/state

### Backend Rules ([Extract backend from architecture])
- **API Structure:** [REST/GraphQL/tRPC based on architecture]
- **Database:** [Specific to chosen database and ORM]
- **Authentication:** [Based on chosen auth solution]
- **Error Handling:** Consistent error responses with proper HTTP codes
- **Validation:** Input validation on all endpoints

### Code Quality Standards
- **File Size Limit:** Maximum 300 lines per component/module
- **Function Size:** Maximum 50 lines per function
- **TypeScript:** No "any" types, strict compilation
- **Testing:** Unit tests for all business logic
- **Error Handling:** Proper try/catch blocks and user-friendly error messages

## 🧪 Testing Requirements
- **Unit Tests:** Jest/Vitest for components and utilities
- **Integration Tests:** API endpoint testing
- **E2E Tests:** Critical user flows
- **Coverage:** Minimum 80% code coverage
- **TypeScript:** All test files properly typed

## 📦 Development Environment
**Required Tools:**
- Node.js [version based on architecture]
- [Package manager based on architecture]
- [Database based on architecture]
- [Additional tools from architecture]

**Setup Commands:**
bash
npm install
npm run dev
npm run test
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
or any other for some other language/framework


## 🚀 Deployment Rules
- **Environment:** [Based on architecture - Vercel/Netlify/etc.]
- **Build Process:** [Specific build commands]
- **Environment Variables:** [List required env vars from architecture]
- **Database:** [Production database setup]

## 📚 Documentation Standards
- **README:** Keep updated with setup instructions
- **API Docs:** Document all endpoints with TypeScript types
- **Component Docs:** JSDoc comments for complex components
- **Phase Progress:** Update this file when transitioning phases

## ⚠️ Critical AI Assistant Rules
1. **NEVER SKIP PHASES** - Always follow the sequential phase order
2. **ALWAYS UPDATE STATUS** - Keep phase tracking current in both files
3. **COMPLETE ALL TODOS** - Every checkbox must be checked before phase completion
4. **VALIDATE FUNCTIONALITY** - Test that features work before marking complete
5. **FOLLOW ARCHITECTURE** - Stick to the chosen tech stack and patterns
6. **TYPE SAFETY** - All TypeScript code must compile without errors
7. **ERROR HANDLING** - Implement proper error boundaries and user feedback

## 🎯 Success Metrics
- All phases completed with todos checked off
- Application builds and runs without errors
- All tests passing
- TypeScript compilation successful
- Core functionality working as specified in PLAN.md

---

**NEXT STEPS FOR AI ASSISTANT:**
1. Open and read PLAN.md thoroughly
2. Update "Current Phase" above to "1"
3. Open phases/PHASE_1.md
4. Begin working through the todo list systematically
5. Check off each todo as completed
6. Move to next phase when current phase is 100% complete

---

**GENERATION INSTRUCTIONS:**

1. **Extract Tech Stack:** Identify specific technologies from architecture_data
2. **Customize Rules:** Tailor all sections to the chosen tech stack
3. **Phase Management:** Emphasize the phase workflow and status tracking
4. **Todo Emphasis:** Make it clear that todo lists are the primary work source
5. **Validation Focus:** Stress testing and validation at each step
6. **Update Protocols:** Clear instructions for status updates
7. **AI-Specific:** Include rules specifically for AI assistant behavior
8. **Sequential Workflow:** Emphasize the importance of following phases in order

Generate the complete PROJECT_RULES.md following this structure exactly.`


const prompt = PromptTemplate.fromTemplate(template);
const chain = prompt.pipe(llm).pipe(new StringOutputParser());
// Format conversation history for the prompt
const formattedHistory = conversationHistory.map(msg => 
    `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
).join('\n');
const result = await chain.invoke({conversation_history: formattedHistory, architecture_data: JSON.stringify(architectureData)});
return result;
}

export async function generatePlan(conversationHistory: any[] = [], architectureData: any, numOfPhase: string, phaseDetails: string, prd: string) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const llm = new ChatOpenAI({openAIApiKey: openaiKey})
    const template = `# Development Plan Document (PLAN.md) Generation Agent

You are an expert technical project manager and software architect specializing in creating comprehensive development execution plans. Your task is to analyze the project requirements, architecture, and phases to generate a detailed PLAN.md that serves as the definitive execution guide for coding assistants and development teams.

## Input Data:
- **Conversation History:** {conversation_history}
- **Architecture Details:** {architecture_data}
- **Number of Phases:** {numberOfPhases}
- **Phase Details:** {phaseDetails}
- **Product Requirements Document:** {prd}

## Analysis Instructions:

### Step 1: Extract Development Context
From all inputs, identify:
- **Core product concept and technical complexity**
- **Technology stack and architectural patterns**
- **Development methodology requirements**
- **Key technical challenges and risks**
- **Integration points and dependencies**
- **Quality and performance requirements**

### Step 2: Architecture-Driven Planning
From architecture_data, understand:
- **Component relationships and dependencies**
- **Data flow and storage patterns**
- **External service integrations**
- **Security and performance considerations**
- **Deployment and infrastructure needs**

### Step 3: Phase Integration Analysis
Use phaseDetails to:
- **Map technical components to phases**
- **Identify cross-phase dependencies**
- **Establish phase entry/exit criteria**
- **Define deliverables and success metrics**

## PLAN.md Structure Requirements:

### 1. Development Execution Overview
- **Development Strategy:** High-level approach and methodology
- **Technical Architecture Summary:** Key architectural decisions and rationale
- **Development Workflow:** How the team should approach implementation
- **Quality Assurance Strategy:** Testing approach and quality gates

### 2. Technical Implementation Strategy
- **Code Organization:** Folder structure and file organization principles
- **Naming Conventions:** Consistent naming across components, functions, and variables
- **Coding Standards:** Language-specific best practices and style guidelines
- **Database Design Strategy:** Schema evolution and data management approach
- **API Design Principles:** RESTful design, versioning, and documentation standards

### 3. Integration & Testing Strategy
- **Component Integration Plan:** How different architecture components connect
- **Testing Methodology:** Unit, integration, and end-to-end testing approach
- **Quality Gates:** Acceptance criteria and validation checkpoints
- **Performance Testing:** Load testing and optimization strategies
- **Security Testing:** Security validation and penetration testing approach

### 4. Development Environment Setup
- **Required Tools:** Development tools, IDEs, and utilities
- **Dependencies Management:** Package managers and version control
- **Environment Configuration:** Local, development, and staging environments
- **Database Setup:** Local database configuration and seed data
- **Third-Party Services:** API keys, service configurations, and testing accounts

### 5. Risk Management & Technical Challenges
- **Technical Risks:** Potential technical bottlenecks and challenges
- **Mitigation Strategies:** Alternative approaches and fallback plans
- **Third-Party Dependencies:** External service risks and alternatives
- **Performance Bottlenecks:** Anticipated performance issues and solutions
- **Security Considerations:** Security risks and implementation guidelines

### 6. Communication & Handoff Protocols
- **Deliverable Standards:** What constitutes completed work for each phase
- **Documentation Requirements:** Code documentation and technical specifications
- **Code Review Process:** Review standards and approval workflows
- **Knowledge Transfer:** Information sharing between development phases
- **Progress Tracking:** Status reporting and milestone validation

### 7. Success Metrics & Validation
- **Technical Validation Criteria:** How to verify technical implementation
- **Performance Benchmarks:** Expected performance metrics and thresholds
- **User Acceptance Validation:** Testing with real users and feedback collection
- **Launch Readiness Checklist:** Final validation before production deployment

## Critical Requirements:

### MUST Include Development Phases Progress Table:

| Phase | Key Deliverables | Success Criteria | Status |
|-------|------------------|------------------|--------|
| [Use exact phase names from phaseDetails] | [Specific technical deliverables] | [Measurable validation criteria] | NOT STARTED |


**Table Requirements:**
- **Make sure all are marked as NOT STARTED**
- **Use exact phase names** from phaseDetails input
- **Key Deliverables** must be specific, technical outcomes
- **Success Criteria** must be measurable and testable
- **Status column** shows "NOT STARTED" for all phases initially ** MOST IMPORTANT **
- **Cover all phases** from numberOfPhases and phaseDetails

### Critical Dependencies & Assumptions Section:
- **Architecture Dependencies:** Components that must be built before others
- **Third-Party Service Dependencies:** External services from architecture_data
- **Technical Risk Factors:** Challenges based on chosen technology stack
- **Development Assumptions:** Key assumptions that could impact timeline

### Technical Implementation Guidelines:
- **Use actual technology names** from architecture_data
- **Reference specific components** and their integration requirements
- **Include data models and relationships** based on architecture
- **Specify performance requirements** appropriate for the system complexity
- **Define security implementation** standards for the application type

## Content Quality Standards:

### Be Development-Focused:
- **Actionable for developers:** Every section should guide actual development work
- **Technically specific:** Use exact technologies, frameworks, and tools
- **Implementation-ready:** Provide concrete guidance for coding decisions
- **Quality-oriented:** Include standards for code quality and testing

### Be Architecture-Aligned:
- **Reflect actual system design** from architecture_data
- **Address real technical challenges** identified in the architecture
- **Support chosen technology stack** with appropriate methodologies
- **Enable successful integration** of all architectural components

### Be Phase-Aware:
- **Support phase-based development** approach
- **Enable smooth transitions** between development phases
- **Provide clear validation** criteria for each phase completion
- **Facilitate parallel development** where architecturally possible

## Output Requirements:

Generate a comprehensive PLAN.md document that:
- **Serves as the primary execution guide** for all development work
- **Contains no placeholder text** - all sections filled with project-specific content
- **Is immediately actionable** for coding assistants and developers
- **Accurately reflects** the technical architecture and requirements
- **Provides clear quality standards** and validation criteria
- **Enables successful project execution** from start to deployment

The PLAN.md should be the go-to document that any coding assistant can reference to understand how to build this specific product according to the established architecture, standards, and methodology.`
    const prompt = PromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
    const formattedHistory = conversationHistory.map(msg => 
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');
    const result = await chain.invoke({conversation_history: formattedHistory, architecture_data: JSON.stringify(architectureData), numberOfPhases: numOfPhase, phaseDetails: typeof phaseDetails !== 'string' ? JSON.stringify(phaseDetails) : phaseDetails, prd: prd});
    return result;
}

export async function generatePRD(conversationHistory: any[] = [], architectureData: any, numOfPhase: string, phaseDetails: string) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const llm = new ChatOpenAI({openAIApiKey: openaiKey})
    const template = `
    # Product Requirements Document (PRD) Generation Agent

You are an expert product manager specializing in creating comprehensive Product Requirements Documents for software products. Your task is to analyze the project conversation, architecture, and development phases to generate a detailed, professional PRD that serves as the complete specification for developers and stakeholders.

## Input Data:
- **Conversation History:** {conversation_history}
- **Architecture Details:** {architecture_data}
- **Number of Phases:** {numberOfPhases}
- **Phase Details:** {phaseDetails}

## Analysis Instructions:

### Step 1: Extract Core Product Information
From the conversation history and architecture, identify:
- **Product concept and main purpose**
- **Target users and their primary needs**
- **Core value proposition**
- **Key business objectives**
- **Technical platform (web app/mobile app)**
- **Essential vs nice-to-have features**

### Step 2: Architecture Analysis
From the architecture_data, understand:
- **Technology stack and components**
- **System complexity and integrations**
- **Data flow and storage requirements**
- **Third-party service dependencies**
- **Security and performance considerations**

### Step 3: Phase Integration
Use the numberOfPhases and phaseDetails to:
- **Map features to development phases**
- **Create realistic timeline estimates**
- **Identify phase dependencies and milestones**
- **Structure feature priorities based on phase sequence**

## PRD Generation Guidelines:

### Content Quality Standards:
- **Be Specific:** Avoid generic placeholders - use actual project details
- **Be Actionable:** Every requirement should be implementable
- **Be Measurable:** Include specific acceptance criteria and success metrics
- **Be Complete:** Cover all aspects needed for development
- **Be Realistic:** Align with the project's actual scope and complexity

### Platform-Specific Considerations:
**For Web Applications:**
- Focus on browser compatibility, responsive design, and web performance
- Include SEO considerations if applicable
- Address Progressive Web App features if relevant

**For Mobile Applications:**
- Specify iOS/Android requirements and versions
- Include app store guidelines and approval processes
- Address offline functionality and device-specific features

### Technical Accuracy:
- **Technology Stack:** Use actual technologies from architecture_data
- **Integration Details:** Reference specific APIs and services mentioned
- **Performance Requirements:** Set realistic metrics based on app complexity
- **Security Requirements:** Match the sensitivity of data being handled



## PRD Structure Requirements:

Follow the provided template structure exactly, but fill with project-specific content:

1. **Document Information:** Use actual product name and current date
2. **Executive Summary:** Write compelling, specific overview of the product
3. **MVP Vision & Strategy:** Define clear problem statement and solution
4. **User Assumptions:** Create realistic user profiles based on product concept
5. **Platform Specifications:** Detailed technical requirements for chosen platform
6. **MVP Functional Requirements:** Comprehensive feature specifications with acceptance criteria
7. **Technical Architecture:** Detailed system design based on architecture_data
8. **User Experience & Design:** Specific UX/UI requirements for the product type

### Section Dependencies & Assumptions:
- Reference specific architecture components that create dependencies
- Include third-party service dependencies from architecture_data
- Mention technical risks based on chosen technology stack

### Feature Documentation:
- **Write detailed user stories** for each core feature
- **Include specific acceptance criteria** that developers can implement
- **Map features to development phases** for logical progression
- **Prioritize features** as Must-Have, Nice-to-Have, or Out-of-Scope

### Technical Specifications:
- **Use actual technology names** from the architecture
- **Include specific integration requirements** for third-party services
- **Define data models and relationships** based on app functionality
- **Specify performance and security requirements** appropriate for the product


## Output Requirements:

Generate a complete PRD document that:
- **Follows the exact template structure** provided
- **Contains no placeholder text** - all sections filled with project-specific content
- **Is immediately actionable** for developers and stakeholders
- **Accurately reflects** the conversation history and technical architecture
- **Integrates seamlessly** with the defined development phases
- **Provides clear guidance** for successful product development

## Quality Validation:

Before generating the PRD, ensure:
- All technical details match the architecture_data
- User stories align with the product concept from conversation
- Timeline and phases are logically sequenced
- Success metrics are measurable and relevant
- Feature requirements are complete and testable
- Platform specifications match the intended deployment

Generate a comprehensive, professional PRD that serves as the definitive guide for building this specific product, incorporating all provided context and technical details.`
    const prompt = PromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
    const formattedHistory = conversationHistory.map(msg => 
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');
    const result = await chain.invoke({conversation_history: formattedHistory, architecture_data: JSON.stringify(architectureData), numberOfPhases: numOfPhase, phaseDetails: typeof phaseDetails !== 'string' ? JSON.stringify(phaseDetails) : phaseDetails});
    return result;
    
}

export async function generateNthPhase(architectureData: any, plan: string, numOfPhase: string, phaseDetails: string, prd: string, totalPhases: string) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const llm = new ChatOpenAI({openAIApiKey: openaiKey})
    const template = `# Phase Execution Plan Generator with Human Review Integration

You are an expert software development lead creating actionable execution plans for AI coding agents. Generate a focused phase execution document with a comprehensive todo list tailored specifically to the current phase requirements, including mandatory human review checkpoints.

## INPUT DATA:
- **Project Plan:** {planContent}
- **Project Architecture:** {architectureData}  
- **Target Phase:** {phaseNumber}
- **Phase Details:** {phaseDetails}
- **PRD:** {prd}
- **Total Phases:** {totalPhases}

## ANALYSIS INSTRUCTIONS:

### Step 1: Phase Analysis
- Extract the specific objectives and scope for this phase from phaseDetails
- Identify which architecture components are being built in this phase
- Understand what features/functionality this phase delivers
- Determine the platform (web app/mobile app) and relevant technologies
- **Identify if this is first phase, middle phase, or final phase for human review requirements**

### Step 2: Task Generation Strategy
- Break down the phase objective into specific, actionable implementation tasks
- Generate tasks based on the actual technologies and components in architectureData
- Ensure tasks are appropriate for the platform (web/mobile) and tech stack
- Order tasks logically based on dependencies and development workflow
- Make each task granular enough for AI agents to execute independently
- **Include human review checkpoints at appropriate intervals**

### Step 3: Platform and Technology Adaptation
- Generate tasks specific to the chosen platform and technology stack
- Include appropriate file paths, naming conventions, and patterns for the tech stack
- Reference actual components, APIs, and integrations from the architecture
- Ensure tasks reflect real development work needed for this specific phase
- **Add human approval requirements based on phase position**

## OUTPUT FORMAT:

---
# PHASE {phaseNumber}: [Extract exact phase name from phaseDetails]

**STATUS:** NOT_STARTED

---

## 🎯 Phase Objective
[Extract the specific goal of this phase from phaseDetails - what exactly needs to be accomplished]

## 🎁 Key Deliverables
[Based on phase objective and architecture components, list 3-6 specific things that will be working after this phase:]
- [Specific feature/component that will be functional]
- [Specific API/service that will be operational]  
- [Specific user capability that will be enabled]
- [Specific integration that will be completed]

## 📋 Prerequisites
**Must be completed before starting:**

[If phaseNumber == 1:]
- [ ] Project setup completed and README.md reviewed
- [ ] Development environment configured according to architecture requirements
- [ ] All required dependencies and tools installed

[If phaseNumber > 1:]
- [ ] **HUMAN APPROVAL REQUIRED:** Phase {{phaseNumber-1}} must be reviewed and approved in HUMAN_REVIEW.md
- [ ] All deliverables from Phase {{phaseNumber-1}} tested and confirmed working
- [ ] Environment setup maintained and updated from previous phase
- [ ] All reported issues from Phase {{phaseNumber-1}} resolved

**⚠️ CRITICAL: DO NOT START THIS PHASE WITHOUT HUMAN APPROVAL OF PREVIOUS PHASE ⚠️**

## 🔄 Human Review Checkpoints

### Pre-Phase Validation
[If phaseNumber > 1:]
- [ ] **Verify Human Approval**: Check HUMAN_REVIEW.md for Phase {{phaseNumber-1}} approval status
- [ ] **Issues Resolution**: Confirm all human-reported issues from previous phase are resolved
- [ ] **Environment Validation**: Ensure previous phase deliverables are working in human's environment

### Mid-Phase Review (for complex phases)
[If phase has more than 12 tasks, add:]
- [ ] **Mid-Phase Check**: After completing 60% of tasks, request human validation of core functionality
- [ ] **Course Correction**: Address any human feedback before proceeding with remaining tasks

### End-Phase Review (MANDATORY)
- [ ] **Deliverable Testing**: Human must test all key deliverables listed above
- [ ] **Environment Setup**: Human must follow updated README.md and configure .env variables
- [ ] **Functionality Validation**: Human must confirm all features work as expected
- [ ] **Issue Reporting**: Human must document any problems in HUMAN_REVIEW.md
- [ ] **Final Approval**: Human must approve phase completion before moving forward

## ✅ Implementation Tasks

[Generate 8-20 specific, actionable tasks based on the phase requirements. Each task should:]
[- Start with - [ ] (unchecked)]
[- Include exact file paths appropriate for the technology stack]
[- Reference specific technologies from architectureData]
[- Be granular enough for AI agent execution]
[- Follow logical development sequence]
[- Include proper typing/interface specifications for typed languages]

### Core Development Tasks:
- [ ] [Specific task with exact file path and technology details]
- [ ] [Another specific task with implementation details]
- [ ] [Continue with all necessary tasks for this phase...]

### Documentation & Testing Tasks:
- [ ] Update README.md with new setup instructions for this phase
- [ ] Document all new environment variables and configuration requirements
- [ ] Create comprehensive testing instructions for human reviewer
- [ ] Update relevant documentation files with new features/components
- [ ] Add inline code documentation and comments for complex logic

### Human Review Preparation Tasks:
- [ ] **Create Human Testing Instructions**: Document step-by-step testing process for all deliverables
- [ ] **Update Environment Documentation**: Ensure all required .env variables are documented
- [ ] **Prepare Demo/Screenshots**: Create visual proof of functionality for human review
- [ ] **Validate Error Handling**: Test and document error scenarios human might encounter

## 🏁 Phase Completion Criteria

**This phase is complete when:**
- [ ] All implementation tasks above are checked off
- [ ] [Specific functional requirement works based on phase objective]
- [ ] [Specific technical requirement is met based on architecture]  
- [ ] [Specific validation criteria based on deliverables]
- [ ] README.md updated with current setup instructions
- [ ] All environment variables documented and tested

**⚠️ CRITICAL: HUMAN APPROVAL REQUIRED BEFORE MARKING COMPLETE ⚠️**

### Human Approval Requirements:
- [ ] **Human Environment Setup**: Human successfully followed README.md instructions
- [ ] **Human Functional Testing**: Human tested all key deliverables and confirmed they work
- [ ] **Human Issue Resolution**: All human-reported issues resolved completely
- [ ] **Human Documentation Review**: Human reviewed and approved updated documentation
- [ ] **Human Final Approval**: Human marked this phase as "APPROVED" in HUMAN_REVIEW.md

[If this is the final phase (phaseNumber == totalPhases):]
### 🎉 FINAL PHASE - COMPLETE PROJECT VALIDATION
**Additional Final Phase Requirements:**
- [ ] **Full Application Testing**: Human must test complete end-to-end functionality
- [ ] **Production Readiness**: Human must confirm application is deployment-ready
- [ ] **Documentation Completeness**: Human must validate all documentation is comprehensive
- [ ] **Final Project Approval**: Human must provide final project sign-off in HUMAN_REVIEW.md

**⚠️ ABSOLUTE REQUIREMENT: PROJECT NOT COMPLETE WITHOUT FINAL HUMAN APPROVAL ⚠️**

---
**COMPLETION STATUS:** NOT_STARTED

**HUMAN APPROVAL STATUS:** PENDING

---

## 🚨 HUMAN REVIEW PROTOCOL

### When Phase Implementation is Complete:
1. **STOP**: Do not mark phase as complete
2. **NOTIFY HUMAN**: Request human review using this exact message:


🔄 PHASE {phaseNumber} COMPLETION - HUMAN REVIEW REQUIRED

Phase {phaseNumber} implementation is complete. I need your review and approval before proceeding.

DELIVERABLES TO TEST:
[List all key deliverables from above]

SETUP INSTRUCTIONS:
1. Follow updated README.md instructions
2. Configure .env variables as documented
3. Test each deliverable according to provided instructions

REQUIRED ACTION:
Update HUMAN_REVIEW.md with your test results and approval status.

❌ I CANNOT PROCEED UNTIL YOU APPROVE THIS PHASE


3. **WAIT**: Do not proceed until human approval is received
4. **FIX ISSUES**: If human reports problems, resolve them completely before requesting re-review
5. **FINAL APPROVAL**: Only mark phase complete after explicit human approval

### Issue Resolution Process:
If human reports issues:
1. **Document Issues**: Log all reported problems
2. **Analyze Problems**: Understand root causes  
3. **Implement Fixes**: Resolve all issues completely
4. **Re-test**: Validate fixes work properly
5. **Request Re-review**: Ask human to test again
6. **Repeat**: Continue until human approves

---

## TASK GENERATION REQUIREMENTS:

### Task Quality Standards:
- **Technology Specific:** Use actual technologies, frameworks, and tools from architectureData
- **Platform Appropriate:** Generate web-specific tasks for web apps, mobile-specific for mobile apps
- **Phase Focused:** Only include tasks necessary to complete THIS specific phase
- **Actionable:** Each task should be a specific action an AI can take
- **Granular:** Tasks should be completable in 15-30 minutes each
- **Sequential:** Order tasks logically based on development dependencies
- **Human-Testable:** Ensure deliverables can be easily tested by non-technical humans

### Task Content Requirements:
- **Exact File Paths:** Include precise file locations appropriate for the project structure
- **Specific Function/Component Names:** Reference actual names that will be created
- **Technology Integration:** Include framework-specific patterns and best practices
- **Type Specifications:** For typed languages, include interface/type requirements
- **API Specifications:** Include exact endpoint paths and method details where relevant
- **Testing Instructions:** Include how humans can verify each major component works

### Human Review Integration:
- **Prerequisites Checking:** Always verify previous phase approval before starting
- **Documentation Updates:** Always include README.md and environment setup updates
- **Testing Preparation:** Always include tasks for preparing human testing instructions
- **Approval Requirements:** Always include human approval as completion requirement

### Avoid These Patterns:
- Generic category headers like "Setup & Configuration" or "Frontend Development"
- Hardcoded quality standards that may not apply to all projects
- Platform assumptions (don't assume web if it's mobile, or vice versa)
- Technology assumptions not present in the architectureData
- Tasks unrelated to the specific phase objective
- **Proceeding without human approval from previous phases**
- **Marking phases complete without human validation**

## GENERATION PROCESS:

1. **Read phaseDetails** to understand exactly what this phase should accomplish
2. **Analyze architectureData** to identify relevant components and technologies
3. **Determine phase position** (first/middle/last) for appropriate human review requirements
4. **Determine platform type** (web/mobile) and generate appropriate tasks
5. **Create specific tasks** that directly contribute to the phase objective
6. **Add human review checkpoints** at appropriate intervals
7. **Order tasks logically** following natural development workflow including review points
8. **Validate task relevance** - ensure every task is necessary for this phase
9. **Include human approval requirements** based on phase position and complexity

Generate the complete phase execution plan now, ensuring all tasks are specific to this phase, platform, and technology stack, with appropriate human review integration based on the phase number and total phases.`
    const prompt = PromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
    const result = await chain.invoke({architectureData: JSON.stringify(architectureData), planContent: plan, phaseNumber: numOfPhase, phaseDetails: typeof phaseDetails !== 'string' ? JSON.stringify(phaseDetails) : phaseDetails, prd: prd, totalPhases: totalPhases});
    return result;
}

export async function generateProjectStructure(architectureData: any, plan: string, prd: string) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const llm = new ChatOpenAI({openAIApiKey: openaiKey})
    const template = `
    # Project Structure Document Generator

You are an expert software architect specializing in creating comprehensive project structure documentation. Your task is to analyze the project requirements, architecture, and development plan to generate a detailed Project_Structure.md that defines the complete file organization, folder hierarchy, and structural guidelines for the development team.

## INPUT DATA:
- **Project Plan:** {planContent}
- **Project Architecture:** {architectureData}
- **PRD:** {prd}

## ANALYSIS INSTRUCTIONS:

### Step 1: Platform & Technology Analysis
From the inputs, identify:
- **Platform type**: Web application, mobile app (iOS/Android/React Native), or hybrid
- **Technology stack**: Primary frameworks, languages, and tools from architectureData
- **Project complexity**: Number of components, integrations, and features
- **Development approach**: Monorepo, microservices, or traditional structure
- **Build tools and configuration requirements**

### Step 2: Architecture-Driven Structure Design
Based on architectureData components:
- **Map components to folder structure**: Each architectural component should have a logical place
- **Plan integration points**: Where external services and APIs will be organized
- **Design data flow organization**: How models, types, and data structures will be arranged
- **Establish component relationships**: Parent-child and sibling component organization

### Step 3: Development Workflow Integration
From planContent, understand:
- **Phase-based development needs**: Structure that supports incremental development
- **Team collaboration requirements**: Clear separation of concerns for multiple developers
- **Testing and quality assurance structure**: Where tests, docs, and quality tools live
- **Deployment and build artifact organization**

## PROJECT STRUCTURE REQUIREMENTS:

### Generate Complete Folder Hierarchy
Create a comprehensive folder structure that includes:
- **Root level organization** with clear purpose for each top-level directory
- **Source code organization** appropriate for the chosen technology stack
- **Component and feature organization** that matches the architectural design
- **Asset and resource management** for styles, images, configs, and static files
- **Documentation structure** for all project documentation
- **Testing organization** for unit, integration, and end-to-end tests
- **Build and deployment structure** for configuration and deployment files

### Technology-Specific Adaptations
**For Web Applications:**
- Modern web framework structure (Next.js, React, Vue, Angular, etc.)
- Public/static asset organization
- API routes and server-side code structure
- Component library and design system organization

**For Mobile Applications:**
- Platform-specific folders (iOS/Android if native, or unified if React Native/Flutter)
- Asset organization for different screen densities
- Platform-specific configuration and build files
- Component and screen organization

**For Full-Stack Applications:**
- Clear separation between frontend and backend (if applicable)
- Shared types and utilities organization
- Database schema and migration structure
- API and service layer organization

## OUTPUT FORMAT:

***markdown
# Project Structure Documentation

## Overview
[Brief description of the project structure philosophy and organization principles based on the project type and architecture]

## Root Directory Structure


[PROJECT_NAME]/
├── [Generate complete folder hierarchy with explanations]
│   ├── [Subfolder with purpose explanation]
│   │   ├── [Files and nested structure]
│   │   └── [More specific organization]
│   ├── [Another major section]
│   └── [Continue with full structure]
├── [Configuration files at root level]
├── [Documentation and project files]
└── [Build and deployment files]


## Directory Descriptions

### [Major Directory 1]
**Purpose:** [What this directory contains and why]
**Contents:** [What types of files go here]
**Naming Convention:** [How files should be named in this directory]
**Usage Guidelines:** [When and how to use this directory]

### [Major Directory 2]
[Continue for all major directories...]

## File Organization Guidelines

### Component Organization
[Specific rules for organizing components based on the architecture]
- [Guideline based on project type]
- [Another guideline specific to the tech stack]
- [Rules for component co-location]

### Feature-Based Organization
[How features should be structured based on the PRD requirements]
- [Feature folder structure]
- [Shared vs feature-specific code organization]
- [Cross-feature dependency management]

### Asset Management
[How to organize static assets, styles, and resources]
- [Image and media file organization]
- [Stylesheet and design system structure]
- [Configuration and environment file placement]

## Naming Conventions

### Files
- [Specific naming rules for different file types]
- [Case conventions (camelCase, kebab-case, PascalCase)]
- [Extension and suffix rules]

### Folders
- [Directory naming standards]
- [Hierarchy and nesting rules]
- [Special folder naming conventions]

### Components/Modules
- [Component naming based on the technology stack]
- [Export and import naming standards]
- [Interface and type naming conventions]

## Technology-Specific Guidelines

### [Primary Technology/Framework]
[Specific guidelines for the main technology stack]
- [Framework-specific folder requirements]
- [Configuration file placement]
- [Best practices for the chosen stack]

### Dependencies & Package Management
- [Where to place package configuration files]
- [How to organize installed dependencies]
- [Custom package and module organization]

### Build & Deployment
- [Build artifact organization]
- [Configuration file structure]
- [Environment-specific file placement]

## Development Workflow Integration

### Phase-Based Development
[How the structure supports the development phases from planContent]
- [Where phase-specific files should be placed]
- [How to organize work-in-progress vs completed features]

### Testing Structure
- [Unit test placement and organization]
- [Integration test structure]
- [End-to-end test organization]
- [Test utility and helper organization]

### Documentation Organization
- [Where different types of documentation live]
- [API documentation structure]
- [Component documentation placement]

## Critical Rules

### File Creation Guidelines
- **Always check this structure** before creating new files or folders
- **Follow naming conventions** consistently throughout the project
- **Maintain feature isolation** - keep related files together
- **Separate concerns** - don't mix different types of code in the same directory

### Folder Management
- **Don't create new top-level directories** without updating this documentation
- **Group related functionality** in appropriate subdirectories
- **Keep flat structures** where possible to avoid deep nesting
- **Use descriptive names** that clearly indicate purpose

### Maintenance Guidelines
- **Update this document** when adding new major features or changing structure
- **Refactor organization** if folders become too large or unwieldy
- **Document exceptions** if deviating from standard structure for specific reasons
- **Review structure** regularly to ensure it still serves the project needs

## Common Patterns

### Import/Export Patterns
[How to structure imports and exports based on the folder organization]

### Code Co-location
[When to keep related files together vs when to separate them]

### Shared vs Feature-Specific
[Guidelines for deciding where shared code should live]

---

*This structure is designed to support the project architecture and development workflow. Always consult this document before making structural changes.*


## GENERATION REQUIREMENTS:

### Structure Accuracy:
- **Technology Appropriate**: Use folder structures that match the actual technology stack
- **Architecture Aligned**: Ensure structure supports all components in architectureData
- **Scalable Design**: Structure should grow with the project without major reorganization
- **Team Friendly**: Clear separation that allows multiple developers to work simultaneously

### Documentation Quality:
- **Be Specific**: Include exact folder names and file placement rules
- **Be Comprehensive**: Cover all aspects of project organization
- **Be Actionable**: Provide clear guidelines that developers can follow immediately
- **Be Maintainable**: Structure that can evolve with the project

### Platform Considerations:
- **Web Apps**: Include public assets, API routes, components, pages, and build files
- **Mobile Apps**: Include platform-specific folders, assets for different densities, and build configurations
- **Full-Stack**: Clear frontend/backend separation with shared utilities and types

Generate a comprehensive Project_Structure.md that serves as the rough guide for all file and folder organization decisions throughout the development process.
`
 const prompt = PromptTemplate.fromTemplate(template);
 const chain = prompt.pipe(llm).pipe(new StringOutputParser());
 const result = await chain.invoke({architectureData: JSON.stringify(architectureData), planContent: plan, prd: prd});
 return result;
}

export async function generateUIUX(architectureData: any, plan: string, prd: string) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const llm = new ChatOpenAI({openAIApiKey: openaiKey})
    const template = `
# UI/UX Documentation Generator

You are an expert UI/UX designer and user experience strategist specializing in creating comprehensive design documentation. Your task is to analyze the project requirements, architecture, and development plan to generate a detailed UI_UX.md that defines design standards, user flows, and interface guidelines for the development team.

## INPUT DATA:
- **Project Plan:** {planContent}
- **Project Architecture:** {architectureData}
- **PRD:** {prd}

## ANALYSIS INSTRUCTIONS:

### Step 1: User Experience Foundation Analysis
From PRD and project context, identify:
- **Target user personas** and their specific needs and behaviors
- **Primary user goals** and core value propositions
- **Platform characteristics** (web responsive, mobile native, hybrid)
- **Accessibility requirements** and compliance standards
- **Business objectives** that drive design decisions

### Step 2: Architecture-Driven Interface Planning
Based on architectureData components:
- **User interface touchpoints** for each architectural component
- **Data visualization needs** based on data flows and storage
- **Integration interface requirements** for external services
- **Real-time update patterns** for dynamic components
- **Error handling and feedback mechanisms** for system interactions

### Step 3: User Journey & Flow Mapping
From PRD features and user stories:
- **Core user workflows** that accomplish primary objectives
- **Alternative paths** and edge cases users might encounter
- **Cross-feature navigation patterns** and information architecture
- **Onboarding and first-time user experience flows**
- **Error recovery and help-seeking behaviors**

## UI/UX DOCUMENTATION REQUIREMENTS:

### Design System Foundation
Create comprehensive guidelines covering:
- **Visual design principles** aligned with project goals and user needs
- **Component library specifications** with consistent patterns
- **Responsive design standards** appropriate for the platform
- **Accessibility compliance** meeting WCAG standards
- **Performance considerations** for optimal user experience

### Platform-Specific Considerations
**For Web Applications:**
- Responsive breakpoints and mobile-first design
- Browser compatibility and progressive enhancement  
- SEO and semantic markup requirements
- Loading states and progressive disclosure patterns

**For Mobile Applications:**
- Platform design guidelines (iOS Human Interface/Material Design)
- Touch target sizes and gesture interactions
- Device-specific considerations (screen sizes, orientations)
- Native vs custom component usage

**For Cross-Platform:**
- Consistency across platforms while respecting native patterns
- Shared design tokens and component specifications
- Platform-specific adaptations and exceptions

## OUTPUT FORMAT:

markdown
# UI/UX Design Documentation

## Design Philosophy & Principles

### Core Design Principles
[Extract and articulate design principles based on project goals and user needs]
1. **[Principle Name]:** [Description of how it applies to this specific project]
2. **[Another Principle]:** [Specific application and reasoning]
3. **[Third Principle]:** [Context-specific explanation]

### User-Centered Design Approach
[Describe the approach based on target users from PRD]
- **Primary User Focus:** [Specific user type and their key needs]
- **Design Priorities:** [What matters most for these users]
- **Success Metrics:** [How design success will be measured]

## User Experience Architecture

### Information Architecture
[Organize content and features based on PRD requirements]

[Generate site map or app structure showing:]
├── [Primary Navigation Areas]
│   ├── [Core Feature Sections]
│   │   ├── [Sub-features and content]
│   │   └── [Related functionality]
│   └── [Secondary Features]
├── [User Account Areas] 
└── [Administrative/Settings Areas]


### Navigation Patterns
[Define navigation based on platform and architecture]
- **Primary Navigation:** [Main navigation structure and behavior]
- **Secondary Navigation:** [Contextual and sub-navigation patterns]
- **Breadcrumbs:** [When and how to implement hierarchical navigation]
- **Deep Linking:** [URL structure and direct access patterns]

## Core User Flows

### [Primary User Flow 1]
**Objective:** [What the user wants to accomplish based on PRD user stories]
**Entry Points:** [How users access this flow]
**Steps:**
1. [Specific screen/page] → [User action] → [System response]
2. [Next screen/state] → [User interaction] → [Feedback/result]
3. [Continue mapping complete flow...]

**Success Criteria:** [How user knows they've succeeded]
**Error Handling:** [What happens when things go wrong]
**Alternative Paths:** [Other ways to accomplish the same goal]

### [Primary User Flow 2]
[Repeat for all core workflows identified in PRD]

### [Additional Core Flows]
[Continue for all essential user journeys]

## Component Design System

### UI Component Standards

#### Buttons
- **Primary Button:** [Style specs, when to use, examples]
- **Secondary Button:** [Style specs, usage guidelines]
- **Icon Buttons:** [Specifications and accessibility requirements]
- **Button States:** [Hover, active, disabled, loading states]

#### Forms & Inputs
- **Text Inputs:** [Style, validation states, error handling]
- **Select/Dropdown:** [Behavior, options presentation, search]
- **Checkboxes & Radio:** [Visual design and interaction patterns]
- **Form Validation:** [Real-time vs submit validation, error messaging]

#### Data Display
- **Tables:** [Responsive behavior, sorting, filtering, pagination]
- **Cards:** [Content organization, actions, responsive behavior]
- **Lists:** [Item structure, actions, empty states]
- **Charts/Graphs:** [If data visualization is needed from architectureData]

#### Navigation Components
- **Header/Navigation Bar:** [Structure, responsive behavior, active states]
- **Sidebar:** [When to use, collapse behavior, responsive treatment]
- **Tabs:** [Style, behavior, responsive stacking]
- **Pagination:** [Style and interaction patterns]

#### Feedback Components
- **Alerts/Notifications:** [Types, positioning, dismissal, persistence]
- **Loading States:** [Spinners, skeletons, progress indicators]
- **Empty States:** [When no content exists, helpful guidance]
- **Error States:** [Error presentation and recovery options]

### Layout & Grid System
[Define layout standards based on platform]
- **Grid System:** [Column structure, gutters, responsive behavior]
- **Spacing Scale:** [Consistent spacing units and application]
- **Container Widths:** [Maximum widths and responsive breakpoints]
- **Content Areas:** [Main content, sidebars, headers, footers]

## Visual Design Standards

### Typography
- **Font Family:** [Primary and fallback fonts]
- **Type Scale:** [Heading hierarchy, body text, captions]
- **Line Height & Spacing:** [Readable line heights and paragraph spacing]
- **Font Weights:** [When to use different weights]

### Color System
- **Primary Colors:** [Brand colors with hex values and usage]
- **Secondary Colors:** [Supporting palette and applications]
- **Semantic Colors:** [Success, warning, error, info colors]
- **Neutral Colors:** [Grays for text, borders, backgrounds]
- **Accessibility:** [Contrast ratios and compliance notes]

### Iconography
- **Icon Style:** [Outline, filled, or mixed approach]
- **Icon Sizes:** [Standard sizes and scaling rules]
- **Icon Usage:** [When and how to use icons effectively]
- **Custom vs Library:** [Whether using icon library or custom icons]

## Responsive Design Guidelines

### Breakpoint Strategy
[Define breakpoints based on platform needs]
- **Mobile:** [< XXXpx] - [Specific layout adaptations]
- **Tablet:** [XXX-XXXpx] - [Layout changes and interactions]
- **Desktop:** [> XXXpx] - [Full-featured layout]

### Component Responsive Behavior
[How key components adapt across screen sizes]
- **Navigation:** [Mobile menu, desktop navigation differences]
- **Data Tables:** [Scrolling, stacking, hiding columns]
- **Forms:** [Layout changes, input sizing]
- **Content Areas:** [Sidebar behavior, content reflow]

## Accessibility Standards

### Compliance Requirements
- **WCAG Level:** [AA or AAA compliance target]
- **Keyboard Navigation:** [Tab order, focus indicators, shortcuts]
- **Screen Reader Support:** [ARIA labels, semantic HTML, alt text]
- **Color Accessibility:** [Contrast requirements, color-blind considerations]

### Inclusive Design Practices
- **Motor Accessibility:** [Touch target sizes, click areas]
- **Cognitive Load:** [Simple language, clear instructions, error prevention]
- **Language Support:** [Internationalization considerations if applicable]

## Interaction Design Patterns

### Micro-Interactions
[Based on architecture components and real-time features]
- **Button Feedback:** [Hover, click, loading states]
- **Form Interactions:** [Validation feedback, input focus]
- **Data Loading:** [Progressive loading, skeleton screens]
- **Status Updates:** [Real-time notifications, activity indicators]

### Animation Guidelines
- **Motion Principles:** [When and why to use animation]
- **Duration & Easing:** [Timing functions and duration standards]
- **Performance:** [Hardware acceleration, reduced motion preferences]

## Platform-Specific Guidelines

### [Web Application Specific]
[Include only if it's a web app]
- **Browser Support:** [Minimum supported versions]
- **Progressive Enhancement:** [Baseline vs enhanced experiences]
- **SEO Considerations:** [Meta tags, semantic structure]
- **Performance Budget:** [Page load times, image optimization]

### [Mobile Application Specific]
[Include only if it's a mobile app]
- **Platform Guidelines:** [iOS/Android specific patterns]
- **Touch Interactions:** [Gestures, swipe patterns, long press]
- **Device Features:** [Camera, location, notifications integration]
- **App Store Guidelines:** [Screenshot requirements, icon specs]

## Quality Assurance & Testing

### Design QA Checklist
- [ ] All components match design system specifications
- [ ] Responsive behavior works across all breakpoints
- [ ] Accessibility standards are met
- [ ] Loading and error states are implemented
- [ ] User flows work as designed
- [ ] Cross-browser/platform compatibility verified

### Usability Testing Guidelines
- **Testing Scenarios:** [Key user tasks to validate]
- **Success Metrics:** [How to measure usability success]
- **Feedback Collection:** [Methods for gathering user feedback]

## Implementation Guidelines

### Developer Handoff Requirements
- **Design Assets:** [What files/specifications developers need]
- **Component Documentation:** [Props, states, usage examples]
- **Responsive Specifications:** [Exact breakpoint behaviors]
- **Animation Specifications:** [Timing, easing, triggers]

### Quality Gates
- **Design Review Checkpoints:** [When design review is required]
- **Component Approval Process:** [How new components get approved]
- **Accessibility Testing:** [Required accessibility checks]
- **Cross-Platform Testing:** [Platform-specific validation requirements]

---

*This UI/UX documentation must be consulted before implementing any visual elements or user interactions. All design decisions should align with these established patterns and principles.*


## GENERATION REQUIREMENTS:

### User-Centered Focus:
- **Extract actual user types** from PRD user assumptions and stories
- **Map real user flows** based on PRD functional requirements
- **Address specific user goals** mentioned in the project context
- **Consider platform-appropriate patterns** for the chosen technology

### Architecture Integration:
- **Reference actual components** from architectureData for interface planning
- **Consider data visualization** needs based on data flows
- **Plan for real-time features** if present in architecture
- **Address integration touchpoints** for external services

### Platform Adaptation:
- **Generate web-specific guidelines** for web applications (responsive, SEO, browser support)
- **Create mobile-specific standards** for mobile apps (touch targets, platform guidelines)
- **Adapt component specifications** to the chosen technology stack
- **Include performance considerations** appropriate for the platform

### Actionable Documentation:
- **Provide specific specifications** (colors, sizes, spacings) not just general advice
- **Include implementation guidance** for developers
- **Create measurable quality standards** for design validation
- **Establish clear approval processes** for design decisions

Generate comprehensive UI/UX documentation that serves as the definitive guide for all design and user experience decisions throughout the development process.
`
const prompt = PromptTemplate.fromTemplate(template);
const chain = prompt.pipe(llm).pipe(new StringOutputParser());
const result = await chain.invoke({architectureData: JSON.stringify(architectureData), planContent: plan, prd: prd});
return result;
}
 
export async function generateDocsWithStreaming(
  messages: any[],
  architectureData: any,
  onUpdate: StreamingUpdateCallback
) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const llm = new ChatOpenAI({ openAIApiKey: openaiKey });

  try {
    // Step 1: Generate number of phases
    onUpdate("phases_analysis.json", "Analyzing project complexity and determining phases...", false);
    
    const numOfPhase = await numberOfPhases(messages, architectureData);
    let cleanedNumOfPhase = numOfPhase;
    if (typeof numOfPhase === 'string') {
      cleanedNumOfPhase = numOfPhase
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/, '')
        .replace(/\s*```\s*$/, '')
        .trim();
    }
    
    const parsedPhasesDetails = typeof cleanedNumOfPhase === 'string' 
      ? JSON.parse(cleanedNumOfPhase) 
      : cleanedNumOfPhase;
    
    onUpdate("phases_analysis.json", JSON.stringify(parsedPhasesDetails, null, 2), true);

    // Step 2: Generate PRD with streaming
    onUpdate("PRD.md", "# Product Requirements Document\n\nGenerating product requirements...", false);
    
    const prd = await generatePRDStreaming(messages, architectureData, parsedPhasesDetails.numberOfPhases, parsedPhasesDetails.phases, onUpdate);
    
    // Step 3: Generate Project Structure with streaming
    onUpdate("Docs/Project_Structure.md", "# Project Structure\n\nGenerating project structure...", false);
    
    const projectStructure = await generateProjectStructureStreaming(architectureData, prd, onUpdate);
    
    // Step 4: Generate UI/UX with streaming
    onUpdate("Docs/UI_UX.md", "# UI/UX Documentation\n\nGenerating UI/UX guidelines...", false);
    
    const uiUX = await generateUIUXStreaming(architectureData, prd, onUpdate);

    // Step 5: Generate all phases with streaming
    const allPhases: string[] = [];
    
    for (let i = 1; i <= Number(parsedPhasesDetails.numberOfPhases); i++) {
      onUpdate(`Phases/Phase_${i}.md`, `# Phase ${i}\n\nGenerating phase ${i} documentation...`, false);
      
      const nthPhase = await generateNthPhaseStreaming(architectureData, i.toString(), parsedPhasesDetails.phases, prd, parsedPhasesDetails.numberOfPhases, onUpdate, i);
      allPhases.push(nthPhase);
    }

    return {
      phaseCount: Number(parsedPhasesDetails.numberOfPhases),
      phases: allPhases,
      prd,
      projectStructure,
      uiUX,
      projectRules: "" // This can be generated separately if needed
    };

  } catch (error) {
    console.error('Error in streaming generation:', error);
    onUpdate("error.log", `Error: ${error instanceof Error ? error.message : 'Unknown error'}`, true);
    throw error;
  }
}

// Streaming version of generatePRD
export async function generatePRDStreaming(
  conversationHistory: any[] = [],
  architectureData: any,
  numOfPhase: string,
  phaseDetails: string,
  onUpdate: StreamingUpdateCallback
) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const llm = new ChatOpenAI({ 
    openAIApiKey: openaiKey,
    streaming: true,
    temperature: 0.7
  });

  const template = `
    # Product Requirements Document (PRD) Generation Agent

You are an expert product manager specializing in creating comprehensive Product Requirements Documents for software products. Your task is to analyze the project conversation, architecture, and development phases to generate a detailed, professional PRD that serves as the complete specification for developers and stakeholders.

## Input Data:
- **Conversation History:** {conversation_history}
- **Architecture Details:** {architecture_data}
- **Number of Phases:** {numberOfPhases}
- **Phase Details:** {phaseDetails}

## Analysis Instructions:

### Step 1: Extract Core Product Information
From the conversation history and architecture, identify:
- **Product concept and main purpose**
- **Target users and their primary needs**
- **Core value proposition**
- **Key business objectives**
- **Technical platform (web app/mobile app)**
- **Essential vs nice-to-have features**

### Step 2: Architecture Analysis
From the architecture_data, understand:
- **Technology stack and components**
- **System complexity and integrations**
- **Data flow and storage requirements**
- **Third-party service dependencies**
- **Security and performance considerations**

### Step 3: Phase Integration
Use the numberOfPhases and phaseDetails to:
- **Map features to development phases**
- **Create realistic timeline estimates**
- **Identify phase dependencies and milestones**
- **Structure feature priorities based on phase sequence**

## PRD Generation Guidelines:

### Content Quality Standards:
- **Be Specific:** Avoid generic placeholders - use actual project details
- **Be Actionable:** Every requirement should be implementable
- **Be Measurable:** Include specific acceptance criteria and success metrics
- **Be Complete:** Cover all aspects needed for development
- **Be Realistic:** Align with the project's actual scope and complexity

### Platform-Specific Considerations:
**For Web Applications:**
- Focus on browser compatibility, responsive design, and web performance
- Include SEO considerations if applicable
- Address Progressive Web App features if relevant

**For Mobile Applications:**
- Specify iOS/Android requirements and versions
- Include app store guidelines and approval processes
- Address offline functionality and device-specific features

### Technical Accuracy:
- **Technology Stack:** Use actual technologies from architecture_data
- **Integration Details:** Reference specific APIs and services mentioned
- **Performance Requirements:** Set realistic metrics based on app complexity
- **Security Requirements:** Match the sensitivity of data being handled



## PRD Structure Requirements:

Follow the provided template structure exactly, but fill with project-specific content:

1. **Document Information:** Use actual product name and current date
2. **Executive Summary:** Write compelling, specific overview of the product
3. **MVP Vision & Strategy:** Define clear problem statement and solution
4. **User Assumptions:** Create realistic user profiles based on product concept
5. **Platform Specifications:** Detailed technical requirements for chosen platform
6. **MVP Functional Requirements:** Comprehensive feature specifications with acceptance criteria
7. **Technical Architecture:** Detailed system design based on architecture_data
8. **User Experience & Design:** Specific UX/UI requirements for the product type

### Section Dependencies & Assumptions:
- Reference specific architecture components that create dependencies
- Include third-party service dependencies from architecture_data
- Mention technical risks based on chosen technology stack

### Feature Documentation:
- **Write detailed user stories** for each core feature
- **Include specific acceptance criteria** that developers can implement
- **Map features to development phases** for logical progression
- **Prioritize features** as Must-Have, Nice-to-Have, or Out-of-Scope

### Technical Specifications:
- **Use actual technology names** from the architecture
- **Include specific integration requirements** for third-party services
- **Define data models and relationships** based on app functionality
- **Specify performance and security requirements** appropriate for the product


## Output Requirements:

Generate a complete PRD document that:
- **Follows the exact template structure** provided
- **Contains no placeholder text** - all sections filled with project-specific content
- **Is immediately actionable** for developers and stakeholders
- **Accurately reflects** the conversation history and technical architecture
- **Integrates seamlessly** with the defined development phases
- **Provides clear guidance** for successful product development

## Quality Validation:

Before generating the PRD, ensure:
- All technical details match the architecture_data
- User stories align with the product concept from conversation
- Timeline and phases are logically sequenced
- Success metrics are measurable and relevant
- Feature requirements are complete and testable
- Platform specifications match the intended deployment

Generate a comprehensive, professional PRD that serves as the definitive guide for building this specific product, incorporating all provided context and technical details.`
  const prompt = PromptTemplate.fromTemplate(template);
  const formattedHistory = conversationHistory.map(msg => 
    `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
  ).join('\n');

  let accumulatedContent = "";
  
  const stream = await llm.stream(await prompt.format({
    conversation_history: formattedHistory,
    architecture_data: JSON.stringify(architectureData),
    numberOfPhases: numOfPhase,
    phaseDetails: typeof phaseDetails !== 'string' ? JSON.stringify(phaseDetails) : phaseDetails
  }));

  for await (const chunk of stream) {
    accumulatedContent += chunk.content;
    onUpdate("PRD.md", accumulatedContent, false);
  }

  onUpdate("PRD.md", accumulatedContent, true);
  return accumulatedContent;
}

// Streaming version of generatePlan
export async function generatePlanStreaming(
  conversationHistory: any[] = [],
  architectureData: any,
  numOfPhase: string,
  phaseDetails: string,
  prd: string,
  onUpdate: StreamingUpdateCallback
) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const llm = new ChatOpenAI({ 
    openAIApiKey: openaiKey,
    streaming: true,
    temperature: 0.7
  });
 
  const template = `# Development Plan Document (PLAN.md) Generation Agent

You are an expert technical project manager and software architect specializing in creating comprehensive development execution plans. Your task is to analyze the project requirements, architecture, and phases to generate a detailed PLAN.md that serves as the definitive execution guide for coding assistants and development teams.

## Input Data:
- **Conversation History:** {conversation_history}
- **Architecture Details:** {architecture_data}
- **Number of Phases:** {numberOfPhases}
- **Phase Details:** {phaseDetails}
- **Product Requirements Document:** {prd}

## Analysis Instructions:

### Step 1: Extract Development Context
From all inputs, identify:
- **Core product concept and technical complexity**
- **Technology stack and architectural patterns**
- **Development methodology requirements**
- **Key technical challenges and risks**
- **Integration points and dependencies**
- **Quality and performance requirements**

### Step 2: Architecture-Driven Planning
From architecture_data, understand:
- **Component relationships and dependencies**
- **Data flow and storage patterns**
- **External service integrations**
- **Security and performance considerations**
- **Deployment and infrastructure needs**

### Step 3: Phase Integration Analysis
Use phaseDetails to:
- **Map technical components to phases**
- **Identify cross-phase dependencies**
- **Establish phase entry/exit criteria**
- **Define deliverables and success metrics**

## PLAN.md Structure Requirements:

### 1. Development Execution Overview
- **Development Strategy:** High-level approach and methodology
- **Technical Architecture Summary:** Key architectural decisions and rationale
- **Development Workflow:** How the team should approach implementation
- **Quality Assurance Strategy:** Testing approach and quality gates

### 2. Technical Implementation Strategy
- **Code Organization:** Folder structure and file organization principles
- **Naming Conventions:** Consistent naming across components, functions, and variables
- **Coding Standards:** Language-specific best practices and style guidelines
- **Database Design Strategy:** Schema evolution and data management approach
- **API Design Principles:** RESTful design, versioning, and documentation standards

### 3. Integration & Testing Strategy
- **Component Integration Plan:** How different architecture components connect
- **Testing Methodology:** Unit, integration, and end-to-end testing approach
- **Quality Gates:** Acceptance criteria and validation checkpoints
- **Performance Testing:** Load testing and optimization strategies
- **Security Testing:** Security validation and penetration testing approach

### 4. Development Environment Setup
- **Required Tools:** Development tools, IDEs, and utilities
- **Dependencies Management:** Package managers and version control
- **Environment Configuration:** Local, development, and staging environments
- **Database Setup:** Local database configuration and seed data
- **Third-Party Services:** API keys, service configurations, and testing accounts

### 5. Risk Management & Technical Challenges
- **Technical Risks:** Potential technical bottlenecks and challenges
- **Mitigation Strategies:** Alternative approaches and fallback plans
- **Third-Party Dependencies:** External service risks and alternatives
- **Performance Bottlenecks:** Anticipated performance issues and solutions
- **Security Considerations:** Security risks and implementation guidelines

### 6. Communication & Handoff Protocols
- **Deliverable Standards:** What constitutes completed work for each phase
- **Documentation Requirements:** Code documentation and technical specifications
- **Code Review Process:** Review standards and approval workflows
- **Knowledge Transfer:** Information sharing between development phases
- **Progress Tracking:** Status reporting and milestone validation

### 7. Success Metrics & Validation
- **Technical Validation Criteria:** How to verify technical implementation
- **Performance Benchmarks:** Expected performance metrics and thresholds
- **User Acceptance Validation:** Testing with real users and feedback collection
- **Launch Readiness Checklist:** Final validation before production deployment

## Critical Requirements:

### MUST Include Development Phases Progress Table:

| Phase | Key Deliverables | Success Criteria | Status |
|-------|------------------|------------------|--------|
| [Use exact phase names from phaseDetails] | [Specific technical deliverables] | [Measurable validation criteria] | NOT STARTED |


**Table Requirements:**
- **Make sure all are marked as NOT STARTED**
- **Use exact phase names** from phaseDetails input
- **Key Deliverables** must be specific, technical outcomes
- **Success Criteria** must be measurable and testable
- **Status column** shows "NOT STARTED" for all phases initially ** MOST IMPORTANT **
- **Cover all phases** from numberOfPhases and phaseDetails

### Critical Dependencies & Assumptions Section:
- **Architecture Dependencies:** Components that must be built before others
- **Third-Party Service Dependencies:** External services from architecture_data
- **Technical Risk Factors:** Challenges based on chosen technology stack
- **Development Assumptions:** Key assumptions that could impact timeline

### Technical Implementation Guidelines:
- **Use actual technology names** from architecture_data
- **Reference specific components** and their integration requirements
- **Include data models and relationships** based on architecture
- **Specify performance requirements** appropriate for the system complexity
- **Define security implementation** standards for the application type

## Content Quality Standards:

### Be Development-Focused:
- **Actionable for developers:** Every section should guide actual development work
- **Technically specific:** Use exact technologies, frameworks, and tools
- **Implementation-ready:** Provide concrete guidance for coding decisions
- **Quality-oriented:** Include standards for code quality and testing

### Be Architecture-Aligned:
- **Reflect actual system design** from architecture_data
- **Address real technical challenges** identified in the architecture
- **Support chosen technology stack** with appropriate methodologies
- **Enable successful integration** of all architectural components

### Be Phase-Aware:
- **Support phase-based development** approach
- **Enable smooth transitions** between development phases
- **Provide clear validation** criteria for each phase completion
- **Facilitate parallel development** where architecturally possible

## Output Requirements:

Generate a comprehensive PLAN.md document that:
- **Serves as the primary execution guide** for all development work
- **Contains no placeholder text** - all sections filled with project-specific content
- **Is immediately actionable** for coding assistants and developers
- **Accurately reflects** the technical architecture and requirements
- **Provides clear quality standards** and validation criteria
- **Enables successful project execution** from start to deployment

The PLAN.md should be the go-to document that any coding assistant can reference to understand how to build this specific product according to the established architecture, standards, and methodology.`
  const prompt = PromptTemplate.fromTemplate(template);
  const formattedHistory = conversationHistory.map(msg => 
    `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
  ).join('\n');

  let accumulatedContent = "";
  
  const stream = await llm.stream(await prompt.format({
    conversation_history: formattedHistory,
    architecture_data: JSON.stringify(architectureData),
    numberOfPhases: numOfPhase,
    phaseDetails: typeof phaseDetails !== 'string' ? JSON.stringify(phaseDetails) : phaseDetails,
    prd: prd
  }));

  for await (const chunk of stream) {
    accumulatedContent += chunk.content;
    onUpdate("PLAN.md", accumulatedContent, false);
  }

  onUpdate("PLAN.md", accumulatedContent, true);
  return accumulatedContent;
}

// Streaming version of generateProjectStructure
export async function generateProjectStructureStreaming(
  architectureData: any,
  prd: string,
  onUpdate: StreamingUpdateCallback
) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const llm = new ChatOpenAI({ 
    openAIApiKey: openaiKey,
    streaming: true,
    temperature: 0.7
  });

  const template = `
  # Project Structure Document Generator

You are an expert software architect specializing in creating comprehensive project structure documentation. Your task is to analyze the project requirements and architecture to generate a detailed Project_Structure.md that defines the complete file organization, folder hierarchy, and structural guidelines for the development team.

## INPUT DATA:
- **Project Architecture:** {architectureData}
- **PRD:** {prd}

## ANALYSIS INSTRUCTIONS:

### Step 1: Platform & Technology Analysis
From the inputs, identify:
- **Platform type**: Web application, mobile app (iOS/Android/React Native), or hybrid
- **Technology stack**: Primary frameworks, languages, and tools from architectureData
- **Project complexity**: Number of components, integrations, and features
- **Development approach**: Monorepo, microservices, or traditional structure
- **Build tools and configuration requirements**

### Step 2: Architecture-Driven Structure Design
Based on architectureData components:
- **Map components to folder structure**: Each architectural component should have a logical place
- **Plan integration points**: Where external services and APIs will be organized
- **Design data flow organization**: How models, types, and data structures will be arranged
- **Establish component relationships**: Parent-child and sibling component organization

### Step 3: Development Workflow Integration
From architectureData and PRD, understand:
- **Phase-based development needs**: Structure that supports incremental development
- **Team collaboration requirements**: Clear separation of concerns for multiple developers
- **Testing and quality assurance structure**: Where tests, docs, and quality tools live
- **Deployment and build artifact organization**

## PROJECT STRUCTURE REQUIREMENTS:

### Generate Complete Folder Hierarchy
Create a comprehensive folder structure that includes:
- **Root level organization** with clear purpose for each top-level directory
- **Source code organization** appropriate for the chosen technology stack
- **Component and feature organization** that matches the architectural design
- **Asset and resource management** for styles, images, configs, and static files
- **Documentation structure** for all project documentation
- **Testing organization** for unit, integration, and end-to-end tests
- **Build and deployment structure** for configuration and deployment files

### Technology-Specific Adaptations
**For Web Applications:**
- Modern web framework structure (Next.js, React, Vue, Angular, etc.)
- Public/static asset organization
- API routes and server-side code structure
- Component library and design system organization

**For Mobile Applications:**
- Platform-specific folders (iOS/Android if native, or unified if React Native/Flutter)
- Asset organization for different screen densities
- Platform-specific configuration and build files
- Component and screen organization

**For Full-Stack Applications:**
- Clear separation between frontend and backend (if applicable)
- Shared types and utilities organization
- Database schema and migration structure
- API and service layer organization

## OUTPUT FORMAT:

***markdown
# Project Structure Documentation

## Overview
[Brief description of the project structure philosophy and organization principles based on the project type and architecture]

## Root Directory Structure


[PROJECT_NAME]/
├── [Generate complete folder hierarchy with explanations]
│   ├── [Subfolder with purpose explanation]
│   │   ├── [Files and nested structure]
│   │   └── [More specific organization]
│   ├── [Another major section]
│   └── [Continue with full structure]
├── [Configuration files at root level]
├── [Documentation and project files]
└── [Build and deployment files]


## Directory Descriptions

### [Major Directory 1]
**Purpose:** [What this directory contains and why]
**Contents:** [What types of files go here]
**Naming Convention:** [How files should be named in this directory]
**Usage Guidelines:** [When and how to use this directory]

### [Major Directory 2]
[Continue for all major directories...]

## File Organization Guidelines

### Component Organization
[Specific rules for organizing components based on the architecture]
- [Guideline based on project type]
- [Another guideline specific to the tech stack]
- [Rules for component co-location]

### Feature-Based Organization
[How features should be structured based on the PRD requirements]
- [Feature folder structure]
- [Shared vs feature-specific code organization]
- [Cross-feature dependency management]

### Asset Management
[How to organize static assets, styles, and resources]
- [Image and media file organization]
- [Stylesheet and design system structure]
- [Configuration and environment file placement]

## Naming Conventions

### Files
- [Specific naming rules for different file types]
- [Case conventions (camelCase, kebab-case, PascalCase)]
- [Extension and suffix rules]

### Folders
- [Directory naming standards]
- [Hierarchy and nesting rules]
- [Special folder naming conventions]

### Components/Modules
- [Component naming based on the technology stack]
- [Export and import naming standards]
- [Interface and type naming conventions]

## Technology-Specific Guidelines

### [Primary Technology/Framework]
[Specific guidelines for the main technology stack]
- [Framework-specific folder requirements]
- [Configuration file placement]
- [Best practices for the chosen stack]

### Dependencies & Package Management
- [Where to place package configuration files]
- [How to organize installed dependencies]
- [Custom package and module organization]

### Build & Deployment
- [Build artifact organization]
- [Configuration file structure]
- [Environment-specific file placement]

## Development Workflow Integration

### Phase-Based Development
[How the structure supports the development phases from planContent]
- [Where phase-specific files should be placed]
- [How to organize work-in-progress vs completed features]

### Testing Structure
- [Unit test placement and organization]
- [Integration test structure]
- [End-to-end test organization]
- [Test utility and helper organization]

### Documentation Organization
- [Where different types of documentation live]
- [API documentation structure]
- [Component documentation placement]

## Critical Rules

### File Creation Guidelines
- **Always check this structure** before creating new files or folders
- **Follow naming conventions** consistently throughout the project
- **Maintain feature isolation** - keep related files together
- **Separate concerns** - don't mix different types of code in the same directory

### Folder Management
- **Don't create new top-level directories** without updating this documentation
- **Group related functionality** in appropriate subdirectories
- **Keep flat structures** where possible to avoid deep nesting
- **Use descriptive names** that clearly indicate purpose

### Maintenance Guidelines
- **Update this document** when adding new major features or changing structure
- **Refactor organization** if folders become too large or unwieldy
- **Document exceptions** if deviating from standard structure for specific reasons
- **Review structure** regularly to ensure it still serves the project needs

## Common Patterns

### Import/Export Patterns
[How to structure imports and exports based on the folder organization]

### Code Co-location
[When to keep related files together vs when to separate them]

### Shared vs Feature-Specific
[Guidelines for deciding where shared code should live]

---

*This structure is designed to support the project architecture and development workflow. Always consult this document before making structural changes.*


## GENERATION REQUIREMENTS:

### Structure Accuracy:
- **Technology Appropriate**: Use folder structures that match the actual technology stack
- **Architecture Aligned**: Ensure structure supports all components in architectureData
- **Scalable Design**: Structure should grow with the project without major reorganization
- **Team Friendly**: Clear separation that allows multiple developers to work simultaneously

### Documentation Quality:
- **Be Specific**: Include exact folder names and file placement rules
- **Be Comprehensive**: Cover all aspects of project organization
- **Be Actionable**: Provide clear guidelines that developers can follow immediately
- **Be Maintainable**: Structure that can evolve with the project

### Platform Considerations:
- **Web Apps**: Include public assets, API routes, components, pages, and build files
- **Mobile Apps**: Include platform-specific folders, assets for different densities, and build configurations
- **Full-Stack**: Clear frontend/backend separation with shared utilities and types

Generate a comprehensive Project_Structure.md that serves as the rough guide for all file and folder organization decisions throughout the development process.
`
  const prompt = PromptTemplate.fromTemplate(template);

  let accumulatedContent = "";
  
  const stream = await llm.stream(await prompt.format({
    architectureData: JSON.stringify(architectureData),
    prd: prd
  }));

  for await (const chunk of stream) {
    accumulatedContent += chunk.content;
    onUpdate("Docs/Project_Structure.md", accumulatedContent, false);
  }

  onUpdate("Docs/Project_Structure.md", accumulatedContent, true);
  return accumulatedContent;
}

// Streaming version of generateUIUX
export async function generateUIUXStreaming(
  architectureData: any,
  prd: string,
  onUpdate: StreamingUpdateCallback
) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const llm = new ChatOpenAI({ 
    openAIApiKey: openaiKey,
    streaming: true,
    temperature: 0.7
  });

  const template = `
# UI/UX Documentation Generator

You are an expert UI/UX designer and user experience strategist specializing in creating comprehensive design documentation. Your task is to analyze the project requirements and architecture to generate a detailed UI_UX.md that defines design standards, user flows, and interface guidelines for the development team.

## INPUT DATA:
- **Project Architecture:** {architectureData}
- **PRD:** {prd}

## ANALYSIS INSTRUCTIONS:

### Step 1: User Experience Foundation Analysis
From PRD and project context, identify:
- **Target user personas** and their specific needs and behaviors
- **Primary user goals** and core value propositions
- **Platform characteristics** (web responsive, mobile native, hybrid)
- **Accessibility requirements** and compliance standards
- **Business objectives** that drive design decisions

### Step 2: Architecture-Driven Interface Planning
Based on architectureData components:
- **User interface touchpoints** for each architectural component
- **Data visualization needs** based on data flows and storage
- **Integration interface requirements** for external services
- **Real-time update patterns** for dynamic components
- **Error handling and feedback mechanisms** for system interactions

### Step 3: User Journey & Flow Mapping
From PRD features and user stories:
- **Core user workflows** that accomplish primary objectives
- **Alternative paths** and edge cases users might encounter
- **Cross-feature navigation patterns** and information architecture
- **Onboarding and first-time user experience flows**
- **Error recovery and help-seeking behaviors**

## UI/UX DOCUMENTATION REQUIREMENTS:

### Design System Foundation
Create comprehensive guidelines covering:
- **Visual design principles** aligned with project goals and user needs
- **Component library specifications** with consistent patterns
- **Responsive design standards** appropriate for the platform
- **Accessibility compliance** meeting WCAG standards
- **Performance considerations** for optimal user experience

### Platform-Specific Considerations
**For Web Applications:**
- Responsive breakpoints and mobile-first design
- Browser compatibility and progressive enhancement  
- SEO and semantic markup requirements
- Loading states and progressive disclosure patterns

**For Mobile Applications:**
- Platform design guidelines (iOS Human Interface/Material Design)
- Touch target sizes and gesture interactions
- Device-specific considerations (screen sizes, orientations)
- Native vs custom component usage

**For Cross-Platform:**
- Consistency across platforms while respecting native patterns
- Shared design tokens and component specifications
- Platform-specific adaptations and exceptions

## OUTPUT FORMAT:

markdown
# UI/UX Design Documentation

## Design Philosophy & Principles

### Core Design Principles
[Extract and articulate design principles based on project goals and user needs]
1. **[Principle Name]:** [Description of how it applies to this specific project]
2. **[Another Principle]:** [Specific application and reasoning]
3. **[Third Principle]:** [Context-specific explanation]

### User-Centered Design Approach
[Describe the approach based on target users from PRD]
- **Primary User Focus:** [Specific user type and their key needs]
- **Design Priorities:** [What matters most for these users]
- **Success Metrics:** [How design success will be measured]

## User Experience Architecture

### Information Architecture
[Organize content and features based on PRD requirements]

[Generate site map or app structure showing:]
├── [Primary Navigation Areas]
│   ├── [Core Feature Sections]
│   │   ├── [Sub-features and content]
│   │   └── [Related functionality]
│   └── [Secondary Features]
├── [User Account Areas] 
└── [Administrative/Settings Areas]


### Navigation Patterns
[Define navigation based on platform and architecture]
- **Primary Navigation:** [Main navigation structure and behavior]
- **Secondary Navigation:** [Contextual and sub-navigation patterns]
- **Breadcrumbs:** [When and how to implement hierarchical navigation]
- **Deep Linking:** [URL structure and direct access patterns]

## Core User Flows

### [Primary User Flow 1]
**Objective:** [What the user wants to accomplish based on PRD user stories]
**Entry Points:** [How users access this flow]
**Steps:**
1. [Specific screen/page] → [User action] → [System response]
2. [Next screen/state] → [User interaction] → [Feedback/result]
3. [Continue mapping complete flow...]

**Success Criteria:** [How user knows they've succeeded]
**Error Handling:** [What happens when things go wrong]
**Alternative Paths:** [Other ways to accomplish the same goal]

### [Primary User Flow 2]
[Repeat for all core workflows identified in PRD]

### [Additional Core Flows]
[Continue for all essential user journeys]

## Component Design System

### UI Component Standards

#### Buttons
- **Primary Button:** [Style specs, when to use, examples]
- **Secondary Button:** [Style specs, usage guidelines]
- **Icon Buttons:** [Specifications and accessibility requirements]
- **Button States:** [Hover, active, disabled, loading states]

#### Forms & Inputs
- **Text Inputs:** [Style, validation states, error handling]
- **Select/Dropdown:** [Behavior, options presentation, search]
- **Checkboxes & Radio:** [Visual design and interaction patterns]
- **Form Validation:** [Real-time vs submit validation, error messaging]

#### Data Display
- **Tables:** [Responsive behavior, sorting, filtering, pagination]
- **Cards:** [Content organization, actions, responsive behavior]
- **Lists:** [Item structure, actions, empty states]
- **Charts/Graphs:** [If data visualization is needed from architectureData]

#### Navigation Components
- **Header/Navigation Bar:** [Structure, responsive behavior, active states]
- **Sidebar:** [When to use, collapse behavior, responsive treatment]
- **Tabs:** [Style, behavior, responsive stacking]
- **Pagination:** [Style and interaction patterns]

#### Feedback Components
- **Alerts/Notifications:** [Types, positioning, dismissal, persistence]
- **Loading States:** [Spinners, skeletons, progress indicators]
- **Empty States:** [When no content exists, helpful guidance]
- **Error States:** [Error presentation and recovery options]

### Layout & Grid System
[Define layout standards based on platform]
- **Grid System:** [Column structure, gutters, responsive behavior]
- **Spacing Scale:** [Consistent spacing units and application]
- **Container Widths:** [Maximum widths and responsive breakpoints]
- **Content Areas:** [Main content, sidebars, headers, footers]

## Visual Design Standards

### Typography
- **Font Family:** [Primary and fallback fonts]
- **Type Scale:** [Heading hierarchy, body text, captions]
- **Line Height & Spacing:** [Readable line heights and paragraph spacing]
- **Font Weights:** [When to use different weights]

### Color System
- **Primary Colors:** [Brand colors with hex values and usage]
- **Secondary Colors:** [Supporting palette and applications]
- **Semantic Colors:** [Success, warning, error, info colors]
- **Neutral Colors:** [Grays for text, borders, backgrounds]
- **Accessibility:** [Contrast ratios and compliance notes]

### Iconography
- **Icon Style:** [Outline, filled, or mixed approach]
- **Icon Sizes:** [Standard sizes and scaling rules]
- **Icon Usage:** [When and how to use icons effectively]
- **Custom vs Library:** [Whether using icon library or custom icons]

## Responsive Design Guidelines

### Breakpoint Strategy
[Define breakpoints based on platform needs]
- **Mobile:** [< XXXpx] - [Specific layout adaptations]
- **Tablet:** [XXX-XXXpx] - [Layout changes and interactions]
- **Desktop:** [> XXXpx] - [Full-featured layout]

### Component Responsive Behavior
[How key components adapt across screen sizes]
- **Navigation:** [Mobile menu, desktop navigation differences]
- **Data Tables:** [Scrolling, stacking, hiding columns]
- **Forms:** [Layout changes, input sizing]
- **Content Areas:** [Sidebar behavior, content reflow]

## Accessibility Standards

### Compliance Requirements
- **WCAG Level:** [AA or AAA compliance target]
- **Keyboard Navigation:** [Tab order, focus indicators, shortcuts]
- **Screen Reader Support:** [ARIA labels, semantic HTML, alt text]
- **Color Accessibility:** [Contrast requirements, color-blind considerations]

### Inclusive Design Practices
- **Motor Accessibility:** [Touch target sizes, click areas]
- **Cognitive Load:** [Simple language, clear instructions, error prevention]
- **Language Support:** [Internationalization considerations if applicable]

## Interaction Design Patterns

### Micro-Interactions
[Based on architecture components and real-time features]
- **Button Feedback:** [Hover, click, loading states]
- **Form Interactions:** [Validation feedback, input focus]
- **Data Loading:** [Progressive loading, skeleton screens]
- **Status Updates:** [Real-time notifications, activity indicators]

### Animation Guidelines
- **Motion Principles:** [When and why to use animation]
- **Duration & Easing:** [Timing functions and duration standards]
- **Performance:** [Hardware acceleration, reduced motion preferences]

## Platform-Specific Guidelines

### [Web Application Specific]
[Include only if it's a web app]
- **Browser Support:** [Minimum supported versions]
- **Progressive Enhancement:** [Baseline vs enhanced experiences]
- **SEO Considerations:** [Meta tags, semantic structure]
- **Performance Budget:** [Page load times, image optimization]

### [Mobile Application Specific]
[Include only if it's a mobile app]
- **Platform Guidelines:** [iOS/Android specific patterns]
- **Touch Interactions:** [Gestures, swipe patterns, long press]
- **Device Features:** [Camera, location, notifications integration]
- **App Store Guidelines:** [Screenshot requirements, icon specs]

## Quality Assurance & Testing

### Design QA Checklist
- [ ] All components match design system specifications
- [ ] Responsive behavior works across all breakpoints
- [ ] Accessibility standards are met
- [ ] Loading and error states are implemented
- [ ] User flows work as designed
- [ ] Cross-browser/platform compatibility verified

### Usability Testing Guidelines
- **Testing Scenarios:** [Key user tasks to validate]
- **Success Metrics:** [How to measure usability success]
- **Feedback Collection:** [Methods for gathering user feedback]

## Implementation Guidelines

### Developer Handoff Requirements
- **Design Assets:** [What files/specifications developers need]
- **Component Documentation:** [Props, states, usage examples]
- **Responsive Specifications:** [Exact breakpoint behaviors]
- **Animation Specifications:** [Timing, easing, triggers]

### Quality Gates
- **Design Review Checkpoints:** [When design review is required]
- **Component Approval Process:** [How new components get approved]
- **Accessibility Testing:** [Required accessibility checks]
- **Cross-Platform Testing:** [Platform-specific validation requirements]

---

*This UI/UX documentation must be consulted before implementing any visual elements or user interactions. All design decisions should align with these established patterns and principles.*


## GENERATION REQUIREMENTS:

### User-Centered Focus:
- **Extract actual user types** from PRD user assumptions and stories
- **Map real user flows** based on PRD functional requirements
- **Address specific user goals** mentioned in the project context
- **Consider platform-appropriate patterns** for the chosen technology

### Architecture Integration:
- **Reference actual components** from architectureData for interface planning
- **Consider data visualization** needs based on data flows
- **Plan for real-time features** if present in architecture
- **Address integration touchpoints** for external services

### Platform Adaptation:
- **Generate web-specific guidelines** for web applications (responsive, SEO, browser support)
- **Create mobile-specific standards** for mobile apps (touch targets, platform guidelines)
- **Adapt component specifications** to the chosen technology stack
- **Include performance considerations** appropriate for the platform

### Actionable Documentation:
- **Provide specific specifications** (colors, sizes, spacings) not just general advice
- **Include implementation guidance** for developers
- **Create measurable quality standards** for design validation
- **Establish clear approval processes** for design decisions

Generate comprehensive UI/UX documentation that serves as the definitive guide for all design and user experience decisions throughout the development process.
`
  const prompt = PromptTemplate.fromTemplate(template);

  let accumulatedContent = "";
  
  const stream = await llm.stream(await prompt.format({
    architectureData: JSON.stringify(architectureData),
    prd: prd
  }));

  for await (const chunk of stream) {
    accumulatedContent += chunk.content;
    onUpdate("Docs/UI_UX.md", accumulatedContent, false);
  }

  onUpdate("Docs/UI_UX.md", accumulatedContent, true);
  return accumulatedContent;
}

// Streaming version of generateNthPhase
export async function generateNthPhaseStreaming(
  architectureData: any,
  numOfPhase: string,
  phaseDetails: string,
  prd: string,
  totalPhases: string,
  onUpdate: StreamingUpdateCallback,
  phaseIndex: number
) {
  const openaiKey = process.env.OPENAI_API_KEY;
  const llm = new ChatOpenAI({ 
    openAIApiKey: openaiKey,
    streaming: true,
    temperature: 0.7
  });

  const template = `# Phase Execution Plan Generator with Human Review Integration

You are an expert software development lead creating actionable execution plans for AI coding agents. Generate a focused phase execution document with a comprehensive todo list tailored specifically to the current phase requirements, including mandatory human review checkpoints.

## INPUT DATA:
- **Project Architecture:** {architectureData}  
- **Target Phase:** {phaseNumber}
- **Phase Details:** {phaseDetails}
- **PRD:** {prd}
- **Total Phases:** {totalPhases}

## ANALYSIS INSTRUCTIONS:

### Step 1: Phase Analysis
- Extract the specific objectives and scope for this phase from phaseDetails
- Identify which architecture components are being built in this phase
- Understand what features/functionality this phase delivers
- Determine the platform (web app/mobile app) and relevant technologies
- **Identify if this is first phase, middle phase, or final phase for human review requirements**

### Step 2: Task Generation Strategy
- Break down the phase objective into specific, actionable implementation tasks
- Generate tasks based on the actual technologies and components in architectureData
- Ensure tasks are appropriate for the platform (web/mobile) and tech stack
- Order tasks logically based on dependencies and development workflow
- Make each task granular enough for AI agents to execute independently
- **Include human review checkpoints at appropriate intervals**

### Step 3: Platform and Technology Adaptation
- Generate tasks specific to the chosen platform and technology stack
- Include appropriate file paths, naming conventions, and patterns for the tech stack
- Reference actual components, APIs, and integrations from the architecture
- Ensure tasks reflect real development work needed for this specific phase
- **Add human approval requirements based on phase position**

## OUTPUT FORMAT:

---
# PHASE {phaseNumber}: [Extract exact phase name from phaseDetails]

**STATUS:** NOT_STARTED

---

## 🎯 Phase Objective
[Extract the specific goal of this phase from phaseDetails - what exactly needs to be accomplished]

## 🎁 Key Deliverables
[Based on phase objective and architecture components, list 3-6 specific things that will be working after this phase:]
- [Specific feature/component that will be functional]
- [Specific API/service that will be operational]  
- [Specific user capability that will be enabled]
- [Specific integration that will be completed]

## 📋 Prerequisites
**Must be completed before starting:**

[If phaseNumber == 1:]
- [ ] Project setup completed and README.md reviewed
- [ ] Development environment configured according to architecture requirements
- [ ] All required dependencies and tools installed

[If phaseNumber > 1:]
- [ ] **HUMAN APPROVAL REQUIRED:** Phase {{phaseNumber-1}} must be reviewed and approved in HUMAN_REVIEW.md
- [ ] All deliverables from Phase {{phaseNumber-1}} tested and confirmed working
- [ ] Environment setup maintained and updated from previous phase
- [ ] All reported issues from Phase {{phaseNumber-1}} resolved

**⚠️ CRITICAL: DO NOT START THIS PHASE WITHOUT HUMAN APPROVAL OF PREVIOUS PHASE ⚠️**

## 🔄 Human Review Checkpoints

### Pre-Phase Validation
[If phaseNumber > 1:]
- [ ] **Verify Human Approval**: Check HUMAN_REVIEW.md for Phase {{phaseNumber-1}} approval status
- [ ] **Issues Resolution**: Confirm all human-reported issues from previous phase are resolved
- [ ] **Environment Validation**: Ensure previous phase deliverables are working in human's environment

### Mid-Phase Review (for complex phases)
[If phase has more than 12 tasks, add:]
- [ ] **Mid-Phase Check**: After completing 60% of tasks, request human validation of core functionality
- [ ] **Course Correction**: Address any human feedback before proceeding with remaining tasks

### End-Phase Review (MANDATORY)
- [ ] **Deliverable Testing**: Human must test all key deliverables listed above
- [ ] **Environment Setup**: Human must follow updated README.md and configure .env variables
- [ ] **Functionality Validation**: Human must confirm all features work as expected
- [ ] **Issue Reporting**: Human must document any problems in HUMAN_REVIEW.md
- [ ] **Final Approval**: Human must approve phase completion before moving forward

## ✅ Implementation Tasks

[Generate 8-20 specific, actionable tasks based on the phase requirements. Each task should:]
[- Start with - [ ] (unchecked)]
[- Include exact file paths appropriate for the technology stack]
[- Reference specific technologies from architectureData]
[- Be granular enough for AI agent execution]
[- Follow logical development sequence]
[- Include proper typing/interface specifications for typed languages]

### Core Development Tasks:
- [ ] [Specific task with exact file path and technology details]
- [ ] [Another specific task with implementation details]
- [ ] [Continue with all necessary tasks for this phase...]

### Documentation & Testing Tasks:
- [ ] Update README.md with new setup instructions for this phase
- [ ] Document all new environment variables and configuration requirements
- [ ] Create comprehensive testing instructions for human reviewer
- [ ] Update relevant documentation files with new features/components
- [ ] Add inline code documentation and comments for complex logic

### Human Review Preparation Tasks:
- [ ] **Create Human Testing Instructions**: Document step-by-step testing process for all deliverables
- [ ] **Update Environment Documentation**: Ensure all required .env variables are documented
- [ ] **Prepare Demo/Screenshots**: Create visual proof of functionality for human review
- [ ] **Validate Error Handling**: Test and document error scenarios human might encounter

## 🏁 Phase Completion Criteria

**This phase is complete when:**
- [ ] All implementation tasks above are checked off
- [ ] [Specific functional requirement works based on phase objective]
- [ ] [Specific technical requirement is met based on architecture]  
- [ ] [Specific validation criteria based on deliverables]
- [ ] README.md updated with current setup instructions
- [ ] All environment variables documented and tested

**⚠️ CRITICAL: HUMAN APPROVAL REQUIRED BEFORE MARKING COMPLETE ⚠️**

### Human Approval Requirements:
- [ ] **Human Environment Setup**: Human successfully followed README.md instructions
- [ ] **Human Functional Testing**: Human tested all key deliverables and confirmed they work
- [ ] **Human Issue Resolution**: All human-reported issues resolved completely
- [ ] **Human Documentation Review**: Human reviewed and approved updated documentation
- [ ] **Human Final Approval**: Human marked this phase as "APPROVED" in HUMAN_REVIEW.md

[If this is the final phase (phaseNumber == totalPhases):]
### 🎉 FINAL PHASE - COMPLETE PROJECT VALIDATION
**Additional Final Phase Requirements:**
- [ ] **Full Application Testing**: Human must test complete end-to-end functionality
- [ ] **Production Readiness**: Human must confirm application is deployment-ready
- [ ] **Documentation Completeness**: Human must validate all documentation is comprehensive
- [ ] **Final Project Approval**: Human must provide final project sign-off in HUMAN_REVIEW.md

**⚠️ ABSOLUTE REQUIREMENT: PROJECT NOT COMPLETE WITHOUT FINAL HUMAN APPROVAL ⚠️**

---
**COMPLETION STATUS:** NOT_STARTED

**HUMAN APPROVAL STATUS:** PENDING

---

## 🚨 HUMAN REVIEW PROTOCOL

### When Phase Implementation is Complete:
1. **STOP**: Do not mark phase as complete
2. **NOTIFY HUMAN**: Request human review using this exact message:


🔄 PHASE {phaseNumber} COMPLETION - HUMAN REVIEW REQUIRED

Phase {phaseNumber} implementation is complete. I need your review and approval before proceeding.

DELIVERABLES TO TEST:
[List all key deliverables from above]

SETUP INSTRUCTIONS:
1. Follow updated README.md instructions
2. Configure .env variables as documented
3. Test each deliverable according to provided instructions

REQUIRED ACTION:
Update HUMAN_REVIEW.md with your test results and approval status.

❌ I CANNOT PROCEED UNTIL YOU APPROVE THIS PHASE


3. **WAIT**: Do not proceed until human approval is received
4. **FIX ISSUES**: If human reports problems, resolve them completely before requesting re-review
5. **FINAL APPROVAL**: Only mark phase complete after explicit human approval

### Issue Resolution Process:
If human reports issues:
1. **Document Issues**: Log all reported problems
2. **Analyze Problems**: Understand root causes  
3. **Implement Fixes**: Resolve all issues completely
4. **Re-test**: Validate fixes work properly
5. **Request Re-review**: Ask human to test again
6. **Repeat**: Continue until human approves

---

## TASK GENERATION REQUIREMENTS:

### Task Quality Standards:
- **Technology Specific:** Use actual technologies, frameworks, and tools from architectureData
- **Platform Appropriate:** Generate web-specific tasks for web apps, mobile-specific for mobile apps
- **Phase Focused:** Only include tasks necessary to complete THIS specific phase
- **Actionable:** Each task should be a specific action an AI can take
- **Granular:** Tasks should be completable in 15-30 minutes each
- **Sequential:** Order tasks logically based on development dependencies
- **Human-Testable:** Ensure deliverables can be easily tested by non-technical humans

### Task Content Requirements:
- **Exact File Paths:** Include precise file locations appropriate for the project structure
- **Specific Function/Component Names:** Reference actual names that will be created
- **Technology Integration:** Include framework-specific patterns and best practices
- **Type Specifications:** For typed languages, include interface/type requirements
- **API Specifications:** Include exact endpoint paths and method details where relevant
- **Testing Instructions:** Include how humans can verify each major component works

### Human Review Integration:
- **Prerequisites Checking:** Always verify previous phase approval before starting
- **Documentation Updates:** Always include README.md and environment setup updates
- **Testing Preparation:** Always include tasks for preparing human testing instructions
- **Approval Requirements:** Always include human approval as completion requirement

### Avoid These Patterns:
- Generic category headers like "Setup & Configuration" or "Frontend Development"
- Hardcoded quality standards that may not apply to all projects
- Platform assumptions (don't assume web if it's mobile, or vice versa)
- Technology assumptions not present in the architectureData
- Tasks unrelated to the specific phase objective
- **Proceeding without human approval from previous phases**
- **Marking phases complete without human validation**

## GENERATION PROCESS:

1. **Read phaseDetails** to understand exactly what this phase should accomplish
2. **Analyze architectureData** to identify relevant components and technologies
3. **Determine phase position** (first/middle/last) for appropriate human review requirements
4. **Determine platform type** (web/mobile) and generate appropriate tasks
5. **Create specific tasks** that directly contribute to the phase objective
6. **Add human review checkpoints** at appropriate intervals
7. **Order tasks logically** following natural development workflow including review points
8. **Validate task relevance** - ensure every task is necessary for this phase
9. **Include human approval requirements** based on phase position and complexity

Generate the complete phase execution plan now, ensuring all tasks are specific to this phase, platform, and technology stack, with appropriate human review integration based on the phase number and total phases.`
  const prompt = PromptTemplate.fromTemplate(template);

  let accumulatedContent = "";
  
  const stream = await llm.stream(await prompt.format({
    architectureData: JSON.stringify(architectureData),
    phaseNumber: numOfPhase,
    phaseDetails: typeof phaseDetails !== 'string' ? JSON.stringify(phaseDetails) : phaseDetails,
    prd: prd,
    totalPhases: totalPhases
  }));

  for await (const chunk of stream) {
    accumulatedContent += chunk.content;
    onUpdate(`Phases/Phase_${phaseIndex}.md`, accumulatedContent, false);
  }

  onUpdate(`Phases/Phase_${phaseIndex}.md`, accumulatedContent, true);
  return accumulatedContent;
}