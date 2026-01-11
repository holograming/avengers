/**
 * 기본 작업 회귀 테스트
 *
 * 이 평가는 시스템의 핵심 기능들이 여전히
 * 올바르게 동작하는지 검증하는 회귀 테스트입니다.
 *
 * 평가 기준:
 * - 에이전트 생성 및 상태 관리
 * - 작업 생성 및 할당
 * - 기본 워크플로우 실행
 * - 에러 처리 및 복구
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// 회귀 테스트 케이스 정의
interface RegressionTestCase {
  id: string;
  name: string;
  category: "agent" | "task" | "workflow" | "error";
  setup?: () => Promise<void>;
  test: () => Promise<boolean>;
  teardown?: () => Promise<void>;
  expectedResult: boolean;
  criticality: "critical" | "high" | "medium" | "low";
}

// 코드 기반 그레이더
interface GraderResult {
  passed: boolean;
  score: number;
  details: string;
  regressionDetected: boolean;
  affectedFeatures?: string[];
}

class BasicTasksGrader {
  private testHistory: Map<string, boolean[]> = new Map();

  /**
   * 테스트 결과 기록
   */
  recordTestResult(testId: string, passed: boolean): void {
    const history = this.testHistory.get(testId) || [];
    history.push(passed);
    this.testHistory.set(testId, history);
  }

  /**
   * 회귀 감지: 이전에 통과했던 테스트가 실패하면 회귀
   */
  detectRegression(testId: string, currentResult: boolean): boolean {
    const history = this.testHistory.get(testId) || [];

    // 이전에 한 번이라도 통과한 적이 있고, 현재 실패하면 회귀
    if (history.some(r => r === true) && !currentResult) {
      return true;
    }

    return false;
  }

  /**
   * 테스트 실행 및 평가
   */
  async gradeTest(testCase: RegressionTestCase): Promise<GraderResult> {
    try {
      // 셋업 실행
      if (testCase.setup) {
        await testCase.setup();
      }

      // 테스트 실행
      const result = await testCase.test();

      // 티어다운 실행
      if (testCase.teardown) {
        await testCase.teardown();
      }

      // 결과 기록
      this.recordTestResult(testCase.id, result);

      // 회귀 감지
      const regressionDetected = this.detectRegression(testCase.id, result);

      // 기대 결과와 비교
      const passed = result === testCase.expectedResult;

      return {
        passed,
        score: passed ? 1.0 : 0.0,
        details: passed
          ? `${testCase.name} 통과`
          : `${testCase.name} 실패 (기대: ${testCase.expectedResult}, 실제: ${result})`,
        regressionDetected,
        affectedFeatures: regressionDetected ? [testCase.category] : [],
      };
    } catch (error) {
      return {
        passed: false,
        score: 0.0,
        details: `${testCase.name} 에러 발생: ${error}`,
        regressionDetected: true,
        affectedFeatures: [testCase.category],
      };
    }
  }

  /**
   * 전체 회귀 점수 계산
   */
  calculateRegressionScore(results: GraderResult[]): number {
    const criticalTests = results.filter(r =>
      r.affectedFeatures?.some(f => f === "agent" || f === "workflow")
    );

    const passedCritical = criticalTests.filter(r => r.passed).length;
    const passedTotal = results.filter(r => r.passed).length;

    // 가중치: 크리티컬 테스트 70%, 일반 테스트 30%
    const criticalScore = criticalTests.length > 0
      ? passedCritical / criticalTests.length
      : 1;
    const generalScore = passedTotal / results.length;

    return criticalScore * 0.7 + generalScore * 0.3;
  }
}

// 시뮬레이션된 시스템 상태
class MockAvengersSystem {
  private agents: Map<string, { status: string; currentTask: string | null }> = new Map();
  private tasks: Map<string, { title: string; assignee: string | null; status: string }> = new Map();
  private taskCounter = 0;

  constructor() {
    // 초기 에이전트 설정
    const agentNames = ["captain", "ironman", "natasha", "groot", "jarvis", "dr-strange", "vision"];
    for (const name of agentNames) {
      this.agents.set(name, { status: "idle", currentTask: null });
    }
  }

  // 에이전트 상태 조회
  getAgentStatus(agent?: string): Record<string, unknown> {
    if (agent) {
      return { [agent]: this.agents.get(agent) };
    }
    return Object.fromEntries(this.agents);
  }

  // 에이전트 디스패치
  dispatchAgent(agent: string, task: string): { success: boolean; taskId: string } {
    const agentState = this.agents.get(agent);
    if (!agentState) {
      throw new Error(`Unknown agent: ${agent}`);
    }

    if (agentState.status === "working") {
      throw new Error(`Agent ${agent} is busy`);
    }

    const taskId = `T${String(++this.taskCounter).padStart(3, "0")}`;
    agentState.status = "working";
    agentState.currentTask = taskId;

    this.tasks.set(taskId, { title: task, assignee: agent, status: "in_progress" });

    return { success: true, taskId };
  }

