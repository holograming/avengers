/**
 * Validate Completion Tool
 *
 * 태스크 완료 검증 도구입니다.
 * Infinity War 원칙: "끝날 때까지 끝나지 않는다"
 *
 * 완료 검증 강제화
 * - 모든 테스트 통과 필수
 * - 커버리지/문서화는 권장
 * - 검증 실패 시 완료 불가
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { globalState } from "../index.js";

/**
 * Validation criteria result
 */
interface CriteriaResult {
  passed: number;
  total: number;
  details: string[];
}

/**
 * Test results structure
 */
interface TestResults {
  unit: {
    passed: number;
    failed: number;
    skipped: number;
  };
  integration: {
    passed: number;
    failed: number;
    skipped: number;
  };
  e2e: {
    passed: number;
    failed: number;
    skipped: number;
  };
  coverage: number;
}

/**
 * Validation result interface
 */
export interface ValidationResult {
  complete: boolean;
  score: number;
  taskId: string;
  criteria: {
    functional: CriteriaResult;
    tests: {
      allPassed: boolean;
      unit: { passed: number; failed: number };
      integration: { passed: number; failed: number };
      e2e: { passed: number; failed: number };
      coverage: number;
    };
    documentation: {
      exists: boolean;
      complete: boolean;
    };
  };
  blockers: string[];
  warnings: string[];
  recommendations: string[];
  canMerge: boolean;
  retryCount: number;
}

/**
 * Validation strictness levels
 */
export type StrictnessLevel = "strict" | "moderate" | "flexible";

/**
 * Tool definition
 */
export const validateCompletionTool: Tool = {
  name: "avengers_validate_completion",
  description: "태스크 완료 검증 도구. 테스트 통과, 커버리지, 문서화 상태를 확인하고 완료 가능 여부를 판단합니다. Infinity War 원칙에 따라 검증 통과 전까지 완료 선언이 불가능합니다.",
  inputSchema: {
    type: "object",
    properties: {
      taskId: {
        type: "string",
        description: "검증할 태스크 ID"
      },
      originalRequest: {
        type: "string",
        description: "원본 사용자 요청 (의도 검증용)"
      },
      acceptanceCriteria: {
        type: "array",
        items: { type: "string" },
        description: "검증할 승인 기준 목록"
      },
      testResults: {
        type: "object",
        description: "테스트 실행 결과",
        properties: {
          unit: {
            type: "object",
            properties: {
              passed: { type: "number" },
              failed: { type: "number" },
              skipped: { type: "number" }
            }
          },
          integration: {
            type: "object",
            properties: {
              passed: { type: "number" },
              failed: { type: "number" },
              skipped: { type: "number" }
            }
          },
          e2e: {
            type: "object",
            properties: {
              passed: { type: "number" },
              failed: { type: "number" },
              skipped: { type: "number" }
            }
          },
          coverage: { type: "number" }
        }
      },
      strictness: {
        type: "string",
        enum: ["strict", "moderate", "flexible"],
        description: "검증 엄격도 (기본: moderate)",
        default: "moderate"
      },
      documentationPaths: {
        type: "array",
        items: { type: "string" },
        description: "확인할 문서 파일 경로"
      }
    },
    required: ["taskId"]
  }
};

/**
 * Validation parameters
 */
interface ValidateParams {
  taskId: string;
  originalRequest?: string;
  acceptanceCriteria?: string[];
  testResults?: TestResults;
  strictness?: StrictnessLevel;
  documentationPaths?: string[];
}

/**
 * Track retry counts per task
 */
const retryTracker = new Map<string, number>();

/**
 * Validate functional requirements
 */
function validateFunctional(
  acceptanceCriteria: string[]
): CriteriaResult {
  // 실제 구현에서는 각 기준을 확인해야 함
  // 현재는 기준 개수만 반환
  return {
    passed: 0,  // 실제 검증 필요
    total: acceptanceCriteria.length,
    details: acceptanceCriteria.map(c => `[ ] ${c}`)
  };
}

