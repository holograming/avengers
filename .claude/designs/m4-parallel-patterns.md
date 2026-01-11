# M4: Parallel Agent Execution Patterns

## Overview

This document defines the architectural patterns for Background Task-based parallel agent execution in the Avengers system. The design focuses on three core challenges:

1. **Context Contamination Prevention** - Ensuring subagents receive only explicit context
2. **Agent Dispatch Integration** - Connecting dispatch-agent with Task tool
3. **Monitoring Enhancement** - Tracking, logging, and failure detection

---

## Architecture Diagram

```
+------------------------------------------------------------------+
|                         ORCHESTRATOR (Captain)                    |
|                                                                   |
|  +--------------------+    +--------------------+                 |
|  | Task Planner       |    | Result Aggregator  |                 |
|  | - Decomposes work  |    | - Collects outputs |                 |
|  | - Creates TaskCtx  |    | - Summarizes       |                 |
|  +--------------------+    +--------------------+                 |
+------------------------------------------------------------------+
              |                           ^
              | dispatch_agent()          | TaskOutput
              v                           |
+------------------------------------------------------------------+
|                      DISPATCH LAYER                               |
|                                                                   |
|  +----------------------------------------------------------+   |
|  |               TaskContext Builder                         |   |
|  |  - Explicit files list                                    |   |
|  |  - Scoped instructions                                    |   |
|  |  - Agent system prompt                                    |   |
|  |  - Worktree path (if isolated)                           |   |
|  +----------------------------------------------------------+   |
+------------------------------------------------------------------+
              |                    |                    |
              v                    v                    v
+----------------+   +----------------+   +----------------+
|   WORKTREE A   |   |   WORKTREE B   |   |   WORKTREE C   |
|  (IronMan-T1)  |   |  (Natasha-T2)  |   |   (Groot-T3)   |
|                |   |                |   |                |
| +------------+ |   | +------------+ |   | +------------+ |
| | Subagent   | |   | | Subagent   | |   | | Subagent   | |
| | - Task     | |   | | - Task     | |   | | - Task     | |
| | - Context  | |   | | - Context  | |   | | - Context  | |
| +------------+ |   | +------------+ |   | +------------+ |
+----------------+   +----------------+   +----------------+
              |                    |                    |
              v                    v                    v
+------------------------------------------------------------------+
|                       TASK REGISTRY                               |
|  +-------------------+  +-------------------+  +-----------------+|
|  | TaskID: T001      |  | TaskID: T002      |  | TaskID: T003    ||
|  | Agent: ironman    |  | Agent: natasha    |  | Agent: groot    ||
|  | Status: running   |  | Status: running   |  | Status: pending ||
|  | Worktree: ...     |  | Worktree: ...     |  | Worktree: ...   ||
|  | StartTime: ...    |  | StartTime: ...    |  | StartTime: ...  ||
|  +-------------------+  +-------------------+  +-----------------+|
+------------------------------------------------------------------+
```

---

## 1. Context Contamination Prevention

### 1.1 Problem Statement

When dispatching parallel agents, context contamination occurs when:
- Parent conversation history leaks to subagent
- One subagent's work contaminates another
- Implicit codebase assumptions carry over incorrectly
- Shared state causes interference between agents

### 1.2 Solution: Explicit Context Boundary

```
+----------------------------------------------------------+
|                    TaskContext                            |
|                                                           |
|  +-------------------------+   +------------------------+ |
|  | EXPLICIT CONTEXT        |   | FORBIDDEN CONTEXT      | |
|  |-------------------------|   |------------------------| |
|  | - Listed file paths     |   | - Parent conversation  | |
|  | - Task description      |   | - Other agent context  | |
|  | - Agent system prompt   |   | - Implicit codebase    | |
|  | - Required tools list   |   |   knowledge            | |
|  | - Worktree base path    |   | - Shared memory        | |
|  +-------------------------+   +------------------------+ |
+----------------------------------------------------------+
```

### 1.3 TaskContext Interface

```typescript
interface TaskContext {
  // Unique task identifier
  taskId: string;

  // Agent assignment
  agent: AgentType;
  agentSystemPrompt: string;

  // Explicit file context (paths relative to worktree)
  explicitFiles: {
    path: string;
    purpose: "read" | "edit" | "reference";
    snippet?: string;  // Optional: specific section to focus on
  }[];

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
    blockedPaths: string[];  // Paths subagent cannot access
  };

  // Output specification
  expectedOutput: {
    format: "summary" | "json" | "diff" | "report";
    requiredFields: string[];
  };
}
```

### 1.4 Worktree-Based File Isolation

```
MAIN REPO                         WORKTREES
+------------------+              +--------------------+
| /project         |              | /project-worktree  |
|                  |    git       | /ironman-T001      |
| +-- src/         |   worktree   |   +-- src/         |
| |   +-- api/     |   ------->   |   |   +-- api/     |
| |   +-- ui/      |   add        |   |   +-- ui/      |
| +-- tests/       |              |   +-- tests/       |
| +-- .git/        |              |   +-- .git (link)  |
+------------------+              +--------------------+
                                         |
                                         v
                                  Agent works here
                                  - Isolated changes
                                  - No interference
                                  - Clean merge later
```

**Isolation Rules:**

1. **One worktree per task** - Each dispatched task gets its own worktree
2. **Branch per agent** - `feature/T001-ironman`, `feature/T002-natasha`
3. **No cross-worktree access** - Agents cannot read other worktrees
4. **Explicit file list** - Only listed files are readable by default
5. **Merge after review** - Changes go through code review before merge

### 1.5 Selective TaskOutput Consumption

```
+-------------------+     +-------------------+     +-------------------+
| Agent Output      |     | Output Filter     |     | Consumed Result   |
|-------------------|     |-------------------|     |-------------------|
| - Full log        | --> | - Extract summary | --> | - Summary only    |
| - Debug info      |     | - Parse JSON      |     | - Structured data |
| - Internal state  |     | - Filter secrets  |     | - Safe to expose  |
| - File changes    |     | - Validate format |     | - Validated       |
+-------------------+     +-------------------+     +-------------------+
```

```typescript
interface TaskOutputFilter {
  // What to extract from raw output
  extract: {
    summary: boolean;        // Natural language summary
    changedFiles: boolean;   // List of modified files
    testResults: boolean;    // Test pass/fail status
    errors: boolean;         // Any errors encountered
  };

  // What to exclude
  exclude: {
    debugLogs: boolean;
    internalState: boolean;
    sensitivePatterns: RegExp[];  // e.g., /password|secret|key/i
  };

  // Post-processing
  transform: {
    maxLength?: number;      // Truncate if too long
    format?: "json" | "markdown" | "plain";
  };
}
```

---

## 2. Agent Dispatch Integration

### 2.1 Enhanced Dispatch Flow

```
+------------------+
| Captain calls    |
| dispatch_agent() |
+--------+---------+
         |
         v
+------------------+
| Build TaskContext|
| - Gather files   |
| - Set constraints|
| - Create prompt  |
+--------+---------+
         |
         v
+------------------+
| Create Worktree  |
| (if worktree=true)|
+--------+---------+
         |
         v
+------------------+
| Spawn Background |
| Task via Task()  |
+--------+---------+
         |
         v
+------------------+
| Register in      |
| Task Registry    |
+--------+---------+
         |
         v
+------------------+
| Return task_id   |
| to orchestrator  |
+------------------+
```

### 2.2 dispatch_agent Tool Enhancement

```typescript
// Enhanced dispatch_agent parameters
interface DispatchAgentParams {
  agent: AgentType;
  task: string;

  // Explicit context (NEW)
  context?: {
    files?: string[];           // Files to include
    snippets?: CodeSnippet[];   // Specific code sections
    references?: string[];      // URLs or doc paths
  };

  // Isolation settings
  worktree?: boolean;
  priority?: "critical" | "high" | "medium" | "low";

  // Execution mode (NEW)
  mode?: "background" | "foreground";  // default: background

  // Output handling (NEW)
  outputFormat?: "summary" | "json" | "full";

  // Dependencies (NEW)
  dependencies?: string[];  // Task IDs that must complete first
}
```

### 2.3 Agent System Prompt Templates

```typescript
const agentPromptTemplates: Record<AgentType, AgentPromptTemplate> = {
  ironman: {
    identity: `You are IronMan, a fullstack developer on the Avengers team.`,
    capabilities: `
      - Frontend: React, Vue, TypeScript
      - Backend: Node.js, Python, Go
      - Database: PostgreSQL, MongoDB
      - DevOps: Docker, Kubernetes
    `,
    workflow: `
      1. Analyze the task requirements
      2. Follow TDD: Write failing test first
      3. Implement minimal code to pass
      4. Refactor for quality
      5. Commit with descriptive message
    `,
    constraints: `
      - DO NOT access files outside your worktree
      - DO NOT modify files not listed in context
      - Follow existing code patterns
      - Ask questions if requirements are unclear
    `,
    reporting: `
      When complete, report:
      - Summary of changes
      - Test results
      - Files modified
      - Any blockers or concerns
    `
  },

  natasha: {
    identity: `You are Natasha, a backend specialist on the Avengers team.`,
    capabilities: `
      - API Design: REST, GraphQL, gRPC
      - Security: OWASP, JWT, OAuth
      - Performance: Caching, Query optimization
      - Documentation: OpenAPI/Swagger
    `,
    workflow: `
      1. Design API contract first
      2. Write integration tests
      3. Implement with security in mind
      4. Document endpoints
      5. Performance review
    `,
    constraints: `
      - Security-first approach
      - No hardcoded credentials
      - Always validate input
      - Log appropriately (no sensitive data)
    `,
    reporting: `
      When complete, report:
      - API endpoints created/modified
      - Security considerations
      - Performance implications
      - Documentation updates
    `
  },

  groot: {
    identity: `You are Groot, the test specialist. You ONLY write tests.`,
    capabilities: `
      - Unit testing: Jest, pytest, Go testing
      - Integration testing
      - E2E testing: Playwright, Cypress
      - Test coverage analysis
    `,
    workflow: `
      1. Understand code under test
      2. Identify edge cases
      3. Write comprehensive tests
      4. Ensure high coverage
      5. Document test scenarios
    `,
    constraints: `
      - NEVER write production code
      - Tests only in test directories
      - No mocking unless necessary
      - Follow test pyramid
    `,
    reporting: `
      When complete, report:
      - Test scenarios covered
      - Coverage percentage
      - Edge cases tested
      - Any untestable code found
    `
  }
  // ... other agents
};

interface AgentPromptTemplate {
  identity: string;
  capabilities: string;
  workflow: string;
  constraints: string;
  reporting: string;
}
```

### 2.4 Complete Agent Prompt Assembly

```typescript
function assembleAgentPrompt(
  agent: AgentType,
  taskContext: TaskContext
): string {
  const template = agentPromptTemplates[agent];

  return `
# Agent Identity

${template.identity}

## Your Capabilities

${template.capabilities}

---

# Task Assignment

**Task ID**: ${taskContext.taskId}
**Priority**: ${taskContext.isolation.worktreePath ? "Isolated" : "Shared"}

## Task Description

${taskContext.task.description}

## Acceptance Criteria

${taskContext.task.acceptanceCriteria.map(c => `- ${c}`).join('\n')}

## Constraints

${taskContext.task.constraints.map(c => `- ${c}`).join('\n')}

---

# Context

## Files You May Access

${taskContext.explicitFiles.map(f =>
  `- ${f.path} (${f.purpose})${f.snippet ? `\n  Relevant section: ${f.snippet}` : ''}`
).join('\n')}

## Working Directory

${taskContext.isolation.worktreePath || "Main repository"}

## Allowed Tools

${taskContext.isolation.allowedTools.join(', ')}

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

Format: ${taskContext.expectedOutput.format}
Required fields: ${taskContext.expectedOutput.requiredFields.join(', ')}
`;
}
```

### 2.5 Result Collection and Summarization

```
+-------------+    +-------------+    +-------------+
| Agent 1     |    | Agent 2     |    | Agent 3     |
| Output      |    | Output      |    | Output      |
+------+------+    +------+------+    +------+------+
       |                  |                  |
       v                  v                  v
+--------------------------------------------------+
|               Result Collector                    |
|                                                   |
|  1. Wait for all tasks (or timeout)              |
|  2. Parse each output                            |
|  3. Extract structured data                      |
|  4. Handle failures                              |
+--------------------------------------------------+
                      |
                      v
+--------------------------------------------------+
|               Result Summarizer                   |
|                                                   |
|  - Aggregate changes                             |
|  - Combine test results                          |
|  - Identify conflicts                            |
|  - Generate executive summary                    |
+--------------------------------------------------+
                      |
                      v
+--------------------------------------------------+
|               Orchestrator Review                 |
|                                                   |
|  Captain reviews:                                |
|  - All tasks completed?                          |
|  - Any conflicts?                                |
|  - Ready to merge?                               |
+--------------------------------------------------+
```

```typescript
interface TaskResult {
  taskId: string;
  agent: AgentType;
  status: "success" | "failure" | "timeout" | "cancelled";

  // Structured output
  output: {
    summary: string;
    changedFiles: string[];
    testResults?: {
      passed: number;
      failed: number;
      coverage?: number;
    };
    commitSha?: string;
  };

  // Timing
  startedAt: Date;
  completedAt: Date;
  duration: number;

  // Errors if any
  error?: {
    message: string;
    stack?: string;
  };
}

interface AggregatedResults {
  tasks: TaskResult[];

  // Overall status
  allSucceeded: boolean;
  failedTasks: string[];

  // Combined metrics
  totalFilesChanged: number;
  totalTestsPassed: number;
  totalTestsFailed: number;

  // Conflict detection
  conflicts: {
    file: string;
    agents: string[];
  }[];

  // Executive summary
  summary: string;
}
```

---

## 3. Monitoring Enhancement

### 3.1 Task Registry

```typescript
class TaskRegistry {
  private tasks: Map<string, TaskEntry> = new Map();

  interface TaskEntry {
    taskId: string;
    agent: AgentType;
    status: TaskStatus;

    // Timing
    createdAt: Date;
    startedAt?: Date;
    completedAt?: Date;

    // Isolation
    worktreePath?: string;
    branchName?: string;

    // Progress
    progress?: {
      phase: string;  // "testing" | "implementing" | "reviewing"
      percent?: number;
      lastUpdate: Date;
    };

    // Dependencies
    dependsOn: string[];
    blockedBy: string[];  // Tasks that must complete first

    // Result
    result?: TaskResult;
  }

  type TaskStatus =
    | "pending"      // Created but not started
    | "queued"       // Waiting for dependencies
    | "running"      // In progress
    | "success"      // Completed successfully
    | "failure"      // Failed
    | "timeout"      // Exceeded time limit
    | "cancelled";   // Manually cancelled
}
```

### 3.2 Background Task Status Tracking

```
+------------------------------------------------------------------+
|                     TASK STATUS DASHBOARD                         |
+------------------------------------------------------------------+
| Task ID | Agent    | Status   | Progress | Duration | Worktree   |
|---------|----------|----------|----------|----------|------------|
| T001    | ironman  | running  | 60%      | 5m 32s   | ironman-T1 |
| T002    | natasha  | running  | 45%      | 4m 15s   | natasha-T2 |
| T003    | groot    | queued   | -        | -        | pending    |
| T004    | jarvis   | success  | 100%     | 2m 10s   | -          |
+------------------------------------------------------------------+
| Active: 2 | Queued: 1 | Completed: 1 | Failed: 0                  |
+------------------------------------------------------------------+
```

```typescript
interface TaskStatusQuery {
  // Query options
  agents?: AgentType[];
  status?: TaskStatus[];
  since?: Date;

  // Response format
  format: "summary" | "detailed" | "json";
}

interface TaskStatusResponse {
  tasks: TaskStatusEntry[];

  // Aggregated stats
  stats: {
    total: number;
    pending: number;
    running: number;
    succeeded: number;
    failed: number;
  };

  // Alerts
  alerts: {
    type: "warning" | "error";
    message: string;
    taskId?: string;
  }[];
}
```

### 3.3 Agent Output Logging

```
+------------------------------------------------------------------+
|                      LOGGING ARCHITECTURE                         |
+------------------------------------------------------------------+
|                                                                   |
|  +---------------+                                                |
|  | Agent Output  |                                                |
|  +-------+-------+                                                |
|          |                                                        |
|          v                                                        |
|  +------------------+     +------------------+                    |
|  | Stream Logger    |---->| .claude/logs/    |                    |
|  |------------------|     | T001-ironman.log |                    |
|  | - Real-time      |     | T002-natasha.log |                    |
|  | - Structured     |     +------------------+                    |
|  | - Rotated        |                                             |
|  +------------------+                                             |
|          |                                                        |
|          v                                                        |
|  +------------------+     +------------------+                    |
|  | Event Emitter    |---->| Orchestrator     |                    |
|  |------------------|     | (real-time)      |                    |
|  | - Progress       |     +------------------+                    |
|  | - Errors         |                                             |
|  | - Completion     |                                             |
|  +------------------+                                             |
+------------------------------------------------------------------+
```

```typescript
interface LogEntry {
  timestamp: Date;
  taskId: string;
  agent: AgentType;
  level: "debug" | "info" | "warn" | "error";
  category: LogCategory;
  message: string;
  metadata?: Record<string, unknown>;
}

type LogCategory =
  | "task"        // Task lifecycle events
  | "file"        // File operations
  | "test"        // Test execution
  | "git"         // Git operations
  | "tool"        // Tool invocations
  | "error"       // Error events
  | "progress";   // Progress updates

interface LogConfig {
  // Log destination
  directory: string;  // default: ".claude/logs"

  // Rotation
  maxFileSize: number;    // bytes
  maxFiles: number;       // keep N files

  // Filtering
  minLevel: "debug" | "info" | "warn" | "error";
  categories: LogCategory[];

  // Format
  format: "json" | "text";
  includeTimestamp: boolean;
  includeMetadata: boolean;
}
```

### 3.4 Failure Detection and Notification

```
+------------------+
| Task Running     |
+--------+---------+
         |
         v
+------------------+     +------------------+
| Health Check     |     | Failure Types    |
|------------------|     |------------------|
| - Heartbeat      |     | - Crash          |
| - Progress       |     | - Timeout        |
| - Resource usage |     | - Test failure   |
+--------+---------+     | - Constraint     |
         |               |   violation      |
         v               +------------------+
+------------------+
| Failure Detected?|
+--------+---------+
    |         |
    | NO      | YES
    v         v
+--------+  +-----------------+
| Continue| | Failure Handler |
+--------+  +-----------------+
                   |
    +--------------+--------------+
    |              |              |
    v              v              v
+-------+    +----------+   +-----------+
| Retry |    | Escalate |   | Abort &   |
| (if   |    | to       |   | Cleanup   |
| config)|   | Captain  |   |           |
+-------+    +----------+   +-----------+
```

```typescript
interface FailureConfig {
  // Detection
  healthCheck: {
    interval: number;       // ms between checks
    timeout: number;        // ms before timeout
    maxStalls: number;      // stalled progress count
  };

  // Response
  onFailure: {
    retry: {
      enabled: boolean;
      maxAttempts: number;
      backoff: "linear" | "exponential";
    };

    escalate: {
      enabled: boolean;
      notifyOrchestrator: boolean;
      collectDiagnostics: boolean;
    };

    cleanup: {
      removeWorktree: boolean;
      preserveLogs: boolean;
    };
  };
}

interface FailureEvent {
  taskId: string;
  agent: AgentType;
  type: FailureType;
  timestamp: Date;

  // Diagnostics
  diagnostics: {
    lastOutput: string;
    resourceUsage?: {
      memory: number;
      cpu: number;
    };
    logTail: string[];
  };

  // Resolution
  action: "retry" | "escalate" | "abort";
  resolution?: {
    retryCount?: number;
    escalatedTo?: string;
  };
}

type FailureType =
  | "crash"           // Process died
  | "timeout"         // Exceeded time limit
  | "test_failure"    // Tests failed
  | "constraint"      // Violated constraints
  | "dependency"      // Missing dependency
  | "resource"        // Out of memory/disk
  | "conflict";       // Merge conflict
```

---

## 4. Best Practices

### 4.1 DO

```
[+] Use explicit file lists in TaskContext
[+] Create worktrees for any task that modifies files
[+] Set clear acceptance criteria
[+] Define output format expectations
[+] Implement health checks for long-running tasks
[+] Log structured data for analysis
[+] Handle failures gracefully with cleanup
[+] Review all agent outputs before merging
```

### 4.2 DON'T

```
[-] Pass parent conversation context to subagents
[-] Allow cross-worktree file access
[-] Skip the code review step
[-] Ignore task timeouts
[-] Run agents without explicit constraints
[-] Merge without conflict detection
[-] Expose raw agent output to orchestrator
[-] Let failed tasks block indefinitely
```

### 4.3 Anti-Patterns

| Anti-Pattern | Problem | Solution |
|--------------|---------|----------|
| Context Leak | Parent conversation pollutes subagent | Use TaskContext with explicit files only |
| Shared State | Agents interfere with each other | One worktree per task |
| Blind Merge | Conflicts not detected | Conflict detection before merge |
| Fire and Forget | Task status unknown | Health checks + logging |
| Monolithic Task | Too large to parallelize | Decompose into independent subtasks |
| Implicit Dependencies | Race conditions | Explicit dependency declaration |

---

## 5. Implementation Phases

### Phase 1: Core Infrastructure (Week 1)

1. **TaskContext Implementation**
   - Define TypeScript interfaces
   - Build context builder
   - Add validation

2. **Enhanced dispatch_agent**
   - Add context parameter
   - Integrate with Task tool
   - Return task handles

### Phase 2: Isolation Layer (Week 2)

1. **Worktree Manager**
   - Automatic worktree creation
   - Path isolation enforcement
   - Cleanup on completion

2. **Agent Prompt Templates**
   - Create template system
   - Add all agent definitions
   - Validation and testing

### Phase 3: Monitoring (Week 3)

1. **Task Registry**
   - Status tracking
   - Query interface
   - Dashboard view

2. **Logging System**
   - Structured logging
   - Log rotation
   - Query capabilities

### Phase 4: Reliability (Week 4)

1. **Failure Handling**
   - Health checks
   - Retry logic
   - Escalation flow

2. **Result Aggregation**
   - Output collection
   - Conflict detection
   - Summary generation

---

## 6. API Reference

### 6.1 avengers_dispatch_agent (Enhanced)

```typescript
// Input
{
  agent: "ironman" | "natasha" | "groot" | "jarvis" | "dr-strange" | "vision",
  task: string,
  context?: {
    files?: string[],
    snippets?: { path: string, lines: [number, number] }[],
    references?: string[]
  },
  worktree?: boolean,
  priority?: "critical" | "high" | "medium" | "low",
  mode?: "background" | "foreground",
  outputFormat?: "summary" | "json" | "full",
  dependencies?: string[]
}

// Output
{
  taskId: string,
  agent: string,
  status: "dispatched",
  worktree?: string,
  estimatedDuration?: string
}
```

### 6.2 avengers_get_task_status (New)

```typescript
// Input
{
  taskId?: string,           // Specific task or all
  agents?: string[],         // Filter by agent
  status?: string[],         // Filter by status
  includeOutput?: boolean    // Include task output
}

// Output
{
  tasks: TaskStatusEntry[],
  stats: {
    total: number,
    running: number,
    completed: number,
    failed: number
  }
}
```

### 6.3 avengers_collect_results (New)

```typescript
// Input
{
  taskIds: string[],         // Tasks to collect
  timeout?: number,          // Wait timeout (ms)
  format?: "summary" | "detailed"
}

// Output
{
  results: TaskResult[],
  summary: string,
  conflicts: Conflict[],
  ready: boolean
}
```

---

## 7. Appendix

### A. File Structure

```
.claude/
  designs/
    m4-parallel-patterns.md    # This document
  state/
    tasks.json                 # Task registry state
    agents.json                # Agent status
  logs/
    T001-ironman.log          # Per-task logs
    T002-natasha.log
    aggregated.log            # Combined log
  worktrees/
    ironman-T001/             # Agent worktrees
    natasha-T002/
```

### B. Configuration Example

```json
{
  "parallelExecution": {
    "maxConcurrent": 4,
    "worktreeDirectory": ".worktrees",
    "taskTimeout": 600000,
    "healthCheckInterval": 30000
  },
  "logging": {
    "directory": ".claude/logs",
    "level": "info",
    "format": "json",
    "rotation": {
      "maxSize": "10MB",
      "maxFiles": 5
    }
  },
  "failureHandling": {
    "retryEnabled": true,
    "maxRetries": 2,
    "escalateOnFailure": true
  }
}
```

---

*Document created by Dr.Strange for Avengers M4 implementation.*
*Designed to guide IronMan and Natasha in Phase 2 implementation.*
