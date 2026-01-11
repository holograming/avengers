/**
 * Get Agent Status Tool
 *
 * 에이전트들의 현재 상태를 조회합니다.
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
export declare const getAgentStatusTool: Tool;
export declare function handleGetAgentStatus(args: Record<string, unknown>): Promise<{
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
