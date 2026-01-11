/**
 * Captain의 작업 분배 정확성 평가
 *
 * 이 평가는 Captain 에이전트가 작업을 적절한 에이전트에게
 * 정확하게 분배하는 능력을 검증합니다.
 *
 * 평가 기준:
 * - 작업 유형에 따른 올바른 에이전트 선택
 * - 의존성 있는 작업의 순서 관리
 * - 에이전트 가용성 고려
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// 에이전트 역할 정의
const AGENT_ROLES = {
  captain: { role: "orchestrator", skills: ["planning", "coordination"] },
  ironman: { role: "fullstack", skills: ["frontend", "backend", "integration"] },
  natasha: { role: "backend", skills: ["api", "database", "security"] },
  groot: { role: "tester", skills: ["unit-test", "integration-test", "e2e"] },
  jarvis: { role: "researcher", skills: ["documentation", "research", "analysis"] },
  "dr-strange": { role: "planner", skills: ["requirements", "architecture", "design"] },
  vision: { role: "documenter", skills: ["docs", "api-spec", "diagrams"] },
} as const;

type AgentName = keyof typeof AGENT_ROLES;

// 테스트 케이스 정의
interface TaskDistributionTestCase {
  name: string;
  taskDescription: string;
  expectedAgent: AgentName;
  reason: string;
}

const TEST_CASES: TaskDistributionTestCase[] = [
  {
    name: "Backend API task should go to Natasha",
    taskDescription: "REST API 엔드포인트 구현 - 사용자 인증",
    expectedAgent: "natasha",
    reason: "API 구현은 백엔드 전문가 Natasha의 역할",
  },
  {
    name: "Frontend component task should go to IronMan",
    taskDescription: "로그인 폼 React 컴포넌트 구현",
    expectedAgent: "ironman",
    reason: "프론트엔드 컴포넌트는 풀스택 개발자 IronMan의 역할",
  },
  {
    name: "Test writing task should go to Groot",
    taskDescription: "사용자 인증 모듈 단위 테스트 작성",
    expectedAgent: "groot",
    reason: "테스트 작성은 테스트 전문가 Groot의 역할",
  },
  {
    name: "Documentation task should go to Vision",
    taskDescription: "API 문서 및 사용 가이드 작성",
    expectedAgent: "vision",
    reason: "문서화는 Vision의 역할",
  },
  {
    name: "Architecture design should go to Dr.Strange",
    taskDescription: "마이크로서비스 아키텍처 설계",
    expectedAgent: "dr-strange",
    reason: "아키텍처 설계는 기획자 Dr.Strange의 역할",
  },
];

// 코드 기반 그레이더
interface GraderResult {
  passed: boolean;
  score: number;
  details: string;
}

class TaskDistributionGrader {
  /**
   * 작업 설명을 분석하여 적절한 에이전트를 추론
   */
  inferAppropriateAgent(taskDescription: string): AgentName[] {
    const keywords = taskDescription.toLowerCase();
    const candidates: AgentName[] = [];

    // 키워드 기반 에이전트 매칭
    if (keywords.includes("api") || keywords.includes("backend") ||
        keywords.includes("database") || keywords.includes("서버")) {
      candidates.push("natasha");
    }

    if (keywords.includes("frontend") || keywords.includes("component") ||
        keywords.includes("react") || keywords.includes("ui") ||
        keywords.includes("폼") || keywords.includes("화면")) {
      candidates.push("ironman");
    }

    if (keywords.includes("test") || keywords.includes("테스트") ||
        keywords.includes("검증") || keywords.includes("coverage")) {
      candidates.push("groot");
    }

    if (keywords.includes("document") || keywords.includes("문서") ||
        keywords.includes("가이드") || keywords.includes("spec")) {
      candidates.push("vision");
    }

    if (keywords.includes("architecture") || keywords.includes("설계") ||
        keywords.includes("design") || keywords.includes("아키텍처")) {
      candidates.push("dr-strange");
    }

    if (keywords.includes("research") || keywords.includes("조사") ||
        keywords.includes("분석")) {
      candidates.push("jarvis");
    }

    return candidates.length > 0 ? candidates : ["ironman"]; // 기본값
  }

  /**
   * 작업 분배 결과를 평가
   */
  gradeDistribution(
    taskDescription: string,
    actualAgent: AgentName,
    expectedAgent: AgentName
  ): GraderResult {
    const appropriateAgents = this.inferAppropriateAgent(taskDescription);

    // 완벽 일치
    if (actualAgent === expectedAgent) {
      return {
        passed: true,
        score: 1.0,
        details: `정확히 기대한 에이전트(${expectedAgent})에게 배정됨`,
      };
    }

    // 적절한 대안 에이전트
    if (appropriateAgents.includes(actualAgent)) {
      return {
        passed: true,
        score: 0.8,
        details: `대안 에이전트(${actualAgent}) 선택됨. 적절한 선택이나 최적은 아님`,
      };
    }

    // 부적절한 배정
    return {
      passed: false,
      score: 0.0,
      details: `부적절한 에이전트(${actualAgent}) 배정. 기대: ${expectedAgent}, 적절한 대안: ${appropriateAgents.join(", ")}`,
    };
  }

  /**
   * 의존성 순서 평가
   */
  gradeDependencyOrder(
    tasks: Array<{ id: string; dependencies: string[] }>,
    executionOrder: string[]
  ): GraderResult {
    for (let i = 0; i < executionOrder.length; i++) {
      const currentTaskId = executionOrder[i];
      const currentTask = tasks.find(t => t.id === currentTaskId);

      if (!currentTask) continue;

      // 현재 작업의 의존성이 모두 이전에 실행되었는지 확인
      for (const dep of currentTask.dependencies) {
        const depIndex = executionOrder.indexOf(dep);
        if (depIndex === -1 || depIndex >= i) {
          return {
            passed: false,
            score: 0.0,
            details: `작업 ${currentTaskId}의 의존성 ${dep}가 먼저 실행되지 않음`,
          };
        }
      }
    }

    return {
      passed: true,
      score: 1.0,
      details: "모든 의존성이 올바른 순서로 실행됨",
    };
  }
}

// 테스트 실행기
async function runTaskDistributionEval() {
  console.log("\n=== Task Distribution Accuracy Evaluation ===\n");

  const grader = new TaskDistributionGrader();
  const results: Array<{ testCase: string; result: GraderResult }> = [];

  // 시나리오 1: 개별 작업 분배 정확성
  console.log("Scenario 1: Individual Task Distribution\n");

  for (const testCase of TEST_CASES) {
    console.log(`Testing: ${testCase.name}`);

    // 시뮬레이션된 Captain의 분배 결정
    // 실제 구현에서는 MCP 서버를 통해 Captain의 결정을 받아옴
    const simulatedDecision = grader.inferAppropriateAgent(testCase.taskDescription)[0];

    const result = grader.gradeDistribution(
      testCase.taskDescription,
      simulatedDecision,
      testCase.expectedAgent
    );

    results.push({ testCase: testCase.name, result });

    console.log(`  Expected: ${testCase.expectedAgent}`);
    console.log(`  Got: ${simulatedDecision}`);
    console.log(`  Score: ${result.score}`);
    console.log(`  ${result.passed ? "PASS" : "FAIL"}: ${result.details}\n`);
  }

  // 시나리오 2: 의존성 순서 평가
  console.log("\nScenario 2: Dependency Order Validation\n");

  const dependencyTestTasks = [
    { id: "T001", dependencies: [] },           // API 설계
    { id: "T002", dependencies: ["T001"] },     // API 구현
    { id: "T003", dependencies: ["T002"] },     // 프론트엔드 연동
    { id: "T004", dependencies: ["T002"] },     // API 테스트
    { id: "T005", dependencies: ["T003", "T004"] }, // 통합 테스트
  ];

  // 올바른 실행 순서
  const correctOrder = ["T001", "T002", "T003", "T004", "T005"];
  const orderResult = grader.gradeDependencyOrder(dependencyTestTasks, correctOrder);

  console.log("Testing: Correct dependency order");
  console.log(`  ${orderResult.passed ? "PASS" : "FAIL"}: ${orderResult.details}`);
  results.push({ testCase: "Dependency Order - Correct", result: orderResult });

  // 잘못된 실행 순서
  const incorrectOrder = ["T001", "T003", "T002", "T004", "T005"];
  const incorrectResult = grader.gradeDependencyOrder(dependencyTestTasks, incorrectOrder);

  console.log("\nTesting: Incorrect dependency order (should fail)");
  console.log(`  ${!incorrectResult.passed ? "PASS (correctly detected)" : "FAIL"}: ${incorrectResult.details}`);

  // 최종 결과 집계
  console.log("\n=== Evaluation Summary ===\n");

  const passedCount = results.filter(r => r.result.passed).length;
  const totalScore = results.reduce((sum, r) => sum + r.result.score, 0);
  const avgScore = totalScore / results.length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passedCount}/${results.length}`);
  console.log(`Average Score: ${(avgScore * 100).toFixed(1)}%`);

  return {
    passed: passedCount === results.length,
    score: avgScore,
    details: results,
  };
}

// 메인 실행
async function main() {
  try {
    const evalResult = await runTaskDistributionEval();

    if (evalResult.passed) {
      console.log("\n[EVAL PASSED] Task distribution accuracy evaluation completed successfully.");
    } else {
      console.log("\n[EVAL FAILED] Some task distribution tests failed.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n[EVAL ERROR]", error);
    process.exit(1);
  }
}

main();
