/**
 * Collect Results Tool
 *
 * 여러 백그라운드 태스크의 결과를 수집하고 집계합니다.
 * 실행 중인 태스크를 대기하고, 결과를 집계하며, 파일 충돌을 감지합니다.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { globalState, AgentState, TaskState } from "../index.js";
import { execSync } from "child_process";

// AgentType 정의
export type AgentType = "captain" | "ironman" | "natasha" | "groot" | "jarvis" | "dr-strange" | "vision";

// 태스크 결과 상태
export type TaskResultStatus = "success" | "failure" | "timeout" | "cancelled" | "running";

// 태스크 결과 인터페이스
export interface TaskResult {
  taskId: string;
  agent: AgentType;
  status: TaskResultStatus;
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
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  error?: {
    message: string;
    stack?: string;
  };
}

// 파일 충돌 정보
export interface FileConflict {
  file: string;
  agents: string[];
}

// 집계된 결과 인터페이스
export interface AggregatedResults {
  tasks: TaskResult[];
  allSucceeded: boolean;
  failedTasks: string[];
  totalFilesChanged: number;
  totalTestsPassed: number;
  totalTestsFailed: number;
  conflicts: FileConflict[];
  summary: string;
}

// 도구 정의
export const collectResultsTool: Tool = {
  name: "avengers_collect_results",
  description: "Collect and aggregate results from multiple background tasks. Waits for running tasks (with timeout), detects file conflicts, and generates an executive summary.",
  inputSchema: {
    type: "object",
    properties: {
      taskIds: {
        type: "array",
        items: { type: "string" },
        description: "Task IDs to collect results from (e.g., ['T001', 'T002'])"
      },
      timeout: {
        type: "number",
        description: "Max wait time in milliseconds for running tasks (default: 60000)"
      },
      format: {
        type: "string",
        enum: ["summary", "detailed", "json"],
        description: "Output format (default: 'summary')"
      }
    },
    required: ["taskIds"]
  }
};

/**
 * 지정된 시간만큼 대기
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * 워크트리에서 변경된 파일 목록 가져오기
 */
function getChangedFilesFromWorktree(worktreePath: string): string[] {
  try {
    const output = execSync(`git -C "${worktreePath}" diff --name-only HEAD~1 HEAD 2>/dev/null || git -C "${worktreePath}" diff --name-only`, {
      encoding: "utf-8",
      timeout: 5000
    });
    return output.split("\n").filter(line => line.trim());
  } catch {
    // 워크트리에서 변경 파일을 가져올 수 없는 경우 빈 배열 반환
    return [];
  }
}

/**
 * 워크트리에서 최신 커밋 SHA 가져오기
 */
function getLatestCommitSha(worktreePath: string): string | undefined {
  try {
    return execSync(`git -C "${worktreePath}" rev-parse --short HEAD`, {
      encoding: "utf-8",
      timeout: 5000
    }).trim();
  } catch {
    return undefined;
  }
}

/**
 * 파일 충돌 감지: 같은 파일이 여러 에이전트에 의해 수정되었는지 확인
 */
function detectFileConflicts(results: TaskResult[]): FileConflict[] {
  const fileAgentMap = new Map<string, string[]>();

  for (const result of results) {
    if (result.status === "success" || result.status === "running") {
      for (const file of result.output.changedFiles) {
        const agents = fileAgentMap.get(file) || [];
        agents.push(result.agent);
        fileAgentMap.set(file, agents);
      }
    }
  }

  const conflicts: FileConflict[] = [];
  fileAgentMap.forEach((agents, file) => {
    if (agents.length > 1) {
      conflicts.push({ file, agents });
    }
  });

  return conflicts;
}

/**
 * 실행 요약 생성
 */
