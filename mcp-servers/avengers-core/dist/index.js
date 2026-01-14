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
import { summarizeSessionTool, handleSummarizeSession } from "./tools/summarize-session.js";
import { saveStateTool, handleSaveState } from "./tools/save-state.js";
import { restoreStateTool, handleRestoreState } from "./tools/restore-state.js";
import { collectResultsTool, handleCollectResults } from "./tools/collect-results.js";
import { analyzeRequestTool, handleAnalyzeRequest } from "./tools/analyze-request.js";
import { validateCompletionTool, handleValidateCompletion } from "./tools/validate-completion.js";
import { executeGroupTool, handleExecuteGroup } from "./tools/execute-group.js";
import { agentCommunicateTool, broadcastTool, getSharedContextTool, updateSharedContextTool, handleAgentCommunicate, handleBroadcast, handleGetSharedContext, handleUpdateSharedContext } from "./tools/agent-communication.js";
// Phase 6/6.5/8 실행 및 배포 도구
import { runTestsTool, handleRunTests } from "./tools/run-tests.js";
import { buildProjectTool, handleBuildProject } from "./tools/build-project.js";
import { runLocalTool, handleRunLocal } from "./tools/run-local.js";
import { stopProcessTool, handleStopProcess } from "./tools/stop-process.js";
import { generateCicdTool, handleGenerateCicd } from "./tools/generate-cicd.js";
export const globalState = {
    agents: new Map(),
    tasks: new Map(),
    taskCounter: 0,
};
// 에이전트 초기화 (Hawkeye 추가 - DevOps 전문가)
const agentNames = ["captain", "ironman", "natasha", "groot", "jarvis", "dr-strange", "vision", "hawkeye"];
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
            // 분석 및 검증
            analyzeRequestTool,
            validateCompletionTool,
            executeGroupTool,
            // 통신
            agentCommunicateTool,
            broadcastTool,
            getSharedContextTool,
            updateSharedContextTool,
            // 에이전트 관리
            dispatchAgentTool,
            getAgentStatusTool,
            assignTaskTool,
            mergeWorktreeTool,
            // 세션 관리
            summarizeSessionTool,
            saveStateTool,
            restoreStateTool,
            collectResultsTool,
            // Phase 6/6.5/8: 실행 및 배포 도구
            runTestsTool,
            buildProjectTool,
            runLocalTool,
            stopProcessTool,
            generateCicdTool,
        ],
    };
});
// 도구 실행
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args = {} } = request.params;
    switch (name) {
        case "avengers_analyze_request":
            return handleAnalyzeRequest(args);
        case "avengers_validate_completion":
            return handleValidateCompletion(args);
        case "avengers_execute_group":
            return handleExecuteGroup(args);
        case "avengers_agent_communicate":
            return handleAgentCommunicate(args);
        case "avengers_broadcast":
            return handleBroadcast(args);
        case "avengers_get_shared_context":
            return handleGetSharedContext(args);
        case "avengers_update_shared_context":
            return handleUpdateSharedContext(args);
        case "avengers_dispatch_agent":
            return handleDispatchAgent(args);
        case "avengers_get_agent_status":
            return handleGetAgentStatus(args);
        case "avengers_assign_task":
            return handleAssignTask(args);
        case "avengers_merge_worktree":
            return handleMergeWorktree(args);
        case "avengers_summarize_session":
            return handleSummarizeSession(args);
        case "avengers_save_state":
            return handleSaveState(args);
        case "avengers_restore_state":
            return handleRestoreState(args);
        case "avengers_collect_results":
            return handleCollectResults(args);
        // Phase 6/6.5/8: 실행 및 배포 도구
        case "avengers_run_tests":
            return handleRunTests(args);
        case "avengers_build_project":
            return handleBuildProject(args);
        case "avengers_run_local":
            return handleRunLocal(args);
        case "avengers_stop_process":
            return handleStopProcess(args);
        case "avengers_generate_cicd":
            return handleGenerateCicd(args);
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
