/**
 * Dispatch Agent Tool
 *
 * 특정 Avengers 에이전트를 태스크에 디스패치합니다.
 * 워크트리 생성 옵션으로 병렬 작업을 지원합니다.
 *
 * Enhanced for Background Task integration with explicit context,
 * execution modes, and dependency management.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { globalState } from "../index.js";
import { execSync } from "child_process";
import {
  AgentType,
  CodeSnippet,
  agentRoles,
  agentPermissions,
  assembleAgentPrompt,
  buildTaskContext
} from "../agent-templates.js";

// Valid agent types
const VALID_AGENTS: AgentType[] = [
  "captain",
  "ironman",
  "natasha",
  "groot",
  "jarvis",
  "dr-strange",
  "vision"
];

/**
 * Enhanced dispatch agent parameters interface
 * Based on parallel agent patterns: .claude/designs/parallel-patterns.md
 */
export interface DispatchAgentParams {
  agent: AgentType;
  task: string;

  // Explicit context (NEW)
  context?: {
    files?: string[];           // Files to include
    snippets?: CodeSnippet[];   // Specific code sections
    references?: string[];      // URLs or doc paths
  };

  // Existing parameters
  worktree?: boolean;
  priority?: "critical" | "high" | "medium" | "low";

  // Execution mode (NEW)
  mode?: "background" | "foreground";  // default: background

  // Output handling (NEW)
  outputFormat?: "summary" | "json" | "full";

  // Dependencies (NEW)
  dependencies?: string[];  // Task IDs that must complete first

  // Additional task metadata (NEW)
  acceptanceCriteria?: string[];
  constraints?: string[];
}

/**
 * Dispatch response structure
 */
export interface DispatchResponse {
  taskId: string;
  agent: AgentType;
  status: "dispatched" | "queued" | "blocked";
  role: string;
  permissions: string[];
  worktree?: string;
  branchName?: string;
  priority: string;
  mode: "background" | "foreground";
  outputFormat: "summary" | "json" | "full";
  dependencies?: string[];
  blockedBy?: string[];  // Pending dependencies
  estimatedDuration?: string;
  agentPrompt: string;
  contextSummary: {
    filesCount: number;
    snippetsCount: number;
    referencesCount: number;
  };
}

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
      context: {
        type: "object",
        description: "Explicit context for the agent (prevents context contamination)",
        properties: {
          files: {
            type: "array",
            items: { type: "string" },
            description: "File paths to include in context"
          },
          snippets: {
            type: "array",
            items: {
              type: "object",
              properties: {
                path: { type: "string" },
                lines: {
                  type: "array",
                  items: { type: "number" },
                  minItems: 2,
                  maxItems: 2
                }
              },
              required: ["path", "lines"]
            },
            description: "Specific code sections to reference"
          },
          references: {
            type: "array",
            items: { type: "string" },
            description: "URLs or documentation paths for reference"
          }
        }
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
      },
      mode: {
        type: "string",
        enum: ["background", "foreground"],
        description: "Execution mode: background (async) or foreground (sync)",
        default: "background"
      },
      outputFormat: {
        type: "string",
        enum: ["summary", "json", "full"],
        description: "Expected output format from the agent",
        default: "summary"
      },
      dependencies: {
        type: "array",
        items: { type: "string" },
        description: "Task IDs that must complete before this task starts"
      },
      acceptanceCriteria: {
        type: "array",
        items: { type: "string" },
        description: "Specific acceptance criteria for the task"
      },
      constraints: {
        type: "array",
        items: { type: "string" },
        description: "Additional constraints for the agent"
      }
    },
    required: ["agent", "task"]
  }
};

/**
 * Check if all dependencies are satisfied
 */
function checkDependencies(dependencies: string[]): {
  satisfied: boolean;
  pending: string[];
} {
  const pending: string[] = [];

  for (const depId of dependencies) {
    const depTask = globalState.tasks.get(depId);
    if (!depTask || depTask.status !== "completed") {
      pending.push(depId);
    }
  }

  return {
    satisfied: pending.length === 0,
    pending
  };
}

/**
 * Estimate task duration based on agent and context
 */
function estimateDuration(
  agent: AgentType,
  context?: DispatchAgentParams["context"]
): string {
  // Base estimates per agent type (in minutes)
  const baseEstimates: Record<AgentType, number> = {
    captain: 5,
    ironman: 30,
    natasha: 25,
    groot: 20,
    jarvis: 15,
    "dr-strange": 20,
    vision: 15
  };

  let estimate = baseEstimates[agent];

  // Adjust based on context complexity
  if (context) {
    const filesCount = context.files?.length || 0;
    const snippetsCount = context.snippets?.length || 0;

    // Add ~5 min per file, ~2 min per snippet
    estimate += filesCount * 5 + snippetsCount * 2;
  }

  if (estimate < 60) {
    return `~${estimate} minutes`;
  } else {
    const hours = Math.round(estimate / 60 * 10) / 10;
    return `~${hours} hours`;
  }
}

export async function handleDispatchAgent(args: Record<string, unknown>) {
  const params = args as unknown as DispatchAgentParams;

  const {
    agent,
    task,
    context,
    worktree = false,
    priority = "medium",
    mode = "background",
    outputFormat = "summary",
    dependencies = [],
    acceptanceCriteria = [],
    constraints = []
  } = params;

  // Validate agent
  if (!VALID_AGENTS.includes(agent)) {
    return {
      content: [{ type: "text", text: `Unknown agent: ${agent}. Valid agents: ${VALID_AGENTS.join(", ")}` }],
      isError: true,
    };
  }

  // Check agent availability
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

  // Check dependencies
  const depCheck = checkDependencies(dependencies);
  const taskStatus = depCheck.satisfied ? "dispatched" : "queued";

  // Generate task ID
  const taskId = `T${String(++globalState.taskCounter).padStart(3, "0")}`;

  // Create worktree if requested
  let worktreePath: string | undefined;
  let branchName: string | undefined;

  if (worktree) {
    branchName = `feature/${taskId}-${agent}`;
    worktreePath = `../avengers-${taskId}`;

    // Only create worktree if task is not blocked
    if (depCheck.satisfied) {
      try {
        execSync(`git worktree add ${worktreePath} -b ${branchName}`, {
          encoding: "utf-8",
          stdio: "pipe"
        });
      } catch (error) {
        console.error(`Warning: Could not create worktree: ${error}`);
        worktreePath = undefined;
        branchName = undefined;
      }
    } else {
      // Defer worktree creation for queued tasks
      worktreePath = `(pending) ../avengers-${taskId}`;
    }
  }

  // Build task context
  const taskContext = buildTaskContext({
    taskId,
    agent,
    task,
    context,
    worktreePath: worktreePath?.startsWith("(pending)") ? undefined : worktreePath,
    branchName,
    outputFormat,
    acceptanceCriteria,
    constraints
  });

  // Assemble the complete agent prompt
  const agentPrompt = assembleAgentPrompt(agent, taskContext);

  // Update global state
  globalState.agents.set(agent, {
    name: agent,
    status: depCheck.satisfied ? "working" : "blocked",
    currentTask: taskId,
    worktree: worktreePath?.startsWith("(pending)") ? undefined : worktreePath,
  });

  globalState.tasks.set(taskId, {
    id: taskId,
    title: task.substring(0, 100),
    assignee: agent,
    status: depCheck.satisfied ? "in_progress" : "pending",
    worktree: worktreePath?.startsWith("(pending)") ? undefined : worktreePath,
  });

  // Build response
  const response: DispatchResponse = {
    taskId,
    agent,
    status: taskStatus,
    role: agentRoles[agent],
    permissions: agentPermissions[agent],
    worktree: worktreePath,
    branchName,
    priority,
    mode,
    outputFormat,
    dependencies: dependencies.length > 0 ? dependencies : undefined,
    blockedBy: depCheck.pending.length > 0 ? depCheck.pending : undefined,
    estimatedDuration: estimateDuration(agent, context),
    agentPrompt,
    contextSummary: {
      filesCount: context?.files?.length || 0,
      snippetsCount: context?.snippets?.length || 0,
      referencesCount: context?.references?.length || 0
    }
  };

  // Format output based on mode
  if (mode === "background") {
    // For background mode, return minimal info with task ID for tracking
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          taskId: response.taskId,
          agent: response.agent,
          status: response.status,
          worktree: response.worktree,
          estimatedDuration: response.estimatedDuration,
          blockedBy: response.blockedBy,
          message: depCheck.satisfied
            ? `Agent ${agent} dispatched for task ${taskId}. Use avengers_get_agent_status to monitor progress.`
            : `Task ${taskId} queued. Waiting for dependencies: ${depCheck.pending.join(", ")}`
        }, null, 2)
      }],
    };
  }

  // For foreground mode, return full response with prompt
  return {
    content: [{
      type: "text",
      text: JSON.stringify(response, null, 2)
    }],
  };
}
