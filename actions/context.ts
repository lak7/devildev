"use server"

import { StringOutputParser } from "@langchain/core/output_parsers";
import { PromptTemplate } from "@langchain/core/prompts";
import { ChatOpenAI } from "@langchain/openai";

export async function numberOfPhases(conversationHistory: any[] = [], architectureData: any) {
    const openaiKey = process.env.OPENAI_API_KEY;
    const llm = new ChatOpenAI({openAIApiKey: openaiKey})
    const template = `You are a software development project manager with expertise in web application development using Next.js and Node.js.

Your task is to analyze a project and determine the optimal number of development phases needed for completion.

## Input Data:
Conversation History: {conversation_history}
Architecture Details: {architecture_data}

## Analysis Criteria:
Evaluate project complexity based on:
- Frontend complexity (components, state management, UI/UX requirements)
- Backend complexity (API endpoints, database operations, authentication)
- Integration requirements (third-party services, external APIs)
- Database design and data relationships
- Testing requirements
- Security considerations

## Output Requirements:
- Return ONLY a single integer between 3 and 7
- Base the number on overall project complexity:
  * 3-4 phases: Simple projects (basic CRUD, minimal integrations)
  * 5-6 phases: Medium complexity (multiple features, some integrations)
  * 7 phases: High complexity (advanced features, multiple integrations, complex architecture)

## Response Format:
Return only the number. No explanations, no additional text, no formatting.

Example outputs:
4
6
5

Now analyze the provided project data and return the appropriate number of phases.`

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