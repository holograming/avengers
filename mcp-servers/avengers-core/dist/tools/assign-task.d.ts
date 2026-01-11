/**
 * Assign Task Tool
 *
 * 새로운 태스크를 생성하고 에이전트에게 할당합니다.
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
export declare const assignTaskTool: Tool;
export declare function handleAssignTask(args: Record<string, unknown>): Promise<{
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
