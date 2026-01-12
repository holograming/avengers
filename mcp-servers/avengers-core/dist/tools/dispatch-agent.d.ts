/**
 * Dispatch Agent Tool
 *
 * 특정 Avengers 에이전트를 태스크에 디스패치합니다.
 * 워크트리 생성 옵션으로 병렬 작업을 지원합니다.
 *
 * Enhanced for M4: Background Task integration with explicit context,
 * execution modes, and dependency management.
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { AgentType, CodeSnippet } from "../agent-templates.js";
/**
 * Enhanced dispatch agent parameters interface
 * Based on M4 design: .claude/designs/m4-parallel-patterns.md
 */
export interface DispatchAgentParams {
    agent: AgentType;
    task: string;
    context?: {
        files?: string[];
        snippets?: CodeSnippet[];
        references?: string[];
    };
    worktree?: boolean;
    priority?: "critical" | "high" | "medium" | "low";
    mode?: "background" | "foreground";
    outputFormat?: "summary" | "json" | "full";
    dependencies?: string[];
    acceptanceCriteria?: string[];
    constraints?: string[];
}
/**
 * Dispatch response structure
 */
export interface DispatchResponse {
    taskId: string;
    agent: AgentType;
    status: "dispatched" | "queued" | "blocked";
    role: string;
    permissions: string[];
    worktree?: string;
    branchName?: string;
    priority: string;
    mode: "background" | "foreground";
    outputFormat: "summary" | "json" | "full";
    dependencies?: string[];
    blockedBy?: string[];
    estimatedDuration?: string;
    agentPrompt: string;
    contextSummary: {
        filesCount: number;
        snippetsCount: number;
        referencesCount: number;
    };
}
export declare const dispatchAgentTool: Tool;
export declare function handleDispatchAgent(args: Record<string, unknown>): Promise<{
    content: {
        type: string;
        text: string;
    }[];
    isError: boolean;
} | {
    content: {
        type: string;
        text: string;
    }[];
    isError?: undefined;
}>;
