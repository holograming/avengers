/**
 * Stop Process Tool
 *
 * 로컬에서 실행 중인 프로세스를 종료합니다.
 * run-local로 시작한 프로세스를 정리하는데 사용됩니다.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getRunningProcesses, ProcessInfo } from "./run-local.js";

/**
 * Stop result
 */
export interface StopProcessResult {
  success: boolean;
  taskId?: string;
  pid?: number;
  signal: "SIGTERM" | "SIGKILL";
  error?: string;
}

/**
 * Tool definition
 */
export const stopProcessTool: Tool = {
  name: "avengers_stop_process",
  description: "로컬에서 실행 중인 프로세스를 종료합니다. run-local로 시작한 프로세스를 정리합니다.",
  inputSchema: {
    type: "object",
    properties: {
      taskId: {
        type: "string",
        description: "종료할 프로세스의 태스크 ID"
      },
      pid: {
        type: "number",
        description: "직접 지정할 프로세스 ID (taskId 대신 사용)"
      },
      force: {
        type: "boolean",
        description: "강제 종료 여부 (SIGKILL, 기본: false)"
      },
      all: {
        type: "boolean",
        description: "모든 실행 중인 프로세스 종료 (기본: false)"
      }
    }
  }
};

/**
 * Stop process parameters
 */
interface StopProcessParams {
  taskId?: string;
  pid?: number;
  force?: boolean;
  all?: boolean;
}

/**
 * Kill a process by PID
 */
function killProcess(pid: number, force: boolean): {
  success: boolean;
  signal: "SIGTERM" | "SIGKILL";
  error?: string;
} {
  const signal = force ? "SIGKILL" : "SIGTERM";

  try {
    // Try to kill the process group (negative PID)
    try {
      process.kill(-pid, signal);
    } catch {
      // If process group kill fails, try direct kill
      process.kill(pid, signal);
    }

    return { success: true, signal };
  } catch (error: any) {
    // Check if process doesn't exist
    if (error.code === "ESRCH") {
      return { success: true, signal, error: "프로세스가 이미 종료되었습니다." };
    }

    return {
      success: false,
      signal,
      error: error.message
    };
  }
}

/**
 * Main handler
 */
export async function handleStopProcess(args: Record<string, unknown>) {
  const params = args as unknown as StopProcessParams;
  const { taskId, pid: directPid, force = false, all = false } = params;

  const runningProcesses = getRunningProcesses();

  // Handle "stop all" case
  if (all) {
    const results: StopProcessResult[] = [];

    for (const [tid, processInfo] of runningProcesses.entries()) {
      const killResult = killProcess(processInfo.pid, force);
      results.push({
        success: killResult.success,
        taskId: tid,
        pid: processInfo.pid,
        signal: killResult.signal,
        error: killResult.error
      });

      if (killResult.success) {
        runningProcesses.delete(tid);
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.length - successCount;

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: failCount === 0,
          message: `${successCount}개 프로세스 종료 완료${failCount > 0 ? `, ${failCount}개 실패` : ""}`,
          results
        }, null, 2)
      }]
    };
  }

  // Find process to stop
  let targetPid: number | undefined;
  let targetTaskId: string | undefined;

  if (directPid) {
    // Direct PID specified
    targetPid = directPid;

    // Try to find associated task
    for (const [tid, processInfo] of runningProcesses.entries()) {
      if (processInfo.pid === directPid) {
        targetTaskId = tid;
        break;
      }
    }
  } else if (taskId) {
    // Task ID specified
    const processInfo = runningProcesses.get(taskId);

    if (!processInfo) {
      // List available processes
      const available = Array.from(runningProcesses.entries()).map(([tid, info]) => ({
        taskId: tid,
        pid: info.pid,
        command: info.command,
        uptime: Date.now() - info.startTime
      }));

      return {
        content: [{
          type: "text",
          text: JSON.stringify({
            success: false,
            error: `태스크 ${taskId}에 대한 실행 중인 프로세스를 찾을 수 없습니다.`,
            availableProcesses: available,
            suggestion: available.length > 0
              ? "위 목록에서 올바른 taskId를 선택하거나 pid를 직접 지정해주세요."
              : "현재 실행 중인 프로세스가 없습니다."
          }, null, 2)
        }],
        isError: true
      };
    }

    targetPid = processInfo.pid;
    targetTaskId = taskId;
  } else {
    // No identifier specified
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          success: false,
          error: "taskId 또는 pid를 지정해주세요.",
          suggestion: "taskId, pid, 또는 all=true 중 하나를 사용해주세요."
        }, null, 2)
      }],
      isError: true
    };
  }

  // Kill the process
  const killResult = killProcess(targetPid, force);

  // Remove from tracking if successful
  if (killResult.success && targetTaskId) {
    runningProcesses.delete(targetTaskId);
  }

  const result: StopProcessResult = {
    success: killResult.success,
    taskId: targetTaskId,
    pid: targetPid,
    signal: killResult.signal,
    error: killResult.error
  };

  // Build message
  const message = buildResultMessage(result);

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        ...result,
        message,
        nextAction: result.success
          ? {
              action: "continue",
              message: "프로세스 종료 완료. 다음 단계로 진행하세요."
            }
          : {
              action: "retry",
              message: "종료 실패. force=true로 강제 종료를 시도하세요."
            }
      }, null, 2)
    }]
  };
}

/**
 * Build human-readable result message
 */
function buildResultMessage(result: StopProcessResult): string {
  const lines: string[] = [
    `## 프로세스 종료 결과`,
    ``,
    `**상태**: ${result.success ? "✅ 종료됨" : "❌ 종료 실패"}`,
  ];

  if (result.taskId) {
    lines.push(`**태스크**: ${result.taskId}`);
  }

  if (result.pid) {
    lines.push(`**PID**: ${result.pid}`);
  }

  lines.push(`**시그널**: ${result.signal}`);

  if (result.error) {
    lines.push(`**메시지**: ${result.error}`);
  }

  return lines.join("\n");
}
