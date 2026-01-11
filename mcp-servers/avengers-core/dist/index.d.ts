#!/usr/bin/env node
/**
 * Avengers Core MCP Server
 *
 * 멀티 에이전트 시스템의 핵심 MCP 서버입니다.
 * - 에이전트 디스패치 및 관리
 * - 태스크 할당 및 추적
 * - 워크트리 기반 병렬 작업 관리
 */
export interface AgentState {
    name: string;
    status: "idle" | "working" | "blocked";
    currentTask?: string;
    worktree?: string;
}
export interface TaskState {
    id: string;
    title: string;
    assignee?: string;
    status: "pending" | "in_progress" | "review" | "completed";
    worktree?: string;
}
export declare const globalState: {
    agents: Map<string, AgentState>;
    tasks: Map<string, TaskState>;
    taskCounter: number;
};
