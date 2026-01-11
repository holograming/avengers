#!/usr/bin/env node
/**
 * Avengers Skills MCP Server
 *
 * 개발 스킬을 MCP 도구로 제공합니다.
 * - TDD (Test-Driven Development)
 * - 브레인스토밍
 * - 코드 리뷰
 */

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import { runTddTool, handleRunTdd } from "./tools/run-tdd.js";
import { brainstormTool, handleBrainstorm } from "./tools/brainstorm.js";
import { codeReviewTool, handleCodeReview } from "./tools/code-review.js";

// MCP 서버 생성
const server = new Server(
  {
    name: "avengers-skills",
    version: "1.0.0",
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 도구 목록 제공
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      runTddTool,
      brainstormTool,
      codeReviewTool,
    ],
  };
});

// 도구 실행
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args = {} } = request.params;

  switch (name) {
    case "avengers_skill_tdd":
      return handleRunTdd(args);
    case "avengers_skill_brainstorm":
      return handleBrainstorm(args);
    case "avengers_skill_code_review":
      return handleCodeReview(args);
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
  console.error("Avengers Skills MCP Server running on stdio");
}

main().catch(console.error);
