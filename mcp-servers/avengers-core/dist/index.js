#!/usr/bin/env node
/**
 * Avengers Core MCP Server
 *
 * 멀티 에이전트 시스템의 핵심 MCP 서버입니다.
 * - 에이전트 디스패치 및 관리
 * - 태스크 할당 및 추적
 * - 워크트리 기반 병렬 작업 관리
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import { dispatchAgentTool, handleDispatchAgent } from "./tools/dispatch-agent.js";
import { getAgentStatusTool, handleGetAgentStatus } from "./tools/get-agent-status.js";
import { assignTaskTool, handleAssignTask } from "./tools/assign-task.js";
import { mergeWorktreeTool, handleMergeWorktree } from "./tools/merge-worktree.js";
export const globalState = {
    agents: new Map(),
    tasks: new Map(),
    taskCounter: 0,
};
// 에이전트 초기화
const agentNames = ["captain", "ironman", "natasha", "groot", "jarvis", "dr-strange", "vision"];
agentNames.forEach(name => {
    globalState.agents.set(name, { name, status: "idle" });
});
// MCP 서버 생성
const server = new Server({
    name: "avengers-core",
    version: "1.0.0",
}, {
    capabilities: {
        tools: {},
    },
});
// 도구 목록 제공
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            dispatchAgentTool,
            getAgentStatusTool,
            assignTaskTool,
            mergeWorktreeTool,
        ],
    };
});
// 도구 실행
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    switch (name) {
        case "avengers_dispatch_agent":
            return handleDispatchAgent(args);
        case "avengers_get_agent_status":
            return handleGetAgentStatus(args);
        case "avengers_assign_task":
            return handleAssignTask(args);
        case "avengers_merge_worktree":
            return handleMergeWorktree(args);
        default:
            return {
                content: [{ type: "text", text: `Unknown tool: ${name}` }],
                isError: true,
            };
    }
});
// 서버 시작
async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error("Avengers Core MCP Server running on stdio");
}
main().catch(console.error);
