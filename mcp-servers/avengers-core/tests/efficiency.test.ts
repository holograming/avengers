/**
 * Efficiency Tools Unit Tests
 *
 * Tests for save-state, restore-state, and summarize-session tools.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import * as path from "path";
import * as fs from "fs";
import { fileURLToPath } from "url";
import { execSync } from "child_process";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

async function runTest(name: string, testFn: () => Promise<void>): Promise<void> {
  const start = Date.now();
  try {
    await testFn();
    results.push({ name, passed: true, duration: Date.now() - start });
    console.log(`  [PASS] ${name}`);
  } catch (error) {
    results.push({
      name,
      passed: false,
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error)
    });
    console.log(`  [FAIL] ${name}: ${error instanceof Error ? error.message : error}`);
  }
}

async function createTestClient(): Promise<Client> {
  const serverPath = path.resolve(__dirname, "../dist/index.js");

  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
  });

  const client = new Client({
    name: "efficiency-test-client",
    version: "1.0.0",
  }, {
    capabilities: {}
  });

  await client.connect(transport);
  return client;
}

async function testSaveState(client: Client): Promise<void> {
  // Test 1: Basic save state
  await runTest("save-state: basic save", async () => {
    const result = await client.callTool({
      name: "avengers_save_state",
      arguments: {
        reason: "test-save"
      }
    });

    const content = result.content as Array<{ type: string; text: string }>;
    const response = JSON.parse(content[0].text);

    if (!response.message || response.message !== "State saved successfully") {
      throw new Error(`Unexpected response: ${JSON.stringify(response)}`);
    }

    if (!response.file || !response.file.includes(".claude/state/")) {
      throw new Error("State file path not in expected location");
    }

    if (response.summary.agents.total !== 7) {
      throw new Error(`Expected 7 agents, got ${response.summary.agents.total}`);
    }
  });

  // Test 2: Save with custom filename
  await runTest("save-state: custom filename", async () => {
    const result = await client.callTool({
      name: "avengers_save_state",
      arguments: {
        filename: "test-custom-state",
        reason: "custom filename test"
      }
    });

    const content = result.content as Array<{ type: string; text: string }>;
    const response = JSON.parse(content[0].text);

    if (!response.file.includes("test-custom-state.json")) {
      throw new Error("Custom filename not used");
    }
  });
}

async function testRestoreState(client: Client): Promise<void> {
  // Test 1: Restore from latest
  await runTest("restore-state: restore latest", async () => {
    const result = await client.callTool({
      name: "avengers_restore_state",
      arguments: {}
    });

    const content = result.content as Array<{ type: string; text: string }>;
    const response = JSON.parse(content[0].text);

    if (!response.message || response.message !== "State restored successfully") {
      throw new Error(`Unexpected response: ${JSON.stringify(response)}`);
    }

    if (!response.currentState.agents) {
      throw new Error("Current state should include agents");
    }
  });

  // Test 2: Restore from custom file
  await runTest("restore-state: restore custom file", async () => {
    const result = await client.callTool({
      name: "avengers_restore_state",
      arguments: {
        filename: "test-custom-state"
      }
    });

    const content = result.content as Array<{ type: string; text: string }>;
    const response = JSON.parse(content[0].text);

    if (!response.message || response.message !== "State restored successfully") {
      throw new Error(`Unexpected response: ${JSON.stringify(response)}`);
    }
  });

  // Test 3: Restore non-existent file
  await runTest("restore-state: handle missing file", async () => {
    const result = await client.callTool({
      name: "avengers_restore_state",
      arguments: {
        filename: "non-existent-file-12345"
      }
    });

    const content = result.content as Array<{ type: string; text: string }>;
    const response = JSON.parse(content[0].text);

    if (!response.error) {
      throw new Error("Should return error for missing file");
    }

    if (!response.availableFiles) {
      throw new Error("Should provide list of available files");
    }
  });
}

async function testSummarizeSession(client: Client): Promise<void> {
  // Test 1: Basic summarize
  await runTest("summarize-session: basic summary", async () => {
    const result = await client.callTool({
      name: "avengers_summarize_session",
      arguments: {}
    });

    const content = result.content as Array<{ type: string; text: string }>;
    const response = JSON.parse(content[0].text);

    if (!response.message || response.message !== "Session summary generated successfully") {
      throw new Error(`Unexpected response: ${JSON.stringify(response)}`);
    }

    if (!response.markdown) {
      throw new Error("Should include markdown content");
    }

    if (!response.markdown.includes("# Session Summary")) {
      throw new Error("Markdown should include Session Summary header");
    }
  });

  // Test 2: Summarize with tasks
  await runTest("summarize-session: with tasks", async () => {
    const result = await client.callTool({
      name: "avengers_summarize_session",
      arguments: {
        tasks: [
          { id: "T001", title: "Test Task 1", outcome: "Completed", status: "completed" },
          { id: "T002", title: "Test Task 2", outcome: "Partial", status: "partial" }
        ]
      }
    });

    const content = result.content as Array<{ type: string; text: string }>;
    const response = JSON.parse(content[0].text);

    if (response.summary.tasksCompleted < 2) {
      throw new Error("Should include provided tasks in count");
    }

    if (!response.markdown.includes("Test Task 1")) {
      throw new Error("Markdown should include task titles");
    }
  });

  // Test 3: Summarize with decisions and next steps
  await runTest("summarize-session: with decisions and next steps", async () => {
    const result = await client.callTool({
      name: "avengers_summarize_session",
      arguments: {
        milestone: "Milestone 3: Efficiency System",
        decisions: [
          { topic: "State Format", decision: "Use JSON", rationale: "Easy to parse" }
        ],
        nextSteps: [
          { task: "Write more tests", priority: "high", assignee: "groot" }
        ],
        notes: "This is a test note"
      }
    });

    const content = result.content as Array<{ type: string; text: string }>;
    const response = JSON.parse(content[0].text);

    if (response.summary.decisionsRecorded !== 1) {
      throw new Error("Should count decisions");
    }

    if (response.summary.nextStepsCount !== 1) {
      throw new Error("Should count next steps");
    }

    if (!response.markdown.includes("Milestone 3: Efficiency System")) {
      throw new Error("Should include milestone");
    }

    if (!response.markdown.includes("State Format")) {
      throw new Error("Should include decision topic");
    }

    if (!response.markdown.includes("[HIGH]")) {
      throw new Error("Should include priority in next steps");
    }
  });
}

async function cleanup(): Promise<void> {
  // Clean up test state files
  try {
    const projectRoot = execSync("git rev-parse --show-toplevel", { encoding: "utf-8" }).trim();
    const stateDir = path.join(projectRoot, ".claude", "state");

    const testFiles = ["test-custom-state.json"];
    for (const file of testFiles) {
      const filePath = path.join(stateDir, file);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  } catch {
    // Ignore cleanup errors
  }
}

async function main() {
  console.log("\n" + "=".repeat(60));
  console.log("    EFFICIENCY TOOLS UNIT TESTS");
  console.log("=".repeat(60) + "\n");

  let client: Client | null = null;

  try {
    client = await createTestClient();

    console.log("Testing avengers_save_state...");
    await testSaveState(client);

    console.log("\nTesting avengers_restore_state...");
    await testRestoreState(client);

    console.log("\nTesting avengers_summarize_session...");
    await testSummarizeSession(client);

    await cleanup();

  } catch (error) {
    console.error("\nTest setup error:", error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }

  // Print summary
  console.log("\n" + "=".repeat(60));
  console.log("                    SUMMARY");
  console.log("=".repeat(60) + "\n");

  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`Total: ${passed}/${results.length} tests passed`);
  console.log(`Duration: ${(totalDuration / 1000).toFixed(2)}s`);

  if (failed > 0) {
    console.log("\nFailed tests:");
    results.filter(r => !r.passed).forEach(r => {
      console.log(`  - ${r.name}: ${r.error}`);
    });
    console.log("\n[EVAL FAILED]");
    process.exit(1);
  } else {
    console.log(`\nAverage Score: ${((passed / results.length) * 100).toFixed(1)}%`);
    console.log("\n[EVAL PASSED]");
  }
}

main().catch(error => {
  console.error("Test runner error:", error);
  process.exit(1);
});
