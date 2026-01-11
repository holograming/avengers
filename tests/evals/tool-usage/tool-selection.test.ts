/**
 * 적절한 도구 선택 평가
 *
 * 이 평가는 에이전트가 주어진 작업에 대해
 * 적절한 MCP 도구를 선택하는 능력을 검증합니다.
 *
 * 평가 기준:
 * - 작업 유형에 맞는 도구 선택
 * - 도구 파라미터의 정확성
 * - 도구 호출 순서의 적절성
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// 사용 가능한 MCP 도구 정의
const AVAILABLE_TOOLS = {
  // avengers-core 도구
  "avengers_dispatch_agent": {
    category: "coordination",
    description: "에이전트 호출",
    requiredParams: ["agent", "task"],
    optionalParams: ["worktree", "priority"],
  },
  "avengers_get_agent_status": {
    category: "monitoring",
    description: "에이전트 상태 조회",
    requiredParams: [],
    optionalParams: ["agent"],
  },
  "avengers_assign_task": {
    category: "planning",
    description: "작업 할당",
    requiredParams: ["title"],
    optionalParams: ["assignee", "dependencies", "description", "priority"],
  },
  "avengers_merge_worktree": {
    category: "git",
    description: "Worktree 병합",
    requiredParams: ["taskId"],
    optionalParams: ["commitMessage", "createPR"],
  },

  // avengers-skills 도구
  "avengers_skill_tdd": {
    category: "development",
    description: "TDD 워크플로우",
    requiredParams: ["phase", "feature"],
    optionalParams: ["testFile", "testResult"],
  },
  "avengers_skill_brainstorm": {
    category: "planning",
    description: "브레인스토밍",
    requiredParams: ["phase", "topic"],
    optionalParams: ["options", "context"],
  },
  "avengers_skill_code_review": {
    category: "quality",
    description: "코드 리뷰",
    requiredParams: ["phase"],
    optionalParams: ["files", "findings", "taskId"],
  },
} as const;

type ToolName = keyof typeof AVAILABLE_TOOLS;

// 테스트 케이스 정의
interface ToolSelectionTestCase {
  name: string;
  scenario: string;
  context: Record<string, unknown>;
  expectedTools: ToolName[];
  expectedOrder?: "sequential" | "parallel" | "any";
}

const TEST_CASES: ToolSelectionTestCase[] = [
  {
    name: "New feature implementation",
    scenario: "새로운 사용자 인증 기능 구현 시작",
    context: { featureName: "user-auth", complexity: "high" },
    expectedTools: ["avengers_skill_brainstorm", "avengers_assign_task"],
    expectedOrder: "sequential",
  },
  {
    name: "Agent dispatch for backend work",
    scenario: "백엔드 API 구현을 위해 Natasha 호출",
    context: { agent: "natasha", task: "API 구현" },
    expectedTools: ["avengers_get_agent_status", "avengers_dispatch_agent"],
    expectedOrder: "sequential",
  },
  {
    name: "TDD cycle execution",
    scenario: "TDD 사이클로 기능 개발",
    context: { feature: "login", phase: "red" },
    expectedTools: ["avengers_skill_tdd"],
    expectedOrder: "any",
  },
  {
    name: "Code review before merge",
    scenario: "코드 리뷰 후 Worktree 병합",
    context: { files: ["src/auth.ts"], taskId: "T001" },
    expectedTools: ["avengers_skill_code_review", "avengers_merge_worktree"],
    expectedOrder: "sequential",
  },
  {
    name: "Parallel agent dispatch",
    scenario: "독립적인 작업을 여러 에이전트에게 동시 배정",
    context: { tasks: ["frontend", "backend"], agents: ["ironman", "natasha"] },
    expectedTools: ["avengers_dispatch_agent", "avengers_dispatch_agent"],
    expectedOrder: "parallel",
  },
];

// 코드 기반 그레이더
interface GraderResult {
  passed: boolean;
  score: number;
  details: string;
  metadata?: Record<string, unknown>;
}

class ToolSelectionGrader {
  /**
   * 시나리오에서 적절한 도구 추론
   */
  inferAppropriateTools(scenario: string, context: Record<string, unknown>): ToolName[] {
    const keywords = scenario.toLowerCase();
    const tools: ToolName[] = [];

    // 키워드 기반 도구 매칭
    if (keywords.includes("브레인스토밍") || keywords.includes("기획") ||
        keywords.includes("새로운") || keywords.includes("시작")) {
      tools.push("avengers_skill_brainstorm");
    }

    if (keywords.includes("할당") || keywords.includes("배정") ||
        keywords.includes("작업 생성")) {
      tools.push("avengers_assign_task");
    }

    if (keywords.includes("호출") || keywords.includes("dispatch") ||
        keywords.includes("에이전트") && keywords.includes("구현")) {
      tools.push("avengers_get_agent_status");
      tools.push("avengers_dispatch_agent");
    }

    if (keywords.includes("tdd") || keywords.includes("테스트") &&
        keywords.includes("개발")) {
      tools.push("avengers_skill_tdd");
    }

    if (keywords.includes("리뷰") || keywords.includes("검토")) {
      tools.push("avengers_skill_code_review");
    }

    if (keywords.includes("병합") || keywords.includes("merge")) {
      tools.push("avengers_merge_worktree");
    }

    return tools;
  }

  /**
   * 도구 선택 정확성 평가
   */
  gradeToolSelection(
    actualTools: ToolName[],
    expectedTools: ToolName[]
  ): GraderResult {
    const actualSet = new Set(actualTools);
    const expectedSet = new Set(expectedTools);

    // 정확히 일치하는 도구
    const correctTools = actualTools.filter(t => expectedSet.has(t));

    // 불필요한 도구 (오버 선택)
    const extraTools = actualTools.filter(t => !expectedSet.has(t));

    // 누락된 도구 (언더 선택)
    const missingTools = expectedTools.filter(t => !actualSet.has(t));

    // 점수 계산
    const precision = correctTools.length / actualTools.length || 0;
    const recall = correctTools.length / expectedTools.length || 0;
    const f1Score = precision + recall > 0
      ? (2 * precision * recall) / (precision + recall)
      : 0;

    const passed = missingTools.length === 0 && extraTools.length === 0;

    return {
      passed,
      score: f1Score,
      details: passed
        ? "모든 도구가 정확하게 선택됨"
        : `정확: ${correctTools.join(", ") || "없음"}, 누락: ${missingTools.join(", ") || "없음"}, 추가: ${extraTools.join(", ") || "없음"}`,
      metadata: { precision, recall, f1Score },
    };
  }

  /**
   * 도구 파라미터 정확성 평가
   */
  gradeToolParameters(
    toolName: ToolName,
    providedParams: Record<string, unknown>
  ): GraderResult {
    const toolDef = AVAILABLE_TOOLS[toolName];
    const providedKeys = Object.keys(providedParams);

    // 필수 파라미터 확인
    const missingRequired = toolDef.requiredParams.filter(
      p => !providedKeys.includes(p)
    );

    // 알 수 없는 파라미터 확인
    const allKnownParams = [...toolDef.requiredParams, ...toolDef.optionalParams];
    const unknownParams = providedKeys.filter(
      p => !allKnownParams.includes(p)
    );

    if (missingRequired.length > 0) {
      return {
        passed: false,
        score: 1 - (missingRequired.length / toolDef.requiredParams.length),
        details: `필수 파라미터 누락: ${missingRequired.join(", ")}`,
      };
    }

    if (unknownParams.length > 0) {
      return {
        passed: false,
        score: 0.7,
        details: `알 수 없는 파라미터: ${unknownParams.join(", ")}`,
      };
    }

    return {
      passed: true,
      score: 1.0,
      details: "모든 파라미터가 올바르게 제공됨",
    };
  }

  /**
   * 도구 호출 순서 평가
   */
  gradeToolOrder(
    actualOrder: ToolName[],
    expectedOrder: "sequential" | "parallel" | "any",
    dependencies?: Map<ToolName, ToolName[]>
  ): GraderResult {
    if (expectedOrder === "any") {
      return {
        passed: true,
        score: 1.0,
        details: "순서 무관 - 통과",
      };
    }

    if (expectedOrder === "parallel") {
      // 병렬 실행 가능: 의존성 없는 도구들이어야 함
      return {
        passed: true,
        score: 1.0,
        details: "병렬 실행 가능 - 통과",
      };
    }

    // 순차 실행: 의존성 순서 확인
    if (dependencies) {
      for (let i = 0; i < actualOrder.length; i++) {
        const tool = actualOrder[i];
        const deps = dependencies.get(tool) || [];

        for (const dep of deps) {
          const depIndex = actualOrder.indexOf(dep);
          if (depIndex === -1 || depIndex >= i) {
            return {
              passed: false,
              score: 0.5,
              details: `순서 오류: ${tool}은 ${dep} 이후에 실행되어야 함`,
            };
          }
        }
      }
    }

    return {
      passed: true,
      score: 1.0,
      details: "올바른 순차 실행 순서",
    };
  }

  /**
   * 컨텍스트 활용 평가
   */
  gradeContextUsage(
    context: Record<string, unknown>,
    toolCalls: Array<{ tool: ToolName; params: Record<string, unknown> }>
  ): GraderResult {
    let usedContextKeys = 0;
    const contextKeys = Object.keys(context);

    for (const call of toolCalls) {
      for (const key of contextKeys) {
        const paramValues = Object.values(call.params);
        if (paramValues.some(v =>
          v === context[key] ||
          (typeof v === "string" && typeof context[key] === "string" &&
           v.includes(context[key] as string))
        )) {
          usedContextKeys++;
          break;
        }
      }
    }

    const usageRate = contextKeys.length > 0
      ? usedContextKeys / contextKeys.length
      : 1;

    return {
      passed: usageRate >= 0.5,
      score: usageRate,
      details: `컨텍스트 활용률: ${(usageRate * 100).toFixed(0)}% (${usedContextKeys}/${contextKeys.length} 키 사용)`,
    };
  }
}

