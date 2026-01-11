/**
 * Merge Worktree Tool
 *
 * 완료된 워크트리를 메인 브랜치에 머지하고 정리합니다.
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
export declare const mergeWorktreeTool: Tool;
export declare function handleMergeWorktree(args: Record<string, unknown>): Promise<{
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
