/**
 * TDD (Test-Driven Development) Skill Tool
 *
 * RED → GREEN → REFACTOR 사이클을 가이드합니다.
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
export declare const runTddTool: Tool;
export declare function handleRunTdd(args: Record<string, unknown>): Promise<{
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
