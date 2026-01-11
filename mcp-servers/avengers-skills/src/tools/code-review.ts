/**
 * Code Review Skill Tool
 *
 * 체계적인 코드 리뷰 프로세스
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const codeReviewTool: Tool = {
  name: "avengers_skill_code_review",
  description: "Systematic code review process. Use after implementation to ensure code quality and catch issues before merge.",
  inputSchema: {
    type: "object",
    properties: {
      phase: {
        type: "string",
        enum: ["request", "review", "respond", "approve"],
        description: "Current review phase"
      },
      files: {
        type: "array",
        items: { type: "string" },
        description: "Files to review or being reviewed"
      },
      findings: {
        type: "array",
        items: {
          type: "object",
          properties: {
            severity: { type: "string", enum: ["critical", "major", "minor", "suggestion"] },
            file: { type: "string" },
            line: { type: "number" },
            issue: { type: "string" },
            suggestion: { type: "string" }
          }
        },
        description: "Review findings (for review phase)"
      },
      taskId: {
        type: "string",
        description: "Associated task ID"
      }
    },
    required: ["phase"]
  }
};

const reviewGuidelines = {
  request: `
## Requesting Code Review

### Before Requesting Review
Ensure you have:
- [ ] All tests passing
- [ ] No linting errors
- [ ] Self-reviewed your code
- [ ] Removed debug code and console.logs
- [ ] Updated documentation if needed
- [ ] Written meaningful commit messages

### Self-Review Checklist
1. **Completeness**: Did I implement everything in the spec?
2. **Quality**: Is this my best work?
3. **Discipline**: Did I follow YAGNI and existing patterns?
4. **Testing**: Do tests verify actual behavior?

### Request Format
\`\`\`
## Code Review Request

**Task**: [ID and description]
**Files Changed**:
- file1.ts (new)
- file2.ts (modified)

**Summary**: What was changed and why

**Testing**: How it was tested

**Areas of Concern**: Any specific areas needing attention
\`\`\`
`,

  review: `
## Conducting Code Review

### Review Checklist

**1. Functionality**
- [ ] Code does what it should
- [ ] Edge cases handled
- [ ] Error handling appropriate

**2. Design**
- [ ] Single responsibility
- [ ] No unnecessary complexity
- [ ] Follows project patterns

**3. Code Quality**
- [ ] Clear naming
- [ ] No magic numbers
- [ ] No code duplication
- [ ] Appropriate comments

**4. Testing**
- [ ] Tests cover key paths
- [ ] Tests are readable
- [ ] Mocks used appropriately

**5. Security**
- [ ] No exposed secrets
- [ ] Input validated
- [ ] SQL injection protected

### Severity Levels
- **Critical**: Must fix before merge (security, data loss, crashes)
- **Major**: Should fix (bugs, performance issues)
- **Minor**: Nice to fix (style, minor improvements)
- **Suggestion**: Consider for future (ideas, alternatives)

### Finding Format
\`\`\`
[SEVERITY] file.ts:123
Issue: Description of the problem
Suggestion: How to fix it
\`\`\`
`,

  respond: `
## Responding to Review Feedback

### Response Guidelines
For each finding, choose:
1. **Accept**: Fix as suggested
2. **Discuss**: Need clarification or disagree
3. **Defer**: Create follow-up task

### Response Format
\`\`\`
## Review Response

### [CRITICAL] file.ts:123
Status: Accepted
Action: Fixed in commit abc123

### [MAJOR] file.ts:456
Status: Discuss
Question: Would pattern X also work here?

### [SUGGESTION] file.ts:789
Status: Deferred
Reason: Out of scope, created task T004
\`\`\`

### After Responding
- Push fixes
- Request re-review if needed
- Mark resolved items
`,

  approve: `
## Code Review Approved!

### Approval Checklist
- [ ] All critical/major issues resolved
- [ ] Tests still passing
- [ ] Documentation updated
- [ ] Ready to merge

### Approval Format
\`\`\`
## Code Review Approval

**Reviewer**: [Name]
**Status**: Approved

**Summary**:
- Total findings: X
- Critical: 0
- Major: 0 (all fixed)
- Minor: Y (X fixed, Y deferred)

**Notes**: Any final comments

**Next Steps**:
- Merge to main
- Delete feature branch
- Close task
\`\`\`

### After Approval
1. Merge changes
2. Verify in main branch
3. Close related tasks
`
};

export async function handleCodeReview(args: Record<string, unknown>) {
  const { phase, files, findings, taskId } = args as {
    phase: string;
    files?: string[];
    findings?: Array<{
      severity: string;
      file: string;
      line: number;
      issue: string;
      suggestion: string;
    }>;
    taskId?: string;
  };

  const guidelines = reviewGuidelines[phase as keyof typeof reviewGuidelines];

  if (!guidelines) {
    return {
      content: [{
        type: "text",
        text: `Unknown review phase: ${phase}. Use: request, review, respond, or approve.`
      }],
      isError: true,
    };
  }

  let findingsSummary = "";
  if (findings && findings.length > 0) {
    const byType = {
      critical: findings.filter(f => f.severity === "critical"),
      major: findings.filter(f => f.severity === "major"),
      minor: findings.filter(f => f.severity === "minor"),
      suggestion: findings.filter(f => f.severity === "suggestion"),
    };

    findingsSummary = `
### Findings Summary
- Critical: ${byType.critical.length}
- Major: ${byType.major.length}
- Minor: ${byType.minor.length}
- Suggestions: ${byType.suggestion.length}
`;
  }

  const response = `
# Code Review: ${taskId || "(No Task ID)"}

**Phase**: ${phase.toUpperCase()}
${files?.length ? `**Files**: ${files.join(", ")}` : ""}
${findingsSummary}

${guidelines}
`;

  return {
    content: [{ type: "text", text: response }],
  };
}
