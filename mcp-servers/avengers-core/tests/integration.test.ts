/**
 * avengers-core MCP Server Integration Tests
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testAvengersCore() {
  console.log("\n=== Testing avengers-core MCP Server ===\n");

  const serverPath = path.resolve(__dirname, "../dist/index.js");

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
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
  console.log("\n[PASS] avengers-core tests passed!\n");
}

testAvengersCore().catch(error => {
  console.error("\n[FAIL] Test failed:", error);
  process.exit(1);
});
