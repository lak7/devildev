"use server"

import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";

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

export async function generateNthPhase(architectureData: any, plan: string, numOfPhase: string, phaseDetails: string, prd: string) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const llm = new ChatOpenAI({openAIApiKey: openaiKey})
    const template = `You are an expert software development lead creating actionable todo lists for AI coding agents. Generate a focused phase execution plan that an AI can follow step-by-step.

**INPUTS:**
- Project Plan: {planContent}
- Project Architecture: {architectureData}  
- Target Phase: {phaseNumber}
- Phase Details: {phaseDetails}
- PRD: {prd}

**OUTPUT FORMAT:**

---

# PHASE {phaseNumber} EXECUTION

## 🎯 Phase Goal
[Extract the specific goal from the project plan for this phase - 2-3 sentences max]

## 🎁 Deliverables
[List 3-5 specific, measurable outcomes that will exist after this phase:]
- [Specific feature/component that will work]
- [Specific API/endpoint that will be functional]
- [Specific file/directory that will be created]

## 📋 Prerequisites  
**Must be completed before starting:**
- [ ] [Specific prerequisite from previous phase]
- [ ] [Required setup or dependency]
- [ ] [Environment configuration needed]

## ✅ Implementation Todo List

### Setup & Configuration
- [ ] [Specific config file creation with exact path]
- [ ] [Package installation with exact command]
- [ ] [Environment variable setup with TypeScript types]

### Database & Schema
- [ ] [Create specific table/model with exact fields and TypeScript interface]
- [ ] [Database migration with exact file path and TypeScript types]
- [ ] [Seed data creation with TypeScript type definitions]

### Backend Development  
- [ ] [Create specific API endpoint: POST /api/users with TypeScript request/response types]
- [ ] [Implement specific function in exact file path with TypeScript signature]
- [ ] [Add authentication middleware to specific routes with TypeScript types]

### Frontend Development
- [ ] [Create specific React component: src/components/UserProfile.tsx with TypeScript props]
- [ ] [Implement specific page: pages/dashboard.tsx with TypeScript and Next.js patterns]
- [ ] [Add specific state management with TypeScript interfaces]

### Integration & Testing
- [ ] [Write unit test for specific component with TypeScript test types]
- [ ] [Create integration test for specific API with TypeScript mocking]
- [ ] [Test specific user flow end-to-end with TypeScript utilities]

### Styling & UI
- [ ] [Style specific component with Tailwind classes]
- [ ] [Implement responsive design for specific pages]
- [ ] [Add specific animations/interactions]

### Documentation
- [ ] [Update README with specific setup instructions including TypeScript]
- [ ] [Document API endpoints with TypeScript interface examples]
- [ ] [Add JSDoc comments to specific functions with TypeScript annotations]

## 🏁 Phase Completion Criteria
**This phase is complete when:**
- [ ] All todo items above are checked off
- [ ] TypeScript compiles with zero errors
- [ ] All tests pass with proper TypeScript coverage
- [ ] [Specific functional requirement works (e.g., "User can login and see dashboard")]
- [ ] [Specific technical requirement met (e.g., "API returns proper JSON responses")]

---

**GENERATION INSTRUCTIONS:**

1. **Todo Specificity:** Each todo must include:
   - Exact file paths (e.g., ""src/components/UserProfile.tsx"")
   - Specific function/component names with TypeScript signatures
   - Exact API endpoints with HTTP methods and TypeScript types
   - Specific technologies to use (Next.js, TypeScript, Tailwind, etc.)

2. **Todo Formatting:** 
   - ALL todos must start with - [ ] (unchecked)
   - Use imperative verbs (Create, Implement, Add, Write, Style)
   - Include TypeScript specifications for all code tasks
   - One specific action per todo item

3. **Todo Count:** Generate 5-15 todos based on phase complexity

4. **Logical Ordering:** 
   - Setup tasks first
   - Database/backend before frontend
   - Core functionality before styling
   - Testing after implementation

5. **TypeScript Focus:** Every code-related todo must specify TypeScript requirements

6. **AI-Friendly Language:** 
   - Use exact technical terms
   - Reference specific Next.js patterns
   - Include implementation hints when needed

Generate the complete phase execution plan now.`
    const prompt = PromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
    const result = await chain.invoke({architectureData: JSON.stringify(architectureData), planContent: plan, phaseNumber: numOfPhase, phaseDetails: typeof phaseDetails !== 'string' ? JSON.stringify(phaseDetails) : phaseDetails, prd: prd});
    return result;
}