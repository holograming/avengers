/**
 * Agent Communication Tool
 *
 * 에이전트 간 소통 메커니즘입니다.
 * 결과 공유, 핸드오프, 알림 등을 지원합니다.
 *
 * M5: 에이전트 간 소통 강화
 * - Handoff: 작업 인계
 * - Request: 정보/작업 요청
 * - Result: 결과 공유
 * - Notify: 상태 알림
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { AgentType } from "../agent-templates.js";
import { globalState } from "../index.js";

/**
 * Message types
 */
export type MessageType = "result" | "request" | "notify" | "handoff";

/**
 * Message priority
 */
export type MessagePriority = "critical" | "high" | "medium" | "low";

/**
 * Agent message interface
 */
export interface AgentMessage {
  id: string;
  from: AgentType;
  to: AgentType | "all";
  type: MessageType;
  payload: {
    taskId?: string;
    content: string;
    artifacts?: string[];
    priority?: MessagePriority;
    metadata?: Record<string, unknown>;
  };
  timestamp: string;
  read: boolean;
}

/**
 * Shared context interface
 */
export interface SharedContext {
  taskId: string;
  contributions: {
    agent: AgentType;
    files: string[];
    summary: string;
    timestamp: string;
  }[];
}

/**
 * Message store
 */
const messageStore = new Map<string, AgentMessage>();
const contextStore = new Map<string, SharedContext>();
let messageCounter = 0;

/**
 * Agent Communicate Tool
 */
export const agentCommunicateTool: Tool = {
  name: "avengers_agent_communicate",
  description: "에이전트 간 메시지 전달. 작업 인계(handoff), 정보 요청(request), 결과 공유(result), 상태 알림(notify)을 지원합니다.",
  inputSchema: {
    type: "object",
    properties: {
      from: {
        type: "string",
        enum: ["captain", "ironman", "natasha", "groot", "jarvis", "dr-strange", "vision"],
        description: "메시지를 보내는 에이전트"
      },
      to: {
        type: "string",
        description: "메시지를 받는 에이전트 (또는 'all'로 전체 브로드캐스트)"
      },
      type: {
        type: "string",
        enum: ["result", "request", "notify", "handoff"],
        description: "메시지 유형"
      },
      payload: {
        type: "object",
        description: "메시지 내용",
        properties: {
          taskId: {
            type: "string",
            description: "관련 태스크 ID"
          },
          content: {
            type: "string",
            description: "메시지 내용"
          },
          artifacts: {
            type: "array",
            items: { type: "string" },
            description: "첨부 파일 경로 또는 코드 스니펫"
          },
          priority: {
            type: "string",
            enum: ["critical", "high", "medium", "low"],
            description: "메시지 우선순위"
          }
        },
        required: ["content"]
      }
    },
    required: ["from", "to", "type", "payload"]
  }
};

/**
 * Broadcast Tool
 */
export const broadcastTool: Tool = {
  name: "avengers_broadcast",
  description: "전체 에이전트에게 알림 전송. Captain이 주로 사용하여 Phase 변경이나 중요 공지를 전달합니다.",
  inputSchema: {
    type: "object",
    properties: {
      from: {
        type: "string",
        enum: ["captain", "ironman", "natasha", "groot", "jarvis", "dr-strange", "vision"],
        description: "브로드캐스트 발신자"
      },
      type: {
        type: "string",
        enum: ["notify", "result"],
        description: "메시지 유형"
      },
      payload: {
        type: "object",
        properties: {
          content: {
            type: "string",
            description: "알림 내용"
          },
          priority: {
            type: "string",
            enum: ["critical", "high", "medium", "low"],
            description: "우선순위"
          },
          taskId: {
            type: "string",
            description: "관련 태스크 ID"
          }
        },
        required: ["content"]
      }
    },
    required: ["from", "payload"]
  }
};

/**
 * Get Shared Context Tool
 */
export const getSharedContextTool: Tool = {
  name: "avengers_get_shared_context",
  description: "다른 에이전트의 작업 결과를 조회합니다. 특정 태스크에 대한 기여 내용을 확인할 수 있습니다.",
  inputSchema: {
    type: "object",
    properties: {
      taskId: {
        type: "string",
        description: "조회할 태스크 ID"
      },
      filter: {
        type: "object",
        properties: {
          agents: {
            type: "array",
            items: { type: "string" },
            description: "특정 에이전트의 기여만 조회"
          }
        }
      }
    },
    required: ["taskId"]
  }
};

/**
 * Update Shared Context Tool
 */
export const updateSharedContextTool: Tool = {
  name: "avengers_update_shared_context",
  description: "작업 결과를 공유 컨텍스트에 추가합니다. 다른 에이전트가 참조할 수 있도록 합니다.",
  inputSchema: {
    type: "object",
    properties: {
      taskId: {
        type: "string",
        description: "태스크 ID"
      },
      agent: {
        type: "string",
        enum: ["captain", "ironman", "natasha", "groot", "jarvis", "dr-strange", "vision"],
        description: "기여하는 에이전트"
      },
      files: {
        type: "array",
        items: { type: "string" },
        description: "수정/생성한 파일 목록"
      },
      summary: {
        type: "string",
        description: "작업 요약"
      }
    },
    required: ["taskId", "agent", "summary"]
  }
};

