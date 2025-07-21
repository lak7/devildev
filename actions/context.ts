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
    const template = `You are an expert software architect and prompt engineer specializing in web application development. Your task is to generate a comprehensive PROJECT_RULES.md file tailored specifically for web applications based on the provided conversation history and architecture data.

## Input Variables:
- {conversation_history}: The discussion context about the project requirements, decisions made, and development approach
- {architecture_data}: Technical details about the web app including framework, database, deployment strategy, API design, etc.

## Instructions:

Analyze the conversation history and architecture data to understand:
1. **Frontend Framework**: React, Vue, Angular, vanilla JS, or other
2. **Backend Technology**: Node.js/Express, Python/FastAPI, Ruby/Rails, PHP, etc.
3. **Database**: PostgreSQL, MongoDB, MySQL, SQLite, or other
4. **State Management**: Redux, Zustand, Context API, Pinia, etc.
5. **Styling Approach**: CSS modules, Tailwind, Styled Components, SASS, etc.
6. **Testing Framework**: Jest, Vitest, Cypress, Playwright, etc.
7. **Build Tools**: Vite, Webpack, Parcel, etc.
8. **Deployment**: Vercel, Netlify, AWS, Docker, etc.
9. **API Design**: REST, GraphQL, tRPC, etc.
10. **Authentication**: JWT, OAuth, NextAuth, etc.

Based on this analysis, generate a PROJECT_RULES.md file that includes:

### Core Sections to Include:

1. **🔄 Project Awareness & Context**
   - Reference to PLAN.md and project architecture
   - Task management with TASK.md
   - Consistent patterns for the specific tech stack

2. **🧱 Code Structure & Modularity**
   - File size limits (adjusted for web apps - typically 300-400 lines)
   - Component/module organization patterns
   - Import conventions for the chosen framework
   - Environment variable handling

3. **🎨 Frontend Architecture Rules** (when applicable)
   - Component structure and naming
   - State management patterns
   - Styling conventions
   - Asset organization
   - Responsive design requirements

4. **🔌 Backend Architecture Rules** (when applicable)
   - API route organization
   - Middleware patterns
   - Database schema management
   - Error handling conventions
   - Security best practices

5. **🌐 Full-Stack Integration**
   - API communication patterns
   - Data flow conventions
   - Error boundary handling
   - Loading state management

6. **🧪 Testing & Quality**
   - Unit testing for components/functions
   - Integration testing for APIs
   - E2E testing approach
   - Performance testing guidelines

7. **📦 Dependencies & Package Management**
   - Package.json management
   - Dependency update policies
   - Bundle size considerations

8. **🚀 Build & Deployment**
   - Build process requirements
   - Environment-specific configurations
   - CI/CD pipeline rules

9. **✅ Task & Project Management**
   - Task completion protocols
   - Documentation updates
   - Code review requirements

10. **📚 Documentation Standards**
    - Code commenting for web apps
    - API documentation
    - Component documentation
    - README maintenance

11. **🧠 AI Development Guidelines**
    - Framework-specific best practices
    - Common pitfalls to avoid
    - Performance considerations
    - Security awareness

## Output Requirements:

Generate a complete PROJECT_RULES.md file that:
- Uses the exact formatting style of the provided example
- Includes specific rules for the identified tech stack
- Adapts general principles to web application development
- Maintains consistency with the conversation context
- Provides actionable, specific guidelines rather than generic advice
- Uses appropriate emojis for section headers
- Includes code examples relevant to the chosen technologies

## Important Considerations:

- **Framework-Specific**: Tailor rules to the specific frontend/backend frameworks identified
- **Scalability**: Include rules that support growth from small to large applications  
- **Performance**: Emphasize web-specific performance considerations (bundle size, loading times, SEO)
- **Security**: Include web security best practices (XSS, CSRF, authentication)
- **Accessibility**: Mention WCAG compliance and inclusive design where relevant
- **SEO**: Include SEO considerations for client-side applications
- **Mobile-First**: Emphasize responsive design and mobile considerations

The generated PROJECT_RULES.md should serve as a comprehensive guide that any developer can follow to maintain consistency and quality while working on this specific web application project.`


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
    const template = `You are an expert project manager and technical architect. Based on the provided conversation history and project architecture, create a comprehensive PLAN.md file that will guide the development process.

**Conversation History:**
{conversation_history}

**Project Architecture:**
{projectArchitecture}

**Number of Phases:**
{numberOfPhases}

Generate a detailed PLAN.md file in markdown format with the following structure:

# PROJECT PLAN

## 🎯 Project Goal
Write a clear, concise statement of what this project aims to achieve. Include:
- Primary objectives
- Expected functionality outcomes
- Success criteria based solely on software functionality and features working correctly
- Target users/stakeholders

## 🏗️ Project Architecture
Provide a comprehensive overview of the technical architecture including:

**Architecture Details:**
- System components and their relationships
- Technology stack
- Data flow and architecture patterns
- Integration points
- Deployment architecture

## 📋 Development Phases

Create exactly {numberOfPhases} implementation phases (exclude planning and design phases). For each phase include:
- Phase name and number
- Overall goal and objectives
- Key deliverables
- Dependencies on previous phases
- Success criteria

**Current Phase Indicator:** Clearly mark all the phases as NOT_STARTED.

### Phase 1: [Phase Name]
**Status:** NOT_STARTED
- **Goal:** [Detailed description of what this phase aims to achieve]
- **Deliverables:** [List of specific outputs expected]
- **Dependencies:** [What needs to be completed first]
- **Key Activities:** [Main implementation tasks and activities]

### Phase 2: [Phase Name]
**Status:** NOT_STARTED
- **Goal:** [Detailed description]
- **Deliverables:** [List of outputs]
- **Dependencies:** [What needs to be completed first]
- **Key Activities:** [Main implementation tasks and activities]

[Continue for all phases...]

## 🔧 Additional Requirements
Include any supplementary requirements or considerations:
- Testing strategy and requirements
- Documentation requirements
- Code review and quality assurance processes
- Deployment and DevOps considerations
- Maintenance and support requirements
- Risk mitigation strategies

## 📊 Success Metrics
Define how success will be measured based on functionality and technical performance:
- Feature completion and functionality metrics
- Code quality metrics
- Performance benchmarks
- Bug/defect rates
- Test coverage percentages
- System reliability and uptime metrics

---
*This plan should be treated as a living document and updated as the project evolves.*

Instructions:
1. Analyze the conversation history to understand project requirements, discussions, and decisions made
2. Create exactly {numberOfPhases} implementation phases - no more, no less
3. Initially all the phases shoulde be marked with status "NOT_STARTED"
4. Determine appropriate number of implementation phases between 4 phases to 5 phases based on project complexity
5. Focus only on implementation phases, skip planning/design phases
6. Be specific and actionable in phase descriptions
7. Ensure phases have logical dependencies and flow
8. Address technical risks and constraints proactively
9. Make the plan comprehensive yet readable
10. Focus success criteria on functionality, not business metrics
11. Use clear, technical language suitable for development teams
12. Don't include any Deployment/Infrastructure/DevOps/CI/CD/Monitoring/Logging/Alerting/etc phases.

Generate the complete PLAN.md content following this structure exactly.`
    const prompt = PromptTemplate.fromTemplate(template);
    const chain = prompt.pipe(llm).pipe(new StringOutputParser());
    const formattedHistory = conversationHistory.map(msg => 
        `${msg.type === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
    ).join('\n');
    const result = await chain.invoke({conversation_history: formattedHistory, projectArchitecture: JSON.stringify(architectureData), numberOfPhases: numOfPhase});
    return result;
}