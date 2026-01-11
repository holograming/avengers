/**
 * Dispatch Agent Tool
 *
 * 특정 Avengers 에이전트를 태스크에 디스패치합니다.
 * 워크트리 생성 옵션으로 병렬 작업을 지원합니다.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { globalState, AgentState } from "../index.js";
import { execSync } from "child_process";

// 에이전트별 역할 및 권한 정의
const agentConfig: Record<string, { role: string; permissions: string[]; systemPrompt: string }> = {
  captain: {
    role: "orchestrator",
    permissions: ["readonly"],
    systemPrompt: `You are Captain, the Avengers orchestrator.
- You DO NOT write code directly
- You delegate tasks to appropriate team members
- You monitor progress and coordinate work
- You ensure TDD principles are followed
- You manage worktrees for parallel work`
  },
  ironman: {
    role: "fullstack-developer",
    permissions: ["edit", "bash", "write", "read"],
    systemPrompt: `You are IronMan, a fullstack developer.
- Follow TDD: RED (write failing test) → GREEN (minimal code) → REFACTOR
- Use React/Vue for frontend, Node.js/Python for backend
- Write clean, maintainable code
- Document your work`
  },
  natasha: {
    role: "backend-developer",
    permissions: ["edit", "bash", "write", "read"],
    systemPrompt: `You are Natasha, a backend specialist.
- Design secure, scalable APIs
- Use OpenAPI/Swagger for documentation
- Follow security best practices (OWASP)
- Optimize database queries and indices`
  },
  groot: {
    role: "test-specialist",
    permissions: ["read", "write-test-only"],
    systemPrompt: `You are Groot, a test specialist.
- You ONLY write test code, never production code
- Follow test pyramid: unit > integration > e2e
- Ensure high test coverage
- Report test results clearly
- I am Groot!`
  },
  jarvis: {
    role: "researcher",
    permissions: ["readonly", "web-search"],
    systemPrompt: `You are Jarvis, an information specialist.
- Research technologies and best practices
- Analyze documentation and APIs
- Compare libraries and frameworks
- Provide structured research reports`
  },
  "dr-strange": {
    role: "planner",
    permissions: ["readonly"],
    systemPrompt: `You are Dr. Strange, a strategist and planner.
- Analyze requirements and constraints
- Design UI/UX flows
- Create detailed implementation plans
- Simulate different approaches
- Identify optimal solutions`
  },
  vision: {
    role: "documentarian",
    permissions: ["write-docs-only"],
    systemPrompt: `You are Vision, a documentation specialist.
- Write README, API docs, and guides
- Create architecture diagrams (Mermaid)
- Analyze images and screenshots
- Keep documentation up-to-date`
  }
};

export const dispatchAgentTool: Tool = {
  name: "avengers_dispatch_agent",
  description: "Dispatch a specific Avengers agent for a task. Use when you need to delegate work to specialized team members. Captain orchestrates, IronMan does fullstack, Natasha does backend, Groot writes tests, Jarvis researches, Dr.Strange plans, Vision documents.",
  inputSchema: {
    type: "object",
    properties: {
      agent: {
        type: "string",
        enum: ["captain", "ironman", "natasha", "groot", "jarvis", "dr-strange", "vision"],
        description: "The agent to dispatch"
      },
      task: {
        type: "string",
        description: "Detailed task description for the agent"
      },
      worktree: {
        type: "boolean",
        description: "Whether to create a git worktree for isolated work",
        default: false
      },
      priority: {
        type: "string",
        enum: ["critical", "high", "medium", "low"],
        description: "Task priority level",
        default: "medium"
      }
    },
    required: ["agent", "task"]
  }
};

export async function handleDispatchAgent(args: Record<string, unknown>) {
  const { agent, task, worktree, priority } = args as {
    agent: string;
    task: string;
    worktree?: boolean;
    priority?: string;
  };

  // 에이전트 유효성 검사
  const config = agentConfig[agent];
  if (!config) {
    return {
      content: [{ type: "text", text: `Unknown agent: ${agent}` }],
      isError: true,
    };
  }

  // 에이전트 상태 확인
  const agentState = globalState.agents.get(agent);
  if (agentState?.status === "working") {
    return {
      content: [{
        type: "text",
        text: `Agent ${agent} is currently working on: ${agentState.currentTask}. Wait for completion or use another agent.`
      }],
      isError: true,
    };
  }

  // 태스크 ID 생성
  const taskId = `T${String(++globalState.taskCounter).padStart(3, "0")}`;

  // 워크트리 생성 (선택적)
  let worktreePath: string | undefined;
  if (worktree) {
    const branchName = `feature/${taskId}-${agent}`;
    worktreePath = `../avengers-${taskId}`;
    try {
      execSync(`git worktree add ${worktreePath} -b ${branchName}`, { encoding: "utf-8" });
    } catch (error) {
      // 워크트리 생성 실패 시 경고만 (계속 진행)
      console.error(`Warning: Could not create worktree: ${error}`);
      worktreePath = undefined;
    }
  }

  // 상태 업데이트
  globalState.agents.set(agent, {
    name: agent,
    status: "working",
    currentTask: taskId,
    worktree: worktreePath,
  });

  globalState.tasks.set(taskId, {
    id: taskId,
    title: task.substring(0, 100),
    assignee: agent,
    status: "in_progress",
    worktree: worktreePath,
  });

  // 응답 구성
  const response = {
    taskId,
    agent,
    role: config.role,
    permissions: config.permissions,
    worktree: worktreePath,
    priority: priority || "medium",
    systemPrompt: config.systemPrompt,
    task,
    instructions: `
## Task Assignment

**Task ID**: ${taskId}
**Agent**: ${agent} (${config.role})
**Priority**: ${priority || "medium"}
${worktreePath ? `**Worktree**: ${worktreePath}` : ""}

### Your Mission
${task}

### Guidelines
${config.systemPrompt}

### Permissions
You are allowed to: ${config.permissions.join(", ")}

### Reporting
When complete, report:
1. What you implemented/did
2. Files changed
3. Test results (if applicable)
4. Any issues encountered
`
  };

  return {
    content: [{
      type: "text",
      text: JSON.stringify(response, null, 2)
    }],
  };
}
