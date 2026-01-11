/**
 * Code Review Skill Tool
 *
 * 체계적인 코드 리뷰 프로세스
 */
import { Tool } from "@modelcontextprotocol/sdk/types.js";
export declare const codeReviewTool: Tool;
export declare function handleCodeReview(args: Record<string, unknown>): Promise<{
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