/**
 * Handle agent communication
 */
export async function handleAgentCommunicate(args: Record<string, unknown>) {
  const { from, to, type, payload } = args as {
    from: AgentType;
    to: AgentType | "all";
    type: MessageType;
    payload: AgentMessage["payload"];
  };

  // Generate message ID
  const messageId = `MSG${String(++messageCounter).padStart(4, "0")}`;

  // Create message
  const message: AgentMessage = {
    id: messageId,
    from,
    to,
    type,
    payload: {
      ...payload,
      priority: payload.priority || "medium"
    },
    timestamp: new Date().toISOString(),
    read: false
  };

  // Store message
  messageStore.set(messageId, message);

  // Handle different message types
  let responseMessage = "";

  switch (type) {
    case "handoff":
      responseMessage = `${from}가 ${to}에게 작업을 인계했습니다.`;
      // Update agent state if applicable
      if (to !== "all") {
        const toAgent = globalState.agents.get(to);
        if (toAgent && toAgent.status === "idle") {
          // Ready to receive handoff
          responseMessage += ` ${to}가 작업을 받을 준비가 되었습니다.`;
        }
      }
      break;

    case "request":
      responseMessage = `${from}가 ${to}에게 요청을 보냈습니다.`;
      break;

    case "result":
      responseMessage = `${from}가 결과를 공유했습니다.`;
      // Update shared context if taskId provided
      if (payload.taskId) {
        updateContext(
          payload.taskId,
          from,
          payload.artifacts || [],
          payload.content
        );
      }
      break;

    case "notify":
      responseMessage = `${from}가 알림을 보냈습니다.`;
      break;
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        messageId,
        status: "delivered",
        message: responseMessage,
        details: {
          from,
          to,
          type,
          priority: payload.priority || "medium",
          timestamp: message.timestamp
        }
      }, null, 2)
    }]
  };
}

/**
 * Handle broadcast
 */
export async function handleBroadcast(args: Record<string, unknown>) {
  const { from, type = "notify", payload } = args as {
    from: AgentType;
    type?: MessageType;
    payload: AgentMessage["payload"];
  };

  // Generate message ID
  const messageId = `BCAST${String(++messageCounter).padStart(4, "0")}`;

  // Create broadcast message
  const message: AgentMessage = {
    id: messageId,
    from,
    to: "all",
    type,
    payload: {
      ...payload,
      priority: payload.priority || "high"
    },
    timestamp: new Date().toISOString(),
    read: false
  };

  // Store message
  messageStore.set(messageId, message);

  // Count recipients
  const recipients = ["captain", "ironman", "natasha", "groot", "jarvis", "dr-strange", "vision"]
    .filter(agent => agent !== from);

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        messageId,
        status: "broadcast_complete",
        message: `${from}가 전체 에이전트에게 알림을 보냈습니다.`,
        recipients: recipients.length,
        details: {
          from,
          type,
          priority: payload.priority || "high",
          content: payload.content,
          timestamp: message.timestamp
        }
      }, null, 2)
    }]
  };
}

/**
 * Handle get shared context
 */
export async function handleGetSharedContext(args: Record<string, unknown>) {
  const { taskId, filter } = args as {
    taskId: string;
    filter?: { agents?: AgentType[] };
  };

  const context = contextStore.get(taskId);

  if (!context) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          taskId,
          message: "공유된 컨텍스트가 없습니다.",
          contributions: []
        }, null, 2)
      }]
    };
  }

  // Apply filter if provided
  let contributions = context.contributions;
  if (filter?.agents && filter.agents.length > 0) {
    contributions = contributions.filter(c =>
      filter.agents!.includes(c.agent)
    );
  }

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        taskId,
        contributionsCount: contributions.length,
        contributions: contributions.map(c => ({
          agent: c.agent,
          files: c.files,
          summary: c.summary,
          timestamp: c.timestamp
        }))
      }, null, 2)
    }]
  };
}

/**
 * Handle update shared context
 */
export async function handleUpdateSharedContext(args: Record<string, unknown>) {
  const { taskId, agent, files = [], summary } = args as {
    taskId: string;
    agent: AgentType;
    files?: string[];
    summary: string;
  };

  updateContext(taskId, agent, files, summary);

  const context = contextStore.get(taskId)!;

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        taskId,
        status: "updated",
        message: `${agent}의 기여가 공유 컨텍스트에 추가되었습니다.`,
        totalContributions: context.contributions.length,
        latestContribution: {
          agent,
          files,
          summary
        }
      }, null, 2)
    }]
  };
}

/**
 * Helper: Update shared context
 */
function updateContext(
  taskId: string,
  agent: AgentType,
  files: string[],
  summary: string
) {
  let context = contextStore.get(taskId);

  if (!context) {
    context = {
      taskId,
      contributions: []
    };
    contextStore.set(taskId, context);
  }

  // Add new contribution
  context.contributions.push({
    agent,
    files,
    summary,
    timestamp: new Date().toISOString()
  });
}

/**
 * Export all tools
 */
export const communicationTools = [
  agentCommunicateTool,
  broadcastTool,
  getSharedContextTool,
  updateSharedContextTool
];
