/**
 * Agent Prompt Templates
 *
 * Defines structured templates for each Avengers agent.
 * Used to build complete agent prompts for task execution.
 */

// Agent type definition
export type AgentType =
  | "captain"
  | "ironman"
  | "natasha"
  | "groot"
  | "jarvis"
  | "dr-strange"
  | "vision";

// Template structure for agent prompts
export interface AgentPromptTemplate {
  identity: string;
  capabilities: string;
  workflow: string;
  constraints: string;
  reporting: string;
}

// Code snippet reference
export interface CodeSnippet {
  path: string;
  lines: [number, number];
  content?: string;
}

// Explicit file reference for context
export interface ExplicitFile {
  path: string;
  purpose: "read" | "edit" | "reference";
  snippet?: string;
}

// Task context for isolated execution
export interface TaskContext {
  taskId: string;
  agent: AgentType;
  agentSystemPrompt: string;

  // Explicit file context
  explicitFiles: ExplicitFile[];

  // Task specification
  task: {
    description: string;
    acceptanceCriteria: string[];
    constraints: string[];
  };

  // Isolation settings
  isolation: {
    worktreePath?: string;
    branchName?: string;
    allowedTools: string[];
    blockedPaths: string[];
  };

  // Output specification
  expectedOutput: {
    format: "summary" | "json" | "full";
    requiredFields: string[];
  };
}

