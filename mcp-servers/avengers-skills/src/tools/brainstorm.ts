/**
 * Brainstorming Skill Tool
 *
 * 아이디어를 설계로 발전시키는 구조화된 브레인스토밍 프로세스
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";

export const brainstormTool: Tool = {
  name: "avengers_skill_brainstorm",
  description: "Structured brainstorming process to refine ideas into designs. Use before implementing any new feature or making significant changes.",
  inputSchema: {
    type: "object",
    properties: {
      phase: {
        type: "string",
        enum: ["start", "understand", "explore", "design", "finalize"],
        description: "Current brainstorming phase"
      },
      topic: {
        type: "string",
        description: "The topic or feature being brainstormed"
      },
      context: {
        type: "string",
        description: "Additional context or constraints"
      },
      options: {
        type: "array",
        items: { type: "string" },
        description: "Options being considered (for explore phase)"
      }
    },
    required: ["phase", "topic"]
  }
};

const brainstormGuidelines = {
  start: `
## Brainstorming Session Starting

### Purpose
Turn ideas into fully formed designs through collaborative dialogue.

### The Process
1. **Understand**: Gather context and clarify requirements
2. **Explore**: Consider different approaches
3. **Design**: Present detailed design in sections
4. **Finalize**: Document and get approval

### Next Step
Call with phase: "understand" to begin gathering context.
`,

  understand: `
## Phase 1: Understanding the Idea

### Your Task
Ask questions to understand:
- What problem are we solving?
- Who is the target user?
- What are the constraints?
- What defines success?

### Question Guidelines
- Ask ONE question at a time
- Prefer multiple choice when possible
- Focus on understanding, not solutions yet

### Key Areas to Explore
1. **Purpose**: Why is this needed?
2. **Users**: Who will use this?
3. **Constraints**: Technical, time, resources?
4. **Success Criteria**: How do we know it works?

### Next Step
Once you understand the requirements, call with phase: "explore"
`,

  explore: `
## Phase 2: Exploring Approaches

### Your Task
Propose 2-3 different approaches with trade-offs.

### For Each Approach
- **Name**: Brief identifier
- **Description**: How it works
- **Pros**: Benefits and strengths
- **Cons**: Drawbacks and risks
- **Effort**: Estimated complexity

### Presentation Format
\`\`\`
## Option A: [Name]
Description: ...
Pros:
- ...
Cons:
- ...
Effort: Low/Medium/High

## Option B: [Name]
...

## Recommendation
I recommend Option [X] because...
\`\`\`

### Next Step
Present options to user, then call with phase: "design"
`,

  design: `
## Phase 3: Presenting the Design

### Your Task
Present the chosen approach in detail.

### Break into Sections (200-300 words each)
After each section, check: "Does this look right so far?"

### Sections to Cover
1. **Architecture Overview**: High-level structure
2. **Components**: Key parts and responsibilities
3. **Data Flow**: How information moves
4. **Error Handling**: What can go wrong, how to handle
5. **Testing Strategy**: How to verify it works

### Format
Use diagrams where helpful (Mermaid):
\`\`\`mermaid
graph TD
    A[User] --> B[Component]
    B --> C[Service]
\`\`\`

### Next Step
Once design is approved, call with phase: "finalize"
`,

  finalize: `
## Phase 4: Finalizing the Design

### Your Task
Create a design document and plan.

### Design Document Location
\`docs/plans/YYYY-MM-DD-{topic}-design.md\`

### Document Structure
\`\`\`markdown
# Design: {Topic}

## Overview
Brief summary of the solution.

## Requirements
- Requirement 1
- Requirement 2

## Architecture
[Diagram and description]

## Components
### Component 1
...

## Data Flow
...

## Error Handling
...

## Testing Strategy
...

## Implementation Plan
1. Task 1 (estimate)
2. Task 2 (estimate)
...
\`\`\`

### Workflow Selection
Based on the design complexity, Captain will select workflow:
\`\`\`typescript
avengers_analyze_request({
  request: "[Your implementation request]",
  forceResearch: false
})
\`\`\`

### Next Steps
1. Save design document
2. Let Captain analyze and select workflow
3. Begin implementation (TDD for development tasks)

Call avengers_skill_tdd to start development!
`
};

export async function handleBrainstorm(args: Record<string, unknown>) {
  const { phase, topic, context, options } = args as {
    phase: string;
    topic: string;
    context?: string;
    options?: string[];
  };

  const guidelines = brainstormGuidelines[phase as keyof typeof brainstormGuidelines];

  if (!guidelines) {
    return {
      content: [{
        type: "text",
        text: `Unknown brainstorm phase: ${phase}. Use: start, understand, explore, design, or finalize.`
      }],
      isError: true,
    };
  }

  let response = `
# Brainstorming: ${topic}

**Phase**: ${phase.toUpperCase()}
${context ? `**Context**: ${context}` : ""}
${options?.length ? `**Options Under Consideration**: ${options.join(", ")}` : ""}

${guidelines}
`;

  return {
    content: [{ type: "text", text: response }],
  };
}