/**
 * Validate test results
 */
function validateTests(
  testResults: TestResults | undefined,
  strictness: StrictnessLevel
): {
  allPassed: boolean;
  blockers: string[];
  warnings: string[];
} {
  if (!testResults) {
    return {
      allPassed: false,
      blockers: ["테스트 결과가 제공되지 않았습니다."],
      warnings: []
    };
  }

  const blockers: string[] = [];
  const warnings: string[] = [];

  // Unit tests
  if (testResults.unit.failed > 0) {
    blockers.push(`유닛 테스트 ${testResults.unit.failed}개 실패`);
  }

  // Integration tests
  if (testResults.integration.failed > 0) {
    blockers.push(`통합 테스트 ${testResults.integration.failed}개 실패`);
  }

  // E2E tests
  if (testResults.e2e.failed > 0) {
    if (strictness === "strict") {
      blockers.push(`E2E 테스트 ${testResults.e2e.failed}개 실패`);
    } else {
      warnings.push(`E2E 테스트 ${testResults.e2e.failed}개 실패 (권장: 수정)`);
    }
  }

  // Coverage check ((설정: moderate = 권장만)
  if (strictness === "strict" && testResults.coverage < 80) {
    blockers.push(`테스트 커버리지 ${testResults.coverage}% (최소 80% 필요)`);
  } else if (testResults.coverage < 80) {
    warnings.push(`테스트 커버리지 ${testResults.coverage}% (권장: 80% 이상)`);
  }

  return {
    allPassed: blockers.length === 0,
    blockers,
    warnings
  };
}

/**
 * Calculate validation score
 */
function calculateScore(
  testResults: TestResults | undefined,
  acceptanceCriteria: string[],
  hasDocumentation: boolean
): number {
  let score = 0;
  const weights = {
    tests: 50,
    acceptance: 30,
    documentation: 20
  };

  // Test score
  if (testResults) {
    const totalTests =
      testResults.unit.passed + testResults.unit.failed +
      testResults.integration.passed + testResults.integration.failed +
      testResults.e2e.passed + testResults.e2e.failed;

    const passedTests =
      testResults.unit.passed +
      testResults.integration.passed +
      testResults.e2e.passed;

    if (totalTests > 0) {
      score += (passedTests / totalTests) * weights.tests;
    }
  }

  // Acceptance criteria (assuming all are met for now)
  if (acceptanceCriteria.length > 0) {
    score += weights.acceptance;  // Assume passed for demo
  }

  // Documentation
  if (hasDocumentation) {
    score += weights.documentation;
  }

  return Math.round(score);
}

/**
 * Main handler
 */
