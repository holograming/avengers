/**
 * Execute Group Tool
 *
 * ExecutionGroup 단위로 작업을 실행합니다.
 * 그룹 내 작업은 병렬로 실행되며, Claude의 Task 도구 호출에 필요한 정보를 반환합니다.
 *
 * v3: DAG 기반 의존성 관리
 * - waitForGroups: 선행 그룹 완료 후 실행
 * - 그룹 내 작업은 병렬 실행 (run_in_background: true)
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { globalState } from "../index.js";
import { execSync } from "child_process";
import { ExecutionGroup, ExecutionTask } from "./analyze-request.js";

/**
 * Task 호출 정보
 */
export interface TaskCallInfo {
  taskId: string;
  subagentType: "Explore" | "Plan" | "general-purpose";
  description: string;
  prompt: string;
  runInBackground: boolean;
}

/**
 * Execute Group 응답
 */
export interface ExecuteGroupResponse {
  groupId: string;
  groupName: string;
  taskCount: number;
  taskCalls: TaskCallInfo[];
  waitForGroups: string[];
  instruction: string;
}

/**
 * Execute Group 파라미터
 */
export interface ExecuteGroupParams {
  group: ExecutionGroup;
  worktree?: boolean;
}

/**
 * Tool definition
 */
export const executeGroupTool: Tool = {
  name: "avengers_execute_group",
  description: `ExecutionGroup 단위로 작업을 실행합니다. 그룹 내 작업은 병렬로 실행되며, Task 도구 호출에 필요한 정보를 반환합니다.

사용 시나리오:
1. avengers_analyze_request로 executionPlan을 얻음
2. executionPlan.groups를 순회하며 이 도구 호출
3. 반환된 taskCalls로 Task 도구 병렬 호출
4. waitForGroups가 있으면 해당 그룹 완료 대기 후 실행`,
  inputSchema: {
    type: "object",
    properties: {
      group: {
        type: "object",
        description: "실행할 ExecutionGroup 객체",
        properties: {
          groupId: { type: "string" },
          groupName: { type: "string" },
          tasks: {
            type: "array",
            items: {
              type: "object",
              properties: {
                taskId: { type: "string" },
                agent: { type: "string" },
                role: { type: "string" },
                description: { type: "string" },
                priority: { type: "string" },
                prompt: { type: "string" }
              }
            }
          },
          waitForGroups: {
            type: "array",
            items: { type: "string" }
          },
          subagentType: {
            type: "string",
            enum: ["Explore", "Plan", "general-purpose"]
          }
        },
        required: ["groupId", "groupName", "tasks", "subagentType"]
      },
      worktree: {
        type: "boolean",
        description: "개발 작업에 worktree 생성 여부 (기본: true)",
        default: true
      }
    },
    required: ["group"]
  }
};

/**
 * Main handler
 */
export async function handleExecuteGroup(args: Record<string, unknown>) {
  const params = args as unknown as ExecuteGroupParams;
  const { group, worktree = true } = params;

  if (!group || !group.groupId || !group.tasks) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: "유효하지 않은 그룹 정보입니다.",
          suggestion: "avengers_analyze_request의 executionPlan.groups에서 그룹을 가져와 사용하세요."
        }, null, 2)
      }],
      isError: true
    };
  }

  const taskCalls: TaskCallInfo[] = [];

  for (const task of group.tasks) {
    // Worktree 생성 (개발 작업에만, general-purpose)
    if (worktree && group.subagentType === "general-purpose") {
      const branchName = `feature/${task.taskId}-${task.agent}`;
      try {
        execSync(`git worktree add ../avengers-${task.taskId} -b ${branchName}`, {
          encoding: "utf-8",
          stdio: "pipe"
        });
      } catch (e) {
        // 이미 존재하면 무시
        console.log(`Worktree already exists or failed: ${task.taskId}`);
      }
    }

    // 상태 등록
    globalState.tasks.set(task.taskId, {
      id: task.taskId,
      title: task.description,
      assignee: task.agent,
      status: "in_progress",
      worktree: worktree && group.subagentType === "general-purpose"
        ? `../avengers-${task.taskId}`
        : undefined
    });

    globalState.agents.set(task.agent, {
      name: task.agent,
      status: "working",
      currentTask: task.taskId,
      worktree: worktree && group.subagentType === "general-purpose"
        ? `../avengers-${task.taskId}`
        : undefined
    });

    // Task 호출 정보 생성
    taskCalls.push({
      taskId: task.taskId,
      subagentType: group.subagentType,
      description: `${task.agent}: ${task.description}`,
      prompt: task.prompt,
      runInBackground: true
    });
  }

  // 응답 생성
  const response: ExecuteGroupResponse = {
    groupId: group.groupId,
    groupName: group.groupName,
    taskCount: taskCalls.length,
    taskCalls,
    waitForGroups: group.waitForGroups || [],
    instruction: generateInstruction(group, taskCalls)
  };

  return {
    content: [{
      type: "text",
      text: JSON.stringify(response, null, 2)
    }]
  };
}

/**
 * 실행 지시 생성
 */
function generateInstruction(group: ExecutionGroup, taskCalls: TaskCallInfo[]): string {
  const lines: string[] = [];

  // 의존성 안내
  if (group.waitForGroups && group.waitForGroups.length > 0) {
    lines.push(`**의존성**: ${group.waitForGroups.join(", ")} 그룹 완료 후 실행`);
    lines.push(``);
  }

  // 실행 지시
  if (taskCalls.length > 1) {
    lines.push(`**[${group.groupName}] ${taskCalls.length}개 작업을 단일 응답에서 병렬 호출하세요:**`);
    lines.push(``);
    lines.push("```");
    for (const tc of taskCalls) {
      lines.push(`Task({`);
      lines.push(`  subagent_type: "${tc.subagentType}",`);
      lines.push(`  description: "${tc.description}",`);
      lines.push(`  prompt: "${tc.taskId} prompt...",`);
      lines.push(`  run_in_background: true`);
      lines.push(`})`);
      lines.push(``);
    }
    lines.push("```");
    lines.push(``);
    lines.push(`**중요**: 위 ${taskCalls.length}개의 Task 호출을 **하나의 응답**에서 모두 수행해야 병렬 실행됩니다.`);
  } else {
    lines.push(`**[${group.groupName}] ${taskCalls[0].description} 실행:**`);
    lines.push(``);
    lines.push("```");
    lines.push(`Task({`);
    lines.push(`  subagent_type: "${taskCalls[0].subagentType}",`);
    lines.push(`  description: "${taskCalls[0].description}",`);
    lines.push(`  prompt: "${taskCalls[0].taskId} prompt...",`);
    lines.push(`  run_in_background: true`);
    lines.push(`})`);
    lines.push("```");
  }

  // 완료 대기 안내
  lines.push(``);
  lines.push(`**완료 후**: TaskOutput으로 결과 수집 후 다음 그룹 진행`);

  return lines.join("\n");
}
