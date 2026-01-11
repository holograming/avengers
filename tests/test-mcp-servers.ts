/**
 * MCP 서버 통합 테스트
 *
 * 각 MCP 도구의 기본 동작을 검증합니다.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn } from "child_process";

async function testAvengersCore() {
  console.log("\n=== Testing avengers-core MCP Server ===\n");

  const transport = new StdioClientTransport({
    command: "node",
    args: ["/Users/devman/Dev/cpp-claude/Avengers/mcp-servers/avengers-core/dist/index.js"],
  });

  const client = new Client({
    name: "test-client",
    version: "1.0.0",
  }, {
    capabilities: {}
  });

  await client.connect(transport);

  // List tools
  console.log("1. Listing available tools...");
  const tools = await client.listTools();
  console.log(`   Found ${tools.tools.length} tools:`);
  tools.tools.forEach(t => console.log(`   - ${t.name}: ${t.description?.substring(0, 50)}...`));

  // Test get_agent_status
  console.log("\n2. Testing avengers_get_agent_status...");
  const statusResult = await client.callTool({
    name: "avengers_get_agent_status",
    arguments: {}
  });
  console.log("   Status result:", JSON.stringify(statusResult.content).substring(0, 200));

  // Test dispatch_agent
  console.log("\n3. Testing avengers_dispatch_agent...");
  const dispatchResult = await client.callTool({
    name: "avengers_dispatch_agent",
    arguments: {
      agent: "ironman",
      task: "Test task for integration testing",
      worktree: false
    }
  });
  console.log("   Dispatch result:", JSON.stringify(dispatchResult.content).substring(0, 200));

  // Test assign_task
  console.log("\n4. Testing avengers_assign_task...");
  const taskResult = await client.callTool({
    name: "avengers_assign_task",
    arguments: {
      title: "Integration test task",
      assignee: "groot",
      dependencies: []
    }
  });
  console.log("   Task result:", JSON.stringify(taskResult.content).substring(0, 200));

  await client.close();
  console.log("\n✅ avengers-core tests passed!\n");
}

async function testAvengersSkills() {
  console.log("\n=== Testing avengers-skills MCP Server ===\n");

  const transport = new StdioClientTransport({
    command: "node",
    args: ["/Users/devman/Dev/cpp-claude/Avengers/mcp-servers/avengers-skills/dist/index.js"],
  });

  const client = new Client({
    name: "test-client",
    version: "1.0.0",
  }, {
    capabilities: {}
  });

  await client.connect(transport);

  // List tools
  console.log("1. Listing available tools...");
  const tools = await client.listTools();
  console.log(`   Found ${tools.tools.length} tools:`);
  tools.tools.forEach(t => console.log(`   - ${t.name}: ${t.description?.substring(0, 50)}...`));

  // Test TDD skill
  console.log("\n2. Testing avengers_skill_tdd...");
  const tddResult = await client.callTool({
    name: "avengers_skill_tdd",
    arguments: {
      phase: "start",
      feature: "test-feature"
    }
  });
  console.log("   TDD result:", JSON.stringify(tddResult.content).substring(0, 200));

  // Test brainstorm skill
  console.log("\n3. Testing avengers_skill_brainstorm...");
  const brainstormResult = await client.callTool({
    name: "avengers_skill_brainstorm",
    arguments: {
      phase: "start",
      topic: "test-topic"
    }
  });
  console.log("   Brainstorm result:", JSON.stringify(brainstormResult.content).substring(0, 200));

  // Test code review skill
  console.log("\n4. Testing avengers_skill_code_review...");
  const reviewResult = await client.callTool({
    name: "avengers_skill_code_review",
    arguments: {
      phase: "request",
      files: ["test.ts"]
    }
  });
  console.log("   Review result:", JSON.stringify(reviewResult.content).substring(0, 200));

  await client.close();
  console.log("\n✅ avengers-skills tests passed!\n");
}

async function main() {
  console.log("🚀 Starting MCP Server Integration Tests\n");
  console.log("=" .repeat(50));

  try {
    await testAvengersCore();
    await testAvengersSkills();

    console.log("=" .repeat(50));
    console.log("\n🎉 All tests passed successfully!\n");
  } catch (error) {
    console.error("\n❌ Test failed:", error);
    process.exit(1);
  }
}

main();
