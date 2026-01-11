/**
 * Get Agent Status Tool
 *
 * 에이전트들의 현재 상태를 조회합니다.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { globalState } from "../index.js";

export const getAgentStatusTool: Tool = {
  name: "avengers_get_agent_status",
  description: "Get the current status of Avengers agents. Use to check availability before dispatching or to monitor ongoing work.",
  inputSchema: {
    type: "object",
    properties: {
      agent: {
        type: "string",
        description: "Specific agent name to query, or omit for all agents"
      }
    },
    required: []
  }
};

export async function handleGetAgentStatus(args: Record<string, unknown>) {
  const { agent } = args as { agent?: string };

  if (agent) {
    // 특정 에이전트 조회
    const agentState = globalState.agents.get(agent);
    if (!agentState) {
      return {
        content: [{ type: "text", text: `Unknown agent: ${agent}` }],
        isError: true,
      };
    }

    const task = agentState.currentTask
      ? globalState.tasks.get(agentState.currentTask)
      : null;

    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          agent: agentState.name,
          status: agentState.status,
          currentTask: task ? {
            id: task.id,
            title: task.title,
            status: task.status,
            worktree: task.worktree
          } : null,
          worktree: agentState.worktree
        }, null, 2)
      }],
    };
  }

  // 모든 에이전트 상태 조회
  const agents: Record<string, unknown>[] = [];
  globalState.agents.forEach((state, name) => {
    const task = state.currentTask
      ? globalState.tasks.get(state.currentTask)
      : null;

    agents.push({
      name,
      status: state.status,
      currentTask: task ? task.id : null,
      worktree: state.worktree
    });
  });

  // 요약 통계
  const summary = {
    total: agents.length,
    idle: agents.filter(a => a.status === "idle").length,
    working: agents.filter(a => a.status === "working").length,
    blocked: agents.filter(a => a.status === "blocked").length
  };

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        summary,
        agents,
        tasks: Array.from(globalState.tasks.values())
      }, null, 2)
    }],
  };
}