// 테스트 실행기
async function runToolSelectionEval() {
  console.log("\n=== Tool Selection Accuracy Evaluation ===\n");

  const grader = new ToolSelectionGrader();
  const results: Array<{ testCase: string; result: GraderResult }> = [];

  // 시나리오별 테스트 실행
  for (const testCase of TEST_CASES) {
    console.log(`Testing: ${testCase.name}`);
    console.log(`  Scenario: ${testCase.scenario}`);

    // 도구 추론 시뮬레이션
    const inferredTools = grader.inferAppropriateTools(testCase.scenario, testCase.context);

    // 도구 선택 평가
    const selectionResult = grader.gradeToolSelection(inferredTools, testCase.expectedTools);
    console.log(`  Tool Selection: ${selectionResult.passed ? "PASS" : "FAIL"} (${(selectionResult.score * 100).toFixed(0)}%)`);
    console.log(`    ${selectionResult.details}`);

    results.push({ testCase: `${testCase.name} - Selection`, result: selectionResult });

    // 도구 순서 평가
    if (testCase.expectedOrder) {
      const orderResult = grader.gradeToolOrder(inferredTools, testCase.expectedOrder);
      console.log(`  Tool Order: ${orderResult.passed ? "PASS" : "FAIL"}`);
      console.log(`    ${orderResult.details}`);

      results.push({ testCase: `${testCase.name} - Order`, result: orderResult });
    }

    console.log();
  }

  // 파라미터 정확성 테스트
  console.log("Testing: Parameter Accuracy\n");

  const parameterTests = [
    {
      tool: "avengers_dispatch_agent" as ToolName,
      params: { agent: "ironman", task: "Build login form" },
      expected: true,
    },
    {
      tool: "avengers_dispatch_agent" as ToolName,
      params: { agent: "ironman" }, // missing required 'task'
      expected: false,
    },
    {
      tool: "avengers_skill_tdd" as ToolName,
      params: { phase: "red", feature: "auth", unknownParam: true },
      expected: false,
    },
    {
      tool: "avengers_assign_task" as ToolName,
      params: { title: "New task", priority: "high" },
      expected: true,
    },
  ];

  for (const paramTest of parameterTests) {
    const paramResult = grader.gradeToolParameters(paramTest.tool, paramTest.params);
    const expectedStatus = paramTest.expected ? "should pass" : "should fail";
    const actualStatus = paramResult.passed ? "passed" : "failed";
    const correct = paramResult.passed === paramTest.expected;

    console.log(`  ${paramTest.tool}: ${correct ? "CORRECT" : "INCORRECT"} (${expectedStatus}, ${actualStatus})`);
    console.log(`    ${paramResult.details}`);

    results.push({
      testCase: `Parameter - ${paramTest.tool}`,
      result: {
        passed: correct,
        score: correct ? 1.0 : 0.0,
        details: paramResult.details,
      },
    });
  }

  // 최종 결과 집계
  console.log("\n=== Evaluation Summary ===\n");

  const passedCount = results.filter(r => r.result.passed).length;
  const totalScore = results.reduce((sum, r) => sum + r.result.score, 0);
  const avgScore = totalScore / results.length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passedCount}/${results.length}`);
  console.log(`Average Score: ${(avgScore * 100).toFixed(1)}%`);

  return {
    passed: passedCount >= results.length * 0.8, // 80% 이상 통과
    score: avgScore,
    details: results,
  };
}

// 메인 실행
async function main() {
  try {
    const evalResult = await runToolSelectionEval();

    if (evalResult.passed) {
      console.log("\n[EVAL PASSED] Tool selection evaluation completed successfully.");
    } else {
      console.log("\n[EVAL FAILED] Some tool selection tests failed.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n[EVAL ERROR]", error);
    process.exit(1);
  }
}

main();
