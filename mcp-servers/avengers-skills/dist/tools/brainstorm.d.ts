/**
 * Brainstorming Skill Tool
 *
 * 아이디어를 설계로 발전시키는 구조화된 브레인스토밍 프로세스
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
export declare const brainstormTool: Tool;
export declare function handleBrainstorm(args: Record<string, unknown>): Promise<{
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
