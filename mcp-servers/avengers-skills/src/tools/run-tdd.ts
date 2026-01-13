/**
 * TDD (Test-Driven Development) Skill Tool
 *
 * RED → GREEN → REFACTOR 사이클을 가이드합니다.
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const runTddTool: Tool = {
  name: "avengers_skill_tdd",
  description: "Execute TDD workflow: Write failing test (RED), make it pass (GREEN), then refactor. Use this skill for all development work to ensure code quality.",
  inputSchema: {
    type: "object",
    properties: {
      phase: {
        type: "string",
        enum: ["start", "red", "green", "refactor", "complete"],
        description: "Current TDD phase"
      },
      feature: {
        type: "string",
        description: "Feature or function being developed"
      },
      testFile: {
        type: "string",
        description: "Path to the test file"
      },
      testResult: {
        type: "string",
        enum: ["pass", "fail"],
        description: "Result of running tests"
      }
    },
    required: ["phase", "feature"]
  }
};

const tddGuidelines = {
  start: `
## TDD Workflow Starting

### The Iron Law of TDD
**No production code without a failing test first.**

### The Cycle
1. **RED**: Write a test that fails
2. **GREEN**: Write minimal code to pass
3. **REFACTOR**: Improve code while tests pass

### Before You Begin
- Understand the requirement clearly
- Identify the smallest testable unit
- Prepare test file location

### Next Step
Call this tool with phase: "red" to write your first failing test.
`,

  red: `
## RED Phase: Write Failing Test

### Your Task
Write a test that:
- Tests one specific behavior
- Fails for the right reason
- Is clear and readable

### Test Structure (AAA Pattern)
\`\`\`
// Arrange - Set up test data
// Act - Execute the code
// Assert - Verify the result
\`\`\`

### Checklist
- [ ] Test name describes the behavior
- [ ] Test is isolated (no external dependencies)
- [ ] Only one assertion per test (ideally)
- [ ] Test fails with expected error

### Next Step
Run the test and verify it fails.
Then call with phase: "green" to implement.
`,

  green: `
## GREEN Phase: Make It Pass

### Your Task
Write the **minimal** code to make the test pass.

### Rules
- DO NOT add extra functionality
- DO NOT optimize yet
- DO NOT refactor yet
- Just make it work

### Anti-patterns to Avoid
- Writing more code than needed
- Adding error handling not tested
- Making it "nice" before it works

### Next Step
Run the test and verify it passes.
Then call with phase: "refactor" to improve.
`,

  refactor: `
## REFACTOR Phase: Improve Code

### Your Task
Improve the code while keeping tests green.

### What to Improve
- Remove duplication (DRY)
- Improve naming
- Simplify logic
- Extract methods/functions
- Apply design patterns if appropriate

### Safety Rules
- Run tests after each change
- Make small, incremental changes
- If tests fail, revert immediately

### Checklist
- [ ] All tests still pass
- [ ] Code is more readable
- [ ] No duplication
- [ ] Clear naming

### Next Step
If more features needed, call with phase: "red"
If done, call with phase: "complete"
`,

  complete: `
## TDD Cycle Complete!

### Summary
You have successfully completed a TDD cycle:
1. Wrote failing test
2. Made it pass with minimal code
3. Refactored for quality

### Final Checklist
- [ ] All tests pass
- [ ] Code is clean and readable
- [ ] No console.logs or debug code
- [ ] Ready for code review

### Infinity War Validation
Before declaring completion, run validation:
\`\`\`typescript
avengers_validate_completion({
  taskId: "T001",
  testResults: { /* your test results */ },
  strictness: "moderate"
})
\`\`\`

**Remember**: 끝날 때까지 끝나지 않습니다.

### Next Steps
- Run full test suite
- Call avengers_validate_completion
- If passed: Commit and request code review
- If failed: Fix blockers and retry
`
};

export async function handleRunTdd(args: Record<string, unknown>) {
  const { phase, feature, testFile, testResult } = args as {
    phase: string;
    feature: string;
    testFile?: string;
    testResult?: string;
  };

  const guidelines = tddGuidelines[phase as keyof typeof tddGuidelines];

  if (!guidelines) {
    return {
      content: [{
        type: "text",
        text: `Unknown TDD phase: ${phase}. Use: start, red, green, refactor, or complete.`
      }],
      isError: true,
    };
  }

  // 상태 검증
  if (phase === "green" && testResult !== "fail") {
    return {
      content: [{
        type: "text",
        text: `⚠️ WARNING: You should have a failing test before GREEN phase!\n\nGo back to RED phase and write a failing test first.`
      }],
      isError: true,
    };
  }

  if (phase === "refactor" && testResult !== "pass") {
    return {
      content: [{
        type: "text",
        text: `⚠️ WARNING: Tests must pass before REFACTOR phase!\n\nGo back to GREEN phase and make tests pass first.`
      }],
      isError: true,
    };
  }

  const response = `
# TDD Skill: ${feature}

**Phase**: ${phase.toUpperCase()}
${testFile ? `**Test File**: ${testFile}` : ""}
${testResult ? `**Last Test Result**: ${testResult}` : ""}

${guidelines}
`;

  return {
    content: [{ type: "text", text: response }],
  };
}