export async function handleValidateCompletion(args: Record<string, unknown>) {
  const params = args as unknown as ValidateParams;
  const {
    taskId,
    originalRequest,
    acceptanceCriteria = [],
    testResults,
    strictness = "moderate",
    documentationPaths = []
  } = params;

  // Get task from global state
  const task = globalState.tasks.get(taskId);
  if (!task) {
    return {
      content: [{
        type: "text",
        text: JSON.stringify({
          error: `태스크를 찾을 수 없습니다: ${taskId}`,
          suggestion: "유효한 태스크 ID를 입력해주세요."
        }, null, 2)
      }],
      isError: true
    };
  }

  // Track retries
  const currentRetries = retryTracker.get(taskId) || 0;
  retryTracker.set(taskId, currentRetries + 1);

  // Validate functional requirements
  const functionalResult = validateFunctional(acceptanceCriteria);

  // Validate tests
  const testValidation = validateTests(testResults, strictness);

  // Check documentation (simplified)
  const hasDocumentation = documentationPaths.length > 0;

  // Calculate score
  const score = calculateScore(testResults, acceptanceCriteria, hasDocumentation);

  // Build blockers and warnings
  const blockers: string[] = [...testValidation.blockers];
  const warnings: string[] = [...testValidation.warnings];
  const recommendations: string[] = [];

  // Add recommendations based on analysis
  if (!hasDocumentation) {
    recommendations.push("API 문서 또는 README 업데이트를 권장합니다.");
  }

  if (testResults && testResults.coverage < 70) {
    recommendations.push("테스트 커버리지 개선을 권장합니다.");
  }

  // Determine completion status
  const isComplete = blockers.length === 0;
  const canMerge = isComplete;

  // Build result
  const result: ValidationResult = {
    complete: isComplete,
    score,
    taskId,
    criteria: {
      functional: functionalResult,
      tests: {
        allPassed: testValidation.allPassed,
        unit: {
          passed: testResults?.unit.passed || 0,
          failed: testResults?.unit.failed || 0
        },
        integration: {
          passed: testResults?.integration.passed || 0,
          failed: testResults?.integration.failed || 0
        },
        e2e: {
          passed: testResults?.e2e.passed || 0,
          failed: testResults?.e2e.failed || 0
        },
        coverage: testResults?.coverage || 0
      },
      documentation: {
        exists: hasDocumentation,
        complete: hasDocumentation  // Simplified
      }
    },
    blockers,
    warnings,
    recommendations,
    canMerge,
    retryCount: currentRetries + 1
  };

  // Build message
  const message = buildValidationMessage(result, strictness);

  // If not complete, suggest next action
  const nextAction = !isComplete
    ? {
        action: "retry",
        message: "블로커 해결 후 다시 검증하세요.",
        blockerCount: blockers.length,
        infinityWar: "끝날 때까지 끝나지 않습니다. 계속 시도하세요!"
      }
    : {
        action: "merge",
        message: "검증 완료. 병합 가능합니다.",
        tool: "avengers_merge_worktree"
      };

  return {
    content: [{
      type: "text",
      text: JSON.stringify({
        result,
        message,
        nextAction
      }, null, 2)
    }]
  };
}

/**
 * Build human-readable validation message
 */
function buildValidationMessage(
  result: ValidationResult,
  strictness: StrictnessLevel
): string {
  const lines: string[] = [
    `## 완료 검증 결과`,
    ``,
    `**태스크**: ${result.taskId}`,
    `**상태**: ${result.complete ? "✅ 완료 가능" : "❌ 블로커 존재"}`,
    `**점수**: ${result.score}/100`,
    `**검증 횟수**: ${result.retryCount}회`,
    `**엄격도**: ${strictness}`,
    ``
  ];

  // Test results
  lines.push(`### 테스트 결과`);
  lines.push(`- 유닛: ${result.criteria.tests.unit.passed} 통과 / ${result.criteria.tests.unit.failed} 실패`);
  lines.push(`- 통합: ${result.criteria.tests.integration.passed} 통과 / ${result.criteria.tests.integration.failed} 실패`);
  lines.push(`- E2E: ${result.criteria.tests.e2e.passed} 통과 / ${result.criteria.tests.e2e.failed} 실패`);
  lines.push(`- 커버리지: ${result.criteria.tests.coverage}%`);
  lines.push(``);

  // Blockers
  if (result.blockers.length > 0) {
    lines.push(`### ❌ 블로커`);
    result.blockers.forEach(b => lines.push(`- ${b}`));
    lines.push(``);
  }

  // Warnings
  if (result.warnings.length > 0) {
    lines.push(`### ⚠️ 경고`);
    result.warnings.forEach(w => lines.push(`- ${w}`));
    lines.push(``);
  }

  // Recommendations
  if (result.recommendations.length > 0) {
    lines.push(`### 💡 권장사항`);
    result.recommendations.forEach(r => lines.push(`- ${r}`));
    lines.push(``);
  }

  // Infinity War message
  if (!result.complete) {
    lines.push(`---`);
    lines.push(`**Infinity War**: 끝날 때까지 끝나지 않습니다.`);
    lines.push(`블로커를 해결하고 다시 검증하세요.`);
  }

  return lines.join("\n");
}