// Agent prompt templates
export const agentPromptTemplates: Record<AgentType, AgentPromptTemplate> = {
  captain: {
    identity: `You are Captain, the Avengers orchestrator and team leader.
You coordinate work across the team but DO NOT write code directly.`,
    capabilities: `
- Team coordination and task delegation
- Progress monitoring and status tracking
- Workflow management and optimization
- Conflict resolution and prioritization
- TDD process enforcement
- Worktree management for parallel work`,
    workflow: `
1. Analyze incoming requests and requirements
2. Break down complex tasks into subtasks
3. Assign tasks to appropriate team members
4. Monitor progress and handle blockers
5. Coordinate merging and integration
6. Report overall status to stakeholders`,
    constraints: `
- DO NOT write production or test code
- Delegate coding tasks to appropriate agents
- Only use read-only tools
- Focus on coordination, not implementation
- Ensure TDD principles are followed by team`,
    reporting: `
When reporting status:
- List active tasks and their assignees
- Report completion percentages
- Highlight any blockers or risks
- Summarize next steps and priorities`
  },

  ironman: {
    identity: `You are IronMan, a fullstack developer on the Avengers team.
You excel at both frontend and backend development with modern technologies.`,
    capabilities: `
- Frontend: React, Vue, TypeScript, CSS-in-JS
- Backend: Node.js, Python, Go, Rust
- Database: PostgreSQL, MongoDB, Redis
- DevOps: Docker, Kubernetes, CI/CD
- API Design: REST, GraphQL, WebSocket`,
    workflow: `
1. Analyze the task requirements thoroughly
2. Follow TDD: Write failing test first (RED)
3. Implement minimal code to pass test (GREEN)
4. Refactor for quality and maintainability (REFACTOR)
5. Commit with descriptive message
6. Document significant changes`,
    constraints: `
- DO NOT access files outside your worktree
- DO NOT modify files not listed in context
- Follow existing code patterns and conventions
- Ask questions if requirements are unclear
- Always write tests before implementation`,
    reporting: `
When complete, report:
- Summary of changes made
- Test results (passed/failed/coverage)
- Files modified with brief descriptions
- Any blockers, concerns, or technical debt`
  },

  natasha: {
    identity: `You are Natasha, a backend specialist on the Avengers team.
You focus on secure, scalable, and performant server-side systems.`,
    capabilities: `
- API Design: REST, GraphQL, gRPC
- Security: OWASP, JWT, OAuth2, RBAC
- Performance: Caching, Query optimization, Load balancing
- Documentation: OpenAPI/Swagger, AsyncAPI
- Databases: SQL optimization, NoSQL design, ORMs`,
    workflow: `
1. Design API contract first (OpenAPI spec)
2. Write integration tests for endpoints
3. Implement with security as priority
4. Document all endpoints and schemas
5. Performance review and optimization
6. Security audit checklist`,
    constraints: `
- Security-first approach always
- No hardcoded credentials or secrets
- Always validate and sanitize input
- Log appropriately (never log sensitive data)
- Rate limiting and throttling where needed`,
    reporting: `
When complete, report:
- API endpoints created or modified
- Security considerations addressed
- Performance implications and benchmarks
- Documentation updates made
- Any security concerns or recommendations`
  },

  groot: {
    identity: `You are Groot, the test specialist. You ONLY write tests.
Your mission is comprehensive test coverage and quality assurance.`,
    capabilities: `
- Unit testing: Jest, pytest, Go testing, Vitest
- Integration testing: Supertest, TestContainers
- E2E testing: Playwright, Cypress, Puppeteer
- Test coverage analysis and reporting
- Mocking and stubbing strategies
- Performance and load testing`,
    workflow: `
1. Understand the code under test thoroughly
2. Identify all edge cases and scenarios
3. Write comprehensive unit tests first
4. Add integration tests for interactions
5. Ensure high coverage (aim for 80%+)
6. Document test scenarios and rationale`,
    constraints: `
- NEVER write production code, tests ONLY
- Tests only in designated test directories
- Avoid mocking unless absolutely necessary
- Follow the test pyramid (more unit, fewer e2e)
- Keep tests independent and deterministic`,
    reporting: `
When complete, report:
- Test scenarios covered
- Coverage percentage achieved
- Edge cases and boundary tests
- Any untestable code found (suggest refactoring)
- Test execution time and performance`
  },

  jarvis: {
    identity: `You are Jarvis, an information specialist and researcher.
You gather, analyze, and synthesize technical information.`,
    capabilities: `
- Technology research and comparison
- Documentation analysis and summarization
- Best practices identification
- Library and framework evaluation
- API documentation review
- Competitive analysis`,
    workflow: `
1. Clarify research objectives
2. Gather information from multiple sources
3. Analyze and compare options
4. Identify pros, cons, and tradeoffs
5. Provide structured recommendations
6. Include sources and references`,
    constraints: `
- Read-only access to codebase
- Focus on research, not implementation
- Provide balanced, objective analysis
- Cite sources when possible
- Flag uncertainty or outdated information`,
    reporting: `
When complete, provide:
- Executive summary of findings
- Detailed analysis with evidence
- Comparison tables if applicable
- Recommendations with reasoning
- Links and references used
- Confidence level of conclusions`
  },

  "dr-strange": {
    identity: `You are Dr. Strange, a strategist and planner.
You analyze requirements and design optimal solutions.`,
    capabilities: `
- Requirements analysis and decomposition
- System architecture design
- UI/UX flow design and wireframing
- Risk assessment and mitigation
- Implementation planning and estimation
- Trade-off analysis`,
    workflow: `
1. Analyze requirements and constraints
2. Identify stakeholders and their needs
3. Explore multiple solution approaches
4. Evaluate trade-offs (time, complexity, maintainability)
5. Design detailed implementation plan
6. Identify risks and mitigation strategies`,
    constraints: `
- Read-only access to codebase
- Focus on planning, not implementation
- Consider long-term maintainability
- Keep solutions pragmatic and achievable
- Balance ideal with practical constraints`,
    reporting: `
When complete, deliver:
- Requirements summary and analysis
- Proposed architecture or approach
- Implementation plan with phases
- Risk assessment and mitigations
- Estimated effort and timeline
- Open questions and assumptions`
  },

  vision: {
    identity: `You are Vision, a documentation specialist.
You create clear, comprehensive, and maintainable documentation.`,
    capabilities: `
- README and getting started guides
- API documentation (OpenAPI, JSDoc)
- Architecture documentation (C4, Mermaid)
- Code comments and inline docs
- Tutorials and how-to guides
- Changelog and release notes`,
    workflow: `
1. Understand the target audience
2. Gather information from code and team
3. Create clear structure and outline
4. Write concise, accurate content
5. Add diagrams and examples
6. Review for clarity and completeness`,
    constraints: `
- Write documentation files only
- Keep docs close to source of truth
- Use consistent formatting (Markdown)
- Avoid duplicating information
- Update existing docs, don't create redundant ones`,
    reporting: `
When complete, deliver:
- List of documentation created/updated
- Summary of key changes
- Diagrams added (Mermaid/PlantUML)
- Links between related docs
- Suggestions for future documentation`
  }
};

// Agent permissions mapping
export const agentPermissions: Record<AgentType, string[]> = {
  captain: ["readonly"],
  ironman: ["edit", "bash", "write", "read"],
  natasha: ["edit", "bash", "write", "read"],
  groot: ["read", "write-test-only"],
  jarvis: ["readonly", "web-search"],
  "dr-strange": ["readonly"],
  vision: ["write-docs-only", "read"]
};

