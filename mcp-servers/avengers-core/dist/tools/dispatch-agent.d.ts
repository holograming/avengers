/**
 * Dispatch Agent Tool
 *
 * 특정 Avengers 에이전트를 태스크에 디스패치합니다.
 * 워크트리 생성 옵션으로 병렬 작업을 지원합니다.
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
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