function generateExecutiveSummary(results: AggregatedResults): string {
  const successCount = results.tasks.filter(t => t.status === "success").length;
  const failureCount = results.failedTasks.length;
  const runningCount = results.tasks.filter(t => t.status === "running").length;
  const totalTasks = results.tasks.length;

  let summary = `## Execution Summary\n\n`;
  summary += `**Tasks Collected**: ${totalTasks}\n`;
  summary += `- Succeeded: ${successCount}\n`;
  summary += `- Failed: ${failureCount}\n`;
  if (runningCount > 0) {
    summary += `- Still Running: ${runningCount}\n`;
  }
  summary += `\n`;

  summary += `**Files Changed**: ${results.totalFilesChanged}\n`;
  summary += `**Tests Passed**: ${results.totalTestsPassed}\n`;
  summary += `**Tests Failed**: ${results.totalTestsFailed}\n\n`;

  if (results.conflicts.length > 0) {
    summary += `### Conflicts Detected\n\n`;
    summary += `**Warning**: The following files were modified by multiple agents:\n`;
    for (const conflict of results.conflicts) {
      summary += `- \`${conflict.file}\` (agents: ${conflict.agents.join(", ")})\n`;
    }
    summary += `\n`;
  }

  if (results.failedTasks.length > 0) {
    summary += `### Failed Tasks\n\n`;
    for (const taskId of results.failedTasks) {
      const task = results.tasks.find(t => t.taskId === taskId);
      if (task) {
        summary += `- **${taskId}** (${task.agent}): ${task.error?.message || "Unknown error"}\n`;
      }
    }
    summary += `\n`;
  }

  summary += `### Task Details\n\n`;
  for (const task of results.tasks) {
    const statusIcon = task.status === "success" ? "[OK]" :
                       task.status === "failure" ? "[FAIL]" :
                       task.status === "timeout" ? "[TIMEOUT]" :
                       task.status === "running" ? "[RUNNING]" : "[CANCELLED]";
    summary += `- ${statusIcon} **${task.taskId}** (${task.agent}): ${task.output.summary}\n`;
    if (task.output.changedFiles.length > 0) {
      summary += `  - Files: ${task.output.changedFiles.slice(0, 3).join(", ")}${task.output.changedFiles.length > 3 ? ` +${task.output.changedFiles.length - 3} more` : ""}\n`;
    }
    if (task.duration) {
      summary += `  - Duration: ${(task.duration / 1000).toFixed(1)}s\n`;
    }
  }

  return summary;
}

/**
 * 태스크 상태를 TaskResult로 변환
 */
function taskStateToResult(taskState: TaskState, agentState: AgentState | undefined): TaskResult {
  const now = new Date();
  const changedFiles = taskState.worktree ? getChangedFilesFromWorktree(taskState.worktree) : [];
  const commitSha = taskState.worktree ? getLatestCommitSha(taskState.worktree) : undefined;

  // 상태 매핑
  let status: TaskResultStatus;
  if (taskState.status === "completed") {
    status = "success";
  } else if (taskState.status === "in_progress") {
    status = "running";
  } else {
    status = "running"; // pending도 일단 running으로 처리
  }

  return {
    taskId: taskState.id,
    agent: (taskState.assignee || "unknown") as AgentType,
    status,
    output: {
      summary: taskState.title,
      changedFiles,
      commitSha
    },
    startedAt: now, // 실제 시작 시간이 없으므로 현재 시간 사용
    completedAt: taskState.status === "completed" ? now : undefined,
    duration: undefined
  };
}

/**
 * Collect Results 핸들러
 */
export async function handleCollectResults(args: Record<string, unknown>) {
  const {
    taskIds,
    timeout = 60000,
    format = "summary"
  } = args as {
    taskIds: string[];
    timeout?: number;
    format?: "summary" | "detailed" | "json";
  };

  // 입력 검증
  if (!taskIds || !Array.isArray(taskIds) || taskIds.length === 0) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: "taskIds is required and must be a non-empty array",
          example: { taskIds: ["T001", "T002"] }
        }, null, 2)
      }],
      isError: true,
    };
  }

  const results: TaskResult[] = [];
  const missingTasks: string[] = [];
  const startTime = Date.now();
  const maxTimeout = Math.min(timeout, 300000); // 최대 5분으로 제한

  // 태스크 상태 수집 및 대기
  for (const taskId of taskIds) {
    const taskState = globalState.tasks.get(taskId);

    if (!taskState) {
      missingTasks.push(taskId);
      continue;
    }

    const agentState = taskState.assignee ? globalState.agents.get(taskState.assignee) : undefined;

    // 실행 중인 태스크는 완료될 때까지 대기 (타임아웃 적용)
    if (taskState.status === "in_progress") {
      let waited = 0;
      const pollInterval = 1000; // 1초마다 확인

      while (taskState.status === "in_progress" && waited < maxTimeout) {
        await sleep(pollInterval);
        waited += pollInterval;

        // 태스크 상태 다시 확인
        const updatedTask = globalState.tasks.get(taskId);
        if (updatedTask && updatedTask.status !== "in_progress") {
          break;
        }
      }

      // 타임아웃 발생
      if (waited >= maxTimeout && taskState.status === "in_progress") {
        results.push({
          taskId,
          agent: (taskState.assignee || "unknown") as AgentType,
          status: "timeout",
          output: {
            summary: `Task timed out after ${maxTimeout / 1000}s: ${taskState.title}`,
            changedFiles: taskState.worktree ? getChangedFilesFromWorktree(taskState.worktree) : []
          },
          startedAt: new Date(startTime),
          completedAt: new Date(),
          duration: waited,
          error: {
            message: `Task did not complete within ${maxTimeout / 1000} seconds`
          }
        });
        continue;
      }
    }

    // 결과 수집
    results.push(taskStateToResult(taskState, agentState));
  }

  // 누락된 태스크 처리
  for (const taskId of missingTasks) {
    results.push({
      taskId,
      agent: "unknown" as AgentType,
      status: "failure",
      output: {
        summary: `Task not found: ${taskId}`,
        changedFiles: []
      },
      startedAt: new Date(),
      error: {
        message: `Task ${taskId} does not exist in the task registry`
      }
    });
  }

  // 파일 충돌 감지
  const conflicts = detectFileConflicts(results);

  // 집계
  const allChangedFiles = new Set<string>();
  let totalTestsPassed = 0;
  let totalTestsFailed = 0;

  for (const result of results) {
    result.output.changedFiles.forEach(f => allChangedFiles.add(f));
    if (result.output.testResults) {
      totalTestsPassed += result.output.testResults.passed;
      totalTestsFailed += result.output.testResults.failed;
    }
  }

  const failedTasks = results
    .filter(r => r.status === "failure" || r.status === "timeout")
    .map(r => r.taskId);

  const aggregated: AggregatedResults = {
    tasks: results,
    allSucceeded: failedTasks.length === 0 && results.every(r => r.status === "success"),
    failedTasks,
    totalFilesChanged: allChangedFiles.size,
    totalTestsPassed,
    totalTestsFailed,
    conflicts,
    summary: ""
  };

  // 요약 생성
  aggregated.summary = generateExecutiveSummary(aggregated);

  // 출력 형식에 따라 응답 구성
  let responseText: string;

  switch (format) {
    case "json":
      responseText = JSON.stringify({
        results: aggregated.tasks,
        summary: {
          allSucceeded: aggregated.allSucceeded,
          failedTasks: aggregated.failedTasks,
          totalFilesChanged: aggregated.totalFilesChanged,
          totalTestsPassed: aggregated.totalTestsPassed,
          totalTestsFailed: aggregated.totalTestsFailed,
          conflicts: aggregated.conflicts
        },
        ready: aggregated.allSucceeded && aggregated.conflicts.length === 0
      }, null, 2);
      break;

    case "detailed":
      responseText = JSON.stringify({
        executiveSummary: aggregated.summary,
        tasks: aggregated.tasks.map(t => ({
          taskId: t.taskId,
          agent: t.agent,
          status: t.status,
          summary: t.output.summary,
          changedFiles: t.output.changedFiles,
          testResults: t.output.testResults,
          commitSha: t.output.commitSha,
          duration: t.duration ? `${(t.duration / 1000).toFixed(1)}s` : null,
          error: t.error
        })),
        aggregation: {
          totalTasks: results.length,
          succeeded: results.filter(r => r.status === "success").length,
          failed: failedTasks.length,
          running: results.filter(r => r.status === "running").length,
          timedOut: results.filter(r => r.status === "timeout").length
        },
        conflicts: aggregated.conflicts,
        filesChanged: Array.from(allChangedFiles),
        ready: aggregated.allSucceeded && aggregated.conflicts.length === 0
      }, null, 2);
      break;

    case "summary":
    default:
      responseText = aggregated.summary + "\n" + JSON.stringify({
        ready: aggregated.allSucceeded && aggregated.conflicts.length === 0,
        tasksCollected: results.length,
        succeeded: results.filter(r => r.status === "success").length,
        failed: failedTasks.length,
        conflictsDetected: conflicts.length
      }, null, 2);
      break;
  }

  return {
    content: [{
      type: "text",
      text: responseText
    }],
  };
}
