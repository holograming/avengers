/**
 * Save State Tool
 *
 * 현재 에이전트/태스크 상태를 파일에 저장합니다.
 * 상태는 .claude/state/ 디렉토리에 JSON 형식으로 저장됩니다.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { globalState, AgentState, TaskState } from "../index.js";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";

// 저장 상태 인터페이스
export interface SavedState {
  version: string;
  timestamp: string;
  branch: string;
  commit: string;
  taskCounter: number;
  agents: Array<AgentState>;
  tasks: Array<TaskState & { description?: string; priority?: string; dependencies?: string[] }>;
  worktrees: Array<{
    path: string;
    branch: string;
    taskId: string;
    agent: string;
  }>;
  metadata: {
    savedBy: string;
    reason?: string;
  };
  // Assemble 전용 상태 정보
  assembleInfo?: {
    request: string;
    analysisData?: Record<string, unknown>;
    mode?: "planning" | "execution";
    workflow?: string;
    completionLevel?: string;
    researchResults?: string;
    plannedTasks?: Array<{
      title: string;
      assignee: string;
      description?: string;
    }>;
  };
}

export const saveStateTool: Tool = {
  name: "avengers_save_state",
  description: "Save current agent/task state to a file. Use to persist session state for later restoration. State is saved to .claude/state/ directory.",
  inputSchema: {
    type: "object",
    properties: {
      reason: {
        type: "string",
        description: "Optional reason or description for saving state"
      },
      filename: {
        type: "string",
        description: "Optional custom filename (without extension). Defaults to timestamp-based name."
      },
      assembleInfo: {
        type: "object",
        description: "Optional Assemble-specific state information (for Plan mode integration)",
        properties: {
          request: { type: "string" },
          analysisData: { type: "object" },
          mode: { type: "string", enum: ["planning", "execution"] },
          workflow: { type: "string" },
          completionLevel: { type: "string" },
          researchResults: { type: "string" },
          plannedTasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                title: { type: "string" },
                assignee: { type: "string" },
                description: { type: "string" }
              }
            }
          }
        }
      }
    },
    required: []
  }
};

export async function handleSaveState(args: Record<string, unknown>) {
  const { reason, filename, assembleInfo } = args as {
    reason?: string;
    filename?: string;
    assembleInfo?: SavedState["assembleInfo"];
  };

  try {
    // 프로젝트 루트 디렉토리 찾기
    let projectRoot: string;
    try {
      projectRoot = execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
    } catch {
      return {
        content: [{ type: "text", text: "Error: Not in a git repository. Cannot determine project root." }],
        isError: true,
      };
    }

    // .claude/state 디렉토리 생성
    const stateDir = path.join(projectRoot, ".claude", "state");
    if (!fs.existsSync(stateDir)) {
      fs.mkdirSync(stateDir, { recursive: true });
    }

    // 현재 git 정보 가져오기
    let branch = "unknown";
    let commit = "unknown";
    try {
      branch = execSync("git branch --show-current", { encoding: "utf-8" }).trim();
      commit = execSync("git rev-parse --short HEAD", { encoding: "utf-8" }).trim();
    } catch {
      // Git 정보를 가져오지 못해도 계속 진행
    }

    // 타임스탬프 생성
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, "-");

    // 상태 객체 생성
    const agents: AgentState[] = [];
    globalState.agents.forEach((state) => {
      agents.push({ ...state });
    });

    const tasks: Array<TaskState & { description?: string; priority?: string; dependencies?: string[] }> = [];
    globalState.tasks.forEach((state) => {
      tasks.push({ ...state });
    });

    // 활성 워크트리 정보 수집
    const worktrees: SavedState["worktrees"] = [];
    globalState.tasks.forEach((task) => {
      if (task.worktree && task.assignee) {
        worktrees.push({
          path: task.worktree,
          branch: `feature/${task.id}-${task.assignee}`,
          taskId: task.id,
          agent: task.assignee,
        });
      }
    });

    const savedState: SavedState = {
      version: "1.0.0",
      timestamp: now.toISOString(),
      branch,
      commit,
      taskCounter: globalState.taskCounter,
      agents,
      tasks,
      worktrees,
      metadata: {
        savedBy: "avengers-core",
        reason,
      },
      ...(assembleInfo && { assembleInfo }),
    };

    // 파일명 결정
    const stateFilename = filename || timestamp;
    const statePath = path.join(stateDir, `${stateFilename}.json`);

    // 상태 저장
    fs.writeFileSync(statePath, JSON.stringify(savedState, null, 2), "utf-8");

    // latest.json 업데이트 (복사)
    const latestPath = path.join(stateDir, "latest.json");
    fs.writeFileSync(latestPath, JSON.stringify(savedState, null, 2), "utf-8");

    // 요약 정보 생성
    const summary = {
      message: "State saved successfully",
      file: statePath,
      latestUpdated: true,
      summary: {
        agents: {
          total: agents.length,
          idle: agents.filter(a => a.status === "idle").length,
          working: agents.filter(a => a.status === "working").length,
          blocked: agents.filter(a => a.status === "blocked").length,
        },
        tasks: {
          total: tasks.length,
          pending: tasks.filter(t => t.status === "pending").length,
          inProgress: tasks.filter(t => t.status === "in_progress").length,
          review: tasks.filter(t => t.status === "review").length,
          completed: tasks.filter(t => t.status === "completed").length,
        },
        worktrees: worktrees.length,
      },
      timestamp: now.toISOString(),
      branch,
      commit,
    };

    return {
      content: [{
        type: "text",
        text: JSON.stringify(summary, null, 2)
      }],
    };
  } catch (error) {
    return {
      content: [{
        type: "text",
        text: `Error saving state: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true,
    };
  }
}