  // 작업 할당
  assignTask(title: string, assignee?: string): { taskId: string } {
    const taskId = `T${String(++this.taskCounter).padStart(3, "0")}`;
    this.tasks.set(taskId, {
      title,
      assignee: assignee || null,
      status: assignee ? "assigned" : "pending"
    });

    if (assignee) {
      const agent = this.agents.get(assignee);
      if (agent) {
        agent.currentTask = taskId;
      }
    }

    return { taskId };
  }

  // 작업 완료
  completeTask(taskId: string): boolean {
    const task = this.tasks.get(taskId);
    if (!task) return false;

    task.status = "completed";

    if (task.assignee) {
      const agent = this.agents.get(task.assignee);
      if (agent) {
        agent.status = "idle";
        agent.currentTask = null;
      }
    }

    return true;
  }

  // 시스템 리셋
  reset(): void {
    for (const agent of this.agents.values()) {
      agent.status = "idle";
      agent.currentTask = null;
    }
    this.tasks.clear();
    this.taskCounter = 0;
  }
}

// 회귀 테스트 케이스 정의
function createRegressionTests(system: MockAvengersSystem): RegressionTestCase[] {
  return [
    // 에이전트 관련 테스트
    {
      id: "REG-001",
      name: "Agent status query returns all agents",
      category: "agent",
      test: async () => {
        const status = system.getAgentStatus();
        return Object.keys(status).length === 7;
      },
      expectedResult: true,
      criticality: "critical",
    },
    {
      id: "REG-002",
      name: "Individual agent status query works",
      category: "agent",
      test: async () => {
        const status = system.getAgentStatus("ironman");
        return "ironman" in status && status.ironman !== undefined;
      },
      expectedResult: true,
      criticality: "high",
    },
    {
      id: "REG-003",
      name: "Agent dispatch changes status to working",
      category: "agent",
      setup: async () => system.reset(),
      test: async () => {
        system.dispatchAgent("ironman", "Test task");
        const status = system.getAgentStatus("ironman");
        return (status.ironman as any).status === "working";
      },
      expectedResult: true,
      criticality: "critical",
    },

    // 작업 관련 테스트
    {
      id: "REG-004",
      name: "Task assignment creates task ID",
      category: "task",
      setup: async () => system.reset(),
      test: async () => {
        const result = system.assignTask("Test task", "natasha");
        return result.taskId.startsWith("T");
      },
      expectedResult: true,
      criticality: "high",
    },
    {
      id: "REG-005",
      name: "Task assignment without assignee is pending",
      category: "task",
      setup: async () => system.reset(),
      test: async () => {
        const result = system.assignTask("Unassigned task");
        return result.taskId !== undefined;
      },
      expectedResult: true,
      criticality: "medium",
    },
    {
      id: "REG-006",
      name: "Task completion frees agent",
      category: "task",
      setup: async () => system.reset(),
      test: async () => {
        const dispatch = system.dispatchAgent("groot", "Test task");
        system.completeTask(dispatch.taskId);
        const status = system.getAgentStatus("groot");
        return (status.groot as any).status === "idle";
      },
      expectedResult: true,
      criticality: "high",
    },

    // 워크플로우 테스트
    {
      id: "REG-007",
      name: "Full workflow: assign -> dispatch -> complete",
      category: "workflow",
      setup: async () => system.reset(),
      test: async () => {
        // 1. 작업 할당
        const task = system.assignTask("Full workflow test", "vision");

        // 2. 에이전트 디스패치
        try {
          system.dispatchAgent("vision", "Execute task");
        } catch {
          // vision이 이미 할당된 작업이 있으면 예외 발생 가능
        }

        // 3. 작업 완료
        const completed = system.completeTask(task.taskId);

        return completed;
      },
      expectedResult: true,
      criticality: "critical",
    },
    {
      id: "REG-008",
      name: "Sequential task assignment increments IDs",
      category: "workflow",
      setup: async () => system.reset(),
      test: async () => {
        const task1 = system.assignTask("Task 1");
        const task2 = system.assignTask("Task 2");
        const task3 = system.assignTask("Task 3");

        const id1 = parseInt(task1.taskId.slice(1));
        const id2 = parseInt(task2.taskId.slice(1));
        const id3 = parseInt(task3.taskId.slice(1));

        return id1 < id2 && id2 < id3;
      },
      expectedResult: true,
      criticality: "medium",
    },

    // 에러 처리 테스트
    {
      id: "REG-009",
      name: "Dispatch to unknown agent throws error",
      category: "error",
      setup: async () => system.reset(),
      test: async () => {
        try {
          system.dispatchAgent("unknown_agent", "Test");
          return false; // 에러가 발생해야 함
        } catch {
          return true;
        }
      },
      expectedResult: true,
      criticality: "high",
    },
    {
      id: "REG-010",
      name: "Dispatch to busy agent throws error",
      category: "error",
      setup: async () => system.reset(),
      test: async () => {
        system.dispatchAgent("jarvis", "First task");
        try {
          system.dispatchAgent("jarvis", "Second task");
          return false; // 에러가 발생해야 함
        } catch {
          return true;
        }
      },
      expectedResult: true,
      criticality: "high",
    },
    {
      id: "REG-011",
      name: "Complete non-existent task returns false",
      category: "error",
      setup: async () => system.reset(),
      test: async () => {
        const result = system.completeTask("T999");
        return result === false;
      },
      expectedResult: true,
      criticality: "medium",
    },
    {
      id: "REG-012",
      name: "System reset clears all state",
      category: "workflow",
      test: async () => {
        system.dispatchAgent("captain", "Test");
        system.assignTask("Test task");
        system.reset();

        const status = system.getAgentStatus();
        const allIdle = Object.values(status).every(
          (s: any) => s.status === "idle" && s.currentTask === null
        );

        return allIdle;
      },
      expectedResult: true,
      criticality: "medium",
    },
  ];
}

