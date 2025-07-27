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

export async function generatePlan(conversationHistory: any[] = [], architectureData: any, numOfPhase: string) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const llm = new ChatOpenAI({openAIApiKey: openaiKey})
    const template = `You are an expert technical project manager. Create a comprehensive PLAN.md that will guide a coding assistant through the entire development process.

**INPUTS:**
- Conversation History: {conversation_history}
- Project Architecture: {projectArchitecture}
- Number of Phases: {numberOfPhases}

**OUTPUT:** Generate a complete PLAN.md file following this exact structure:

---

# PROJECT PLAN

## 🎯 Project Overview
**What we're building:** [1-2 sentence description]

**Core functionality:** 
- [Key feature 1]
- [Key feature 2] 
- [Key feature 3]

**Success criteria:**
- All features work as specified
- Code passes quality gates
- Application is deployable and functional

**Target users:** [Who will use this]

## 🏗️ Technical Architecture

**System Components:**
- [Component 1]: [Technology] - [Purpose]
- [Component 2]: [Technology] - [Purpose]
- [Component 3]: [Technology] - [Purpose]

**Technology Stack:**
- Frontend: [Specific technologies]
- Backend: [Specific technologies] 
- Database: [Specific technologies]
- [Other]: [Specific technologies]

**Key Integrations:**
- [Integration 1]: [Purpose and protocol]
- [Integration 2]: [Purpose and protocol]

## 📋 Implementation Phases

**IMPORTANT:** Generate exactly {numberOfPhases} phases below. Do not skip any phases or limit to 4 phases.

[For each phase from 1 to {numberOfPhases}, generate the following structure:]

### Phase [N]: [Phase Name Based on Content]
**Status:** NOT_STARTED
**Goal:** [What gets built in this phase]
**Dependencies:** [Phase N-1 completion, or "None" for Phase 1]
**Deliverables:**
- [Specific deliverable 1]
- [Specific deliverable 2]
- [Specific deliverable 3]
**Success Criteria:**
- [Testable criterion 1]
- [Testable criterion 2]

[Repeat this structure for ALL {numberOfPhases} phases - whether it's 3, 4, 5, 6, or 7 phases]

## 🧪 Quality Requirements
**Testing:** Unit tests for core functions, integration tests for APIs
**Code Quality:** TypeScript strict mode, ESLint passing, proper error handling
**Documentation:** README with setup instructions, API documentation
**Performance:** [Specific performance requirements based on project type]

---

**INSTRUCTIONS:**
1. **Phase Count:** Generate exactly {numberOfPhases} phases - no more, no less. Count carefully and include all requested phases.
2. **Dynamic Generation:** If numberOfPhases is 3, generate 3 phases. If it's 7, generate 7 phases. Always match the exact number.
3. **Phase Types:** 
   - Phase 1: Always project setup, basic structure, core infrastructure
   - Middle Phases: Core and advanced feature implementation 
   - Final Phase: Always integration, testing, and polish
4. **Phase Distribution:** Spread features logically across all {numberOfPhases} phases
5. **Deliverables:** Make them specific and measurable (e.g., "User authentication API with login/register endpoints" not "Authentication system")
6. **Success Criteria:** Make them testable (e.g., "Login API returns JWT token on valid credentials" not "Users can log in")
7. **Dependencies:** Each phase should build logically on the previous one
8. **Exclude:** No deployment, DevOps, monitoring, or infrastructure phases - focus only on application development
9. **Language:** Use technical language suitable for coding assistants
10. **Specificity:** Reference exact technologies from the architecture, not generic terms

Generate the complete PLAN.md content now.`
    const prompt = PromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
    const formattedHistory = conversationHistory.map(msg => 
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');
    const result = await chain.invoke({conversation_history: formattedHistory, projectArchitecture: JSON.stringify(architectureData), numberOfPhases: numOfPhase});
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
9. **Analytics & Success Metrics:** Measurable KPIs for product validation
10. **Timeline & Milestones:** Development schedule with exact phases from phaseDetails, including status tracking

## Critical Timeline Requirements:

### MVP Development Phases Table:
**MUST include this exact table structure:**

| Phase  | Key Deliverables | Success Criteria | Status |
|-------|----------|------------------|------------------|--------|
| [Use exact phase names from phaseDetails] | [Specific deliverables] | [Measurable criteria] | NOT STARTED |


**Requirements:**
- **Use exact phase names** from the phaseDetails input (e.g., "Phase 1: Project Foundation & Backend Setup")
- **Include Status column** with "NOT STARTED" for all phases initially  
- **Key Deliverables** must be specific, actionable outcomes for each phase
- **Success Criteria** must be measurable and testable
- **Cover all phases** provided in numberOfPhases and phaseDetails

### Section Critical MVP Milestones:
- Create milestone dates based on phase durations
- Include phase completion milestones
- Use actual dates (calculate from current date + phase durations)

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

### Timeline Integration:
- **Use exact phase names and count** from the provided phaseDetails
- **Create realistic duration estimates** based on feature complexity (typically 1-4 weeks per phase)
- **Define clear milestones and deliverables** for each phase
- **Include "NOT STARTED" status** for all phases initially
- **Map specific features** from architecture to appropriate phases
- **Include dependencies and risk factors** that could impact timeline

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

export async function generateNthPhase(architectureData: any, plan: string, numOfPhase: string) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const llm = new ChatOpenAI({openAIApiKey: openaiKey})
    const template = `You are an expert software development lead creating actionable todo lists for AI coding agents. Generate a focused phase execution plan that an AI can follow step-by-step.

**INPUTS:**
- Project Plan: {planContent}
- Project Architecture: {architectureData}  
- Target Phase: {phaseNumber}

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
    const result = await chain.invoke({architectureData: JSON.stringify(architectureData), planContent: plan, phaseNumber: numOfPhase});
    return result;
}