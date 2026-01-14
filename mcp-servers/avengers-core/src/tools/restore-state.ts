/**
 * Restore State Tool
 *
 * 저장된 상태 파일에서 에이전트/태스크 상태를 복원합니다.
 * .claude/state/ 디렉토리에서 상태를 로드합니다.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { globalState, AgentState, TaskState } from "../index.js";
import { execSync } from "child_process";
import * as fs from "fs";
import * as path from "path";
import { SavedState } from "./save-state.js";

// 복원 결과 인터페이스
interface RestoreResult {
  agents: {
    restored: number;
    skipped: number;
  };
  tasks: {
    restored: number;
    skipped: number;
  };
  worktrees: {
    valid: number;
    missing: number;
    details: Array<{ path: string; exists: boolean; taskId: string }>;
  };
  assembleInfo?: SavedState["assembleInfo"];
}

export const restoreStateTool: Tool = {
  name: "avengers_restore_state",
  description: "Restore state from a saved file. Use to resume a previous session. Loads from .claude/state/ directory. By default loads the latest saved state.",
  inputSchema: {
    type: "object",
    properties: {
      filename: {
        type: "string",
        description: "Specific state file to restore (without .json extension). Defaults to 'latest'."
      },
      validateWorktrees: {
        type: "boolean",
        description: "Whether to validate that worktrees still exist on disk. Defaults to true.",
        default: true
      },
      resetMissing: {
        type: "boolean",
        description: "Reset agents to idle if their worktree is missing. Defaults to true.",
        default: true
      }
    },
    required: []
  }
};

export async function handleRestoreState(args: Record<string, unknown>) {
  const {
    filename = "latest",
    validateWorktrees = true,
    resetMissing = true
  } = args as {
    filename?: string;
    validateWorktrees?: boolean;
    resetMissing?: boolean;
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

    // 상태 파일 경로
    const stateDir = path.join(projectRoot, ".claude", "state");
    const statePath = path.join(stateDir, `${filename}.json`);

    // 파일 존재 확인
    if (!fs.existsSync(statePath)) {
      // 사용 가능한 상태 파일 목록 제공
      let availableFiles: string[] = [];
      if (fs.existsSync(stateDir)) {
        availableFiles = fs.readdirSync(stateDir)
          .filter(f => f.endsWith(".json"))
          .map(f => f.replace(".json", ""));
      }

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            error: `State file not found: ${statePath}`,
            availableFiles: availableFiles.length > 0 ? availableFiles : "No saved states found",
            hint: "Use 'avengers_save_state' to save current state first."
          }, null, 2)
        }],
        isError: true,
      };
    }

    // 상태 파일 로드
    const stateContent = fs.readFileSync(statePath, "utf-8");
    let savedState: SavedState;
    try {
      savedState = JSON.parse(stateContent);
    } catch {
      return {
        content: [{ type: "text", text: `Error: Invalid JSON in state file: ${statePath}` }],
        isError: true,
      };
    }

    // 버전 확인
    if (!savedState.version) {
      return {
        content: [{ type: "text", text: "Error: State file missing version information. May be corrupted." }],
        isError: true,
      };
    }

    // 복원 결과 추적
    const result: RestoreResult = {
      agents: { restored: 0, skipped: 0 },
      tasks: { restored: 0, skipped: 0 },
      worktrees: { valid: 0, missing: 0, details: [] },
      ...(savedState.assembleInfo && { assembleInfo: savedState.assembleInfo }),
    };

    // 워크트리 유효성 검사
    const validWorktrees = new Set<string>();
    if (validateWorktrees && savedState.worktrees) {
      for (const wt of savedState.worktrees) {
        const wtPath = path.isAbsolute(wt.path)
          ? wt.path
          : path.join(projectRoot, wt.path);

        const exists = fs.existsSync(wtPath);
        result.worktrees.details.push({
          path: wt.path,
          exists,
          taskId: wt.taskId,
        });

        if (exists) {
          validWorktrees.add(wt.taskId);
          result.worktrees.valid++;
        } else {
          result.worktrees.missing++;
        }
      }
    }

    // 태스크 카운터 복원
    globalState.taskCounter = savedState.taskCounter || 0;

    // 태스크 복원
    globalState.tasks.clear();
    if (savedState.tasks) {
      for (const task of savedState.tasks) {
        // 워크트리가 없어진 경우 처리
        if (task.worktree && validateWorktrees && !validWorktrees.has(task.id)) {
          if (resetMissing) {
            // 워크트리 정보 제거
            task.worktree = undefined;
            // 진행 중이었던 태스크는 pending으로 변경
            if (task.status === "in_progress") {
              task.status = "pending";
            }
          }
        }

        globalState.tasks.set(task.id, {
          id: task.id,
          title: task.title,
          assignee: task.assignee,
          status: task.status,
          worktree: task.worktree,
        });
        result.tasks.restored++;
      }
    }

    // 에이전트 복원
    // 먼저 기본 에이전트 목록으로 초기화
    const agentNames = ["captain", "ironman", "natasha", "groot", "jarvis", "dr-strange", "vision"];
    for (const name of agentNames) {
      globalState.agents.set(name, { name, status: "idle" });
    }

    // 저장된 상태로 업데이트
    if (savedState.agents) {
      for (const agent of savedState.agents) {
        // 워크트리가 없어진 경우 처리
        let agentState: AgentState = { ...agent };

        if (agent.worktree && validateWorktrees && agent.currentTask) {
          if (!validWorktrees.has(agent.currentTask) && resetMissing) {
            // 워크트리가 없으면 idle 상태로 리셋
            agentState = {
              name: agent.name,
              status: "idle",
              currentTask: undefined,
              worktree: undefined,
            };
          }
        }

        globalState.agents.set(agent.name, agentState);
        result.agents.restored++;
      }
    }

    // 복원 요약 생성
    const summary = {
      message: "State restored successfully",
      file: statePath,
      originalTimestamp: savedState.timestamp,
      originalBranch: savedState.branch,
      originalCommit: savedState.commit,
      result: {
        agents: result.agents,
        tasks: result.tasks,
        worktrees: validateWorktrees ? result.worktrees : "validation skipped",
      },
      currentState: {
        agents: {
          total: globalState.agents.size,
          idle: Array.from(globalState.agents.values()).filter(a => a.status === "idle").length,
          working: Array.from(globalState.agents.values()).filter(a => a.status === "working").length,
          blocked: Array.from(globalState.agents.values()).filter(a => a.status === "blocked").length,
        },
        tasks: {
          total: globalState.tasks.size,
          pending: Array.from(globalState.tasks.values()).filter(t => t.status === "pending").length,
          inProgress: Array.from(globalState.tasks.values()).filter(t => t.status === "in_progress").length,
          review: Array.from(globalState.tasks.values()).filter(t => t.status === "review").length,
          completed: Array.from(globalState.tasks.values()).filter(t => t.status === "completed").length,
        },
      },
      warnings: result.worktrees.missing > 0
        ? [`${result.worktrees.missing} worktree(s) no longer exist and were reset`]
        : [],
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
        text: `Error restoring state: ${error instanceof Error ? error.message : String(error)}`
      }],
      isError: true,
    };
  }
}