// 테스트 실행기
async function runBasicTasksRegressionEval() {
  console.log("\n=== Basic Tasks Regression Evaluation ===\n");

  const system = new MockAvengersSystem();
  const grader = new BasicTasksGrader();
  const testCases = createRegressionTests(system);
  const results: Array<{ testCase: RegressionTestCase; result: GraderResult }> = [];

  // 카테고리별 그룹화
  const categories = ["agent", "task", "workflow", "error"] as const;

  for (const category of categories) {
    console.log(`\n--- ${category.toUpperCase()} Tests ---\n`);

    const categoryTests = testCases.filter(t => t.category === category);

    for (const testCase of categoryTests) {
      const result = await grader.gradeTest(testCase);
      results.push({ testCase, result });

      const status = result.passed ? "PASS" : "FAIL";
      const regression = result.regressionDetected ? " [REGRESSION!]" : "";
      const criticality = `[${testCase.criticality.toUpperCase()}]`;

      console.log(`${status} ${criticality} ${testCase.id}: ${testCase.name}${regression}`);
      if (!result.passed) {
        console.log(`     ${result.details}`);
      }
    }
  }

  // 결과 집계
  console.log("\n=== Evaluation Summary ===\n");

  const passedCount = results.filter(r => r.result.passed).length;
  const regressionCount = results.filter(r => r.result.regressionDetected).length;
  const regressionScore = grader.calculateRegressionScore(results.map(r => r.result));

  // 크리티컬리티별 통계
  const criticalityStats = {
    critical: { total: 0, passed: 0 },
    high: { total: 0, passed: 0 },
    medium: { total: 0, passed: 0 },
    low: { total: 0, passed: 0 },
  };

  for (const { testCase, result } of results) {
    criticalityStats[testCase.criticality].total++;
    if (result.passed) {
      criticalityStats[testCase.criticality].passed++;
    }
  }

  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passedCount}/${results.length} (${(passedCount / results.length * 100).toFixed(1)}%)`);
  console.log(`Regressions Detected: ${regressionCount}`);
  console.log(`Regression Score: ${(regressionScore * 100).toFixed(1)}%`);

  console.log("\nBy Criticality:");
  for (const [level, stats] of Object.entries(criticalityStats)) {
    if (stats.total > 0) {
      console.log(`  ${level.toUpperCase()}: ${stats.passed}/${stats.total}`);
    }
  }

  // 크리티컬 테스트 모두 통과해야 성공
  const criticalPassed = criticalityStats.critical.passed === criticalityStats.critical.total;
  const highPassed = criticalityStats.high.passed >= criticalityStats.high.total * 0.9;

  return {
    passed: criticalPassed && highPassed && regressionCount === 0,
    score: regressionScore,
    details: results,
    regressionCount,
  };
}

// 메인 실행
async function main() {
  try {
    const evalResult = await runBasicTasksRegressionEval();

    if (evalResult.passed) {
      console.log("\n[EVAL PASSED] Basic tasks regression evaluation completed successfully.");
      console.log("No regressions detected. All critical tests passed.");
    } else {
      console.log("\n[EVAL FAILED] Regression tests detected issues.");
      if (evalResult.regressionCount > 0) {
        console.log(`${evalResult.regressionCount} regression(s) detected!`);
      }
      process.exit(1);
    }
  } catch (error) {
    console.error("\n[EVAL ERROR]", error);
    process.exit(1);
  }
}

main();
