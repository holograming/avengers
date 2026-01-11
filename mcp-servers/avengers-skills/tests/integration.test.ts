/**
 * avengers-skills MCP Server Integration Tests
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function testAvengersSkills() {
  console.log("\n=== Testing avengers-skills MCP Server ===\n");

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
  console.log("\n[PASS] avengers-skills tests passed!\n");
}

testAvengersSkills().catch(error => {
  console.error("\n[FAIL] Test failed:", error);
  process.exit(1);
});