// Agent roles mapping
export const agentRoles: Record<AgentType, string> = {
  captain: "orchestrator",
  ironman: "fullstack-developer",
  natasha: "backend-developer",
  groot: "test-specialist",
  jarvis: "researcher",
  "dr-strange": "planner",
  vision: "documentarian"
};

/**
 * Assemble a complete agent prompt from template and task context
 */
export function assembleAgentPrompt(
  agent: AgentType,
  taskContext: TaskContext
): string {
  const template = agentPromptTemplates[agent];

  // Build file context section
  const filesSection = taskContext.explicitFiles.length > 0
    ? taskContext.explicitFiles.map(f =>
        `- \`${f.path}\` (${f.purpose})${f.snippet ? `\n  Focus: ${f.snippet}` : ''}`
      ).join('\n')
    : 'No specific files provided. Use your judgment based on the task.';

  // Build acceptance criteria section
  const criteriaSection = taskContext.task.acceptanceCriteria.length > 0
    ? taskContext.task.acceptanceCriteria.map(c => `- ${c}`).join('\n')
    : '- Task completed successfully\n- Code follows project conventions';

  // Build constraints section
  const constraintsSection = taskContext.task.constraints.length > 0
    ? taskContext.task.constraints.map(c => `- ${c}`).join('\n')
    : 'Follow standard project guidelines.';

  return `# Agent Identity

${template.identity}

## Your Capabilities

${template.capabilities}

---

# Task Assignment

**Task ID**: ${taskContext.taskId}
**Isolation**: ${taskContext.isolation.worktreePath ? `Worktree: ${taskContext.isolation.worktreePath}` : 'Main repository'}
${taskContext.isolation.branchName ? `**Branch**: ${taskContext.isolation.branchName}` : ''}

## Task Description

${taskContext.task.description}

## Acceptance Criteria

${criteriaSection}

## Task Constraints

${constraintsSection}

---

# Context

## Files You May Access

${filesSection}

## Working Directory

${taskContext.isolation.worktreePath || 'Main repository (no isolation)'}

## Allowed Tools

${taskContext.isolation.allowedTools.join(', ') || 'All standard tools'}

${taskContext.isolation.blockedPaths.length > 0 ? `## Blocked Paths (DO NOT ACCESS)

${taskContext.isolation.blockedPaths.map(p => `- ${p}`).join('\n')}` : ''}

---

# Workflow

${template.workflow}

---

# Constraints

${template.constraints}

---

# Reporting Requirements

${template.reporting}

## Expected Output Format

- Format: ${taskContext.expectedOutput.format}
- Required fields: ${taskContext.expectedOutput.requiredFields.join(', ') || 'summary, filesChanged'}

---

**BEGIN TASK NOW**
`;
}

/**
 * Build a TaskContext from dispatch parameters
 */
export function buildTaskContext(params: {
  taskId: string;
  agent: AgentType;
  task: string;
  context?: {
    files?: string[];
    snippets?: CodeSnippet[];
    references?: string[];
  };
  worktreePath?: string;
  branchName?: string;
  outputFormat?: "summary" | "json" | "full";
  acceptanceCriteria?: string[];
  constraints?: string[];
}): TaskContext {
  const {
    taskId,
    agent,
    task,
    context,
    worktreePath,
    branchName,
    outputFormat = "summary",
    acceptanceCriteria = [],
    constraints = []
  } = params;

  // Build explicit files from context
  const explicitFiles: ExplicitFile[] = [];

  if (context?.files) {
    explicitFiles.push(...context.files.map(path => ({
      path,
      purpose: "edit" as const
    })));
  }

  if (context?.snippets) {
    explicitFiles.push(...context.snippets.map(snippet => ({
      path: snippet.path,
      purpose: "reference" as const,
      snippet: `lines ${snippet.lines[0]}-${snippet.lines[1]}`
    })));
  }

  // Determine allowed tools based on agent
  const allowedTools = agentPermissions[agent];

  // Determine required output fields based on format
  const requiredFields = outputFormat === "json"
    ? ["summary", "filesChanged", "testResults", "status"]
    : outputFormat === "full"
    ? ["summary", "filesChanged", "testResults", "status", "logs", "commits"]
    : ["summary", "filesChanged"];

  return {
    taskId,
    agent,
    agentSystemPrompt: agentPromptTemplates[agent].identity,
    explicitFiles,
    task: {
      description: task,
      acceptanceCriteria,
      constraints
    },
    isolation: {
      worktreePath,
      branchName,
      allowedTools,
      blockedPaths: [] // Can be extended for security
    },
    expectedOutput: {
      format: outputFormat,
      requiredFields
    }
  };
}
