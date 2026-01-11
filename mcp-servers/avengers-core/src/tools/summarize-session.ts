/**
 * Summarize Session Tool
 *
 * 현재 세션을 요약하여 다음 세션에서 컨텍스트를 효율적으로 복원할 수 있도록 합니다.
 * 완료된 작업, 변경된 파일, 주요 결정사항, 다음 단계를 포함한 마크다운 요약을 생성합니다.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { globalState } from "../index.js";
import { execSync } from "child_process";

// 작업 아이템 인터페이스
interface TaskItem {
  id?: string;
  title: string;
  outcome?: string;
  status?: string;
}

// 결정사항 인터페이스
interface DecisionItem {
  topic: string;
  decision: string;
  rationale?: string;
}

// 다음 단계 인터페이스
interface NextStepItem {
  task: string;
  priority?: "critical" | "high" | "medium" | "low";
  assignee?: string;
}

export const summarizeSessionTool: Tool = {
  name: "avengers_summarize_session",
  description: "Summarize current session for efficient context restoration. Generates a markdown summary with completed tasks, key decisions, and next steps suitable for .claude/resume/latest.md",
  inputSchema: {
    type: "object",
    properties: {
      tasks: {
        type: "array",
        description: "Completed tasks with their outcomes",
        items: {
          type: "object",
          properties: {
            id: { type: "string", description: "Task ID (e.g., T001)" },
            title: { type: "string", description: "Task title" },
            outcome: { type: "string", description: "What was accomplished" },
            status: { type: "string", enum: ["completed", "partial", "blocked"] }
          },
          required: ["title"]
        }
      },
      decisions: {
        type: "array",
        description: "Key decisions made during the session",
        items: {
          type: "object",
          properties: {
            topic: { type: "string", description: "What the decision was about" },
            decision: { type: "string", description: "The decision made" },
            rationale: { type: "string", description: "Why this decision was made" }
          },
          required: ["topic", "decision"]
        }
      },
      nextSteps: {
        type: "array",
        description: "Pending items for next session",
        items: {
          type: "object",
          properties: {
            task: { type: "string", description: "Task description" },
            priority: { type: "string", enum: ["critical", "high", "medium", "low"] },
            assignee: { type: "string", description: "Suggested agent" }
          },
          required: ["task"]
        }
      },
      milestone: {
        type: "string",
        description: "Current milestone or phase name"
      },
      notes: {
        type: "string",
        description: "Additional notes or context"
      }
    }
  }
};

export async function handleSummarizeSession(args: Record<string, unknown>) {
  const {
    tasks = [],
    decisions = [],
    nextSteps = [],
    milestone,
    notes
  } = args as {
    tasks?: TaskItem[];
    decisions?: DecisionItem[];
    nextSteps?: NextStepItem[];
    milestone?: string;
    notes?: string;
  };

  // Git 정보 수집
  let gitInfo = {
    lastCommit: "",
    lastCommitMessage: "",
    branch: "",
    changedFiles: [] as string[]
  };

  try {
    gitInfo.lastCommit = execSync("git rev-parse HEAD", { encoding: "utf-8" }).trim();
    gitInfo.lastCommitMessage = execSync("git log -1 --format=%s", { encoding: "utf-8" }).trim();
    gitInfo.branch = execSync("git branch --show-current", { encoding: "utf-8" }).trim();

    // 변경된 파일 목록 (staged + modified)
    const statusOutput = execSync("git status --porcelain", { encoding: "utf-8" });
    gitInfo.changedFiles = statusOutput
      .split("\n")
      .filter(line => line.trim())
      .map(line => line.substring(3).trim());
  } catch {
    // Git 정보를 가져올 수 없는 경우 무시
  }

  // 진행 중인 에이전트 상태 수집
  const activeAgents: { name: string; task: string; worktree?: string }[] = [];
  globalState.agents.forEach((state, name) => {
    if (state.status === "working" && state.currentTask) {
      const task = globalState.tasks.get(state.currentTask);
      activeAgents.push({
        name,
        task: task?.title || state.currentTask,
        worktree: state.worktree
      });
    }
  });

  // 완료된 작업에서 전역 상태의 태스크도 추가
  const completedTasks: TaskItem[] = [...tasks];
  globalState.tasks.forEach((task) => {
    if (task.status === "completed") {
      const exists = completedTasks.some(t => t.id === task.id);
      if (!exists) {
        completedTasks.push({
          id: task.id,
          title: task.title,
          status: "completed"
        });
      }
    }
  });

  // 타임스탬프
  const timestamp = new Date().toISOString();
  const dateStr = new Date().toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "long"
  });

  // 마크다운 요약 생성
  let markdown = `# Session Summary

> Generated: ${dateStr}
> Timestamp: ${timestamp}

`;

  // 마일스톤 정보
  if (milestone) {
    markdown += `## Current Milestone
**${milestone}**

`;
  }

  // Git 정보
  if (gitInfo.lastCommit) {
    markdown += `## Git State

- **Branch**: \`${gitInfo.branch}\`
- **Last Commit**: \`${gitInfo.lastCommit.substring(0, 7)}\`
- **Message**: ${gitInfo.lastCommitMessage}

`;
  }

  // 완료된 작업
  markdown += `## Completed Tasks

`;
  if (completedTasks.length > 0) {
    completedTasks.forEach((task, idx) => {
      const taskId = task.id ? `[${task.id}] ` : "";
      const status = task.status === "completed" ? "[x]" :
                     task.status === "partial" ? "[-]" : "[ ]";
      markdown += `- ${status} ${taskId}${task.title}`;
      if (task.outcome) {
        markdown += `\n  - Outcome: ${task.outcome}`;
      }
      markdown += "\n";
    });
  } else {
    markdown += "_No tasks completed in this session._\n";
  }
  markdown += "\n";

  // 변경된 파일
  if (gitInfo.changedFiles.length > 0) {
    markdown += `## Files Changed

`;
    gitInfo.changedFiles.forEach(file => {
      markdown += `- \`${file}\`\n`;
    });
    markdown += "\n";
  }

  // 주요 결정사항
  markdown += `## Key Decisions

`;
  if (decisions.length > 0) {
    decisions.forEach((decision, idx) => {
      markdown += `### ${idx + 1}. ${decision.topic}\n`;
      markdown += `**Decision**: ${decision.decision}\n`;
      if (decision.rationale) {
        markdown += `**Rationale**: ${decision.rationale}\n`;
      }
      markdown += "\n";
    });
  } else {
    markdown += "_No major decisions recorded._\n\n";
  }

  // 진행 중인 에이전트
  if (activeAgents.length > 0) {
    markdown += `## Active Agents

`;
    activeAgents.forEach(agent => {
      markdown += `- **${agent.name}**: ${agent.task}`;
      if (agent.worktree) {
        markdown += ` (worktree: \`${agent.worktree}\`)`;
      }
      markdown += "\n";
    });
    markdown += "\n";
  }

  // 다음 단계
  markdown += `## Next Steps

`;
  if (nextSteps.length > 0) {
    nextSteps.forEach((step, idx) => {
      const priority = step.priority ? `[${step.priority.toUpperCase()}]` : "[MEDIUM]";
      const assignee = step.assignee ? ` -> @${step.assignee}` : "";
      markdown += `${idx + 1}. ${priority} ${step.task}${assignee}\n`;
    });
  } else {
    markdown += "_No pending items._\n";
  }
  markdown += "\n";

  // 추가 노트
  if (notes) {
    markdown += `## Notes

${notes}

`;
  }

  // Resume 명령어
  markdown += `## Resume Command

\`\`\`
/resume
\`\`\`

To continue this session, review this summary and use the above command or manually restore context.

---
_Avengers Session Summarizer v1.0_
`;

  // 결과 반환
  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        message: "Session summary generated successfully",
        outputPath: ".claude/resume/latest.md",
        summary: {
          tasksCompleted: completedTasks.length,
          decisionsRecorded: decisions.length,
          nextStepsCount: nextSteps.length,
          activeAgents: activeAgents.length,
          filesChanged: gitInfo.changedFiles.length,
          branch: gitInfo.branch,
          lastCommit: gitInfo.lastCommit.substring(0, 7)
        },
        markdown
      }, null, 2)
    }]
  };
}
