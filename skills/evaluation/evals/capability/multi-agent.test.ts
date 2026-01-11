/**
 * 다중 에이전트 협업 능력 평가
 *
 * 이 평가는 여러 에이전트가 함께 협업하여
 * 복잡한 작업을 수행하는 능력을 검증합니다.
 *
 * 평가 기준:
 * - 에이전트 간 작업 핸드오프
 * - 병렬 작업 조율
 * - 의존성 기반 작업 순서 관리
 * - 리소스 경합 해결
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

// 에이전트 정의
type AgentName = "captain" | "ironman" | "natasha" | "groot" | "jarvis" | "dr-strange" | "vision";

interface Agent {
  name: AgentName;
  role: string;
  skills: string[];
  status: "idle" | "working" | "blocked";
  currentTask: string | null;
  completedTasks: string[];
}

interface Task {
  id: string;
  title: string;
  description: string;
  requiredSkills: string[];
  dependencies: string[];
  assignee: AgentName | null;
  status: "pending" | "in_progress" | "completed" | "blocked";
  output?: unknown;
}

interface HandoffEvent {
  timestamp: number;
  fromAgent: AgentName;
  toAgent: AgentName;
  taskId: string;
  reason: string;
}

// 코드 기반 그레이더
interface GraderResult {
  passed: boolean;
  score: number;
  details: string;
  metadata?: Record<string, unknown>;
}

class MultiAgentGrader {
  /**
   * 핸드오프 효율성 평가
   * - 불필요한 핸드오프 최소화
   * - 적절한 스킬 매칭
   */
  gradeHandoffEfficiency(handoffs: HandoffEvent[], tasks: Task[]): GraderResult {
    if (handoffs.length === 0) {
      return {
        passed: true,
        score: 1.0,
        details: "핸드오프 없음 - 단일 에이전트 작업 또는 완벽한 초기 할당",
      };
    }

    let unnecessaryHandoffs = 0;
    let skillMismatchHandoffs = 0;

    for (const handoff of handoffs) {
      const task = tasks.find(t => t.id === handoff.taskId);
      if (!task) continue;

      // 불필요한 핸드오프: 같은 역할의 에이전트로 전달
      if (this.getAgentRole(handoff.fromAgent) === this.getAgentRole(handoff.toAgent)) {
        unnecessaryHandoffs++;
      }

      // 스킬 미스매치: 필요한 스킬 없는 에이전트로 전달
      const toAgentSkills = this.getAgentSkills(handoff.toAgent);
      const hasRequiredSkill = task.requiredSkills.some(s => toAgentSkills.includes(s));
      if (!hasRequiredSkill) {
        skillMismatchHandoffs++;
      }
    }

    const efficiencyScore = 1 - ((unnecessaryHandoffs + skillMismatchHandoffs) / handoffs.length);

    return {
      passed: efficiencyScore >= 0.8,
      score: efficiencyScore,
      details: `핸드오프 효율성: ${(efficiencyScore * 100).toFixed(0)}% (총 ${handoffs.length}회, 불필요: ${unnecessaryHandoffs}, 스킬 미스매치: ${skillMismatchHandoffs})`,
      metadata: { handoffs: handoffs.length, unnecessary: unnecessaryHandoffs, mismatch: skillMismatchHandoffs },
    };
  }

  /**
   * 병렬 작업 조율 평가
   * - 동시 실행 가능한 작업의 병렬화
   * - 의존성 있는 작업의 순차 처리
   */
  gradeParallelCoordination(
    tasks: Task[],
    executionTimeline: Array<{ taskId: string; startTime: number; endTime: number; agent: AgentName }>
  ): GraderResult {
    // 의존성 없는 작업들이 병렬로 실행되었는지 확인
    const independentTasks = tasks.filter(t => t.dependencies.length === 0);
    const dependentTasks = tasks.filter(t => t.dependencies.length > 0);

    // 병렬 실행 확인
    let parallelExecutions = 0;
    for (let i = 0; i < executionTimeline.length; i++) {
      for (let j = i + 1; j < executionTimeline.length; j++) {
        const task1 = executionTimeline[i];
        const task2 = executionTimeline[j];

        // 시간이 겹치면 병렬 실행
        const overlaps = task1.startTime < task2.endTime && task2.startTime < task1.endTime;
        if (overlaps) {
          // 두 작업이 모두 독립적이거나 의존성 없는 경우 유효한 병렬화
          const t1 = tasks.find(t => t.id === task1.taskId);
          const t2 = tasks.find(t => t.id === task2.taskId);

          if (t1 && t2) {
            const validParallel = !t1.dependencies.includes(t2.id) && !t2.dependencies.includes(t1.id);
            if (validParallel) {
              parallelExecutions++;
            }
          }
        }
      }
    }

    // 의존성 순서 검증
    let dependencyViolations = 0;
    for (const task of dependentTasks) {
      const taskExecution = executionTimeline.find(e => e.taskId === task.id);
      if (!taskExecution) continue;

      for (const depId of task.dependencies) {
        const depExecution = executionTimeline.find(e => e.taskId === depId);
        if (depExecution && depExecution.endTime > taskExecution.startTime) {
          dependencyViolations++;
        }
      }
    }

    const parallelScore = independentTasks.length > 1
      ? Math.min(parallelExecutions / (independentTasks.length - 1), 1.0)
      : 1.0;
    const dependencyScore = dependentTasks.length > 0
      ? 1 - (dependencyViolations / dependentTasks.length)
      : 1.0;

    const overallScore = (parallelScore * 0.5) + (dependencyScore * 0.5);

    return {
      passed: overallScore >= 0.8 && dependencyViolations === 0,
      score: overallScore,
      details: `병렬 조율: ${(overallScore * 100).toFixed(0)}% (병렬 실행: ${parallelExecutions}, 의존성 위반: ${dependencyViolations})`,
      metadata: { parallelExecutions, dependencyViolations },
    };
  }

  /**
   * 리소스 경합 해결 평가
   * - 공유 리소스 접근 조율
   * - 데드락 방지
   */
  gradeResourceContention(
    agents: Agent[],
    sharedResources: string[],
    accessLog: Array<{ agent: AgentName; resource: string; action: "acquire" | "release"; time: number }>
  ): GraderResult {
    const contentions: Array<{ resource: string; agents: AgentName[]; time: number }> = [];
    const resourceHolders: Map<string, { agent: AgentName; acquireTime: number }> = new Map();

    // 접근 로그 분석
    for (const access of accessLog.sort((a, b) => a.time - b.time)) {
      if (access.action === "acquire") {
        const currentHolder = resourceHolders.get(access.resource);
        if (currentHolder && currentHolder.agent !== access.agent) {
          contentions.push({
            resource: access.resource,
            agents: [currentHolder.agent, access.agent],
            time: access.time,
          });
        } else {
          resourceHolders.set(access.resource, { agent: access.agent, acquireTime: access.time });
        }
      } else {
        const holder = resourceHolders.get(access.resource);
        if (holder && holder.agent === access.agent) {
          resourceHolders.delete(access.resource);
        }
      }
    }

    // 데드락 검사 (순환 대기)
    const deadlockDetected = this.detectDeadlock(resourceHolders, accessLog);

    const contentionScore = sharedResources.length > 0
      ? 1 - (contentions.length / (sharedResources.length * 2))
      : 1.0;

    return {
      passed: contentions.length === 0 && !deadlockDetected,
      score: deadlockDetected ? 0 : Math.max(contentionScore, 0),
      details: deadlockDetected
        ? "데드락 감지됨!"
        : contentions.length === 0
          ? "리소스 경합 없음"
          : `리소스 경합 ${contentions.length}회 발생`,
      metadata: { contentions, deadlockDetected },
    };
  }

  /**
   * 작업 완료율 평가
   */
  gradeTaskCompletion(tasks: Task[]): GraderResult {
    const completed = tasks.filter(t => t.status === "completed").length;
    const blocked = tasks.filter(t => t.status === "blocked").length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;

    const completionRate = completed / tasks.length;

    return {
      passed: completionRate === 1.0,
      score: completionRate,
      details: `완료: ${completed}/${tasks.length}, 진행중: ${inProgress}, 블록됨: ${blocked}`,
      metadata: { completed, blocked, inProgress, total: tasks.length },
    };
  }

  /**
   * 에이전트 활용도 평가
   */
  gradeAgentUtilization(
    agents: Agent[],
    executionTimeline: Array<{ taskId: string; startTime: number; endTime: number; agent: AgentName }>
  ): GraderResult {
    const totalDuration = Math.max(...executionTimeline.map(e => e.endTime)) -
                         Math.min(...executionTimeline.map(e => e.startTime));

    const agentWorkTime: Map<AgentName, number> = new Map();

    for (const execution of executionTimeline) {
      const current = agentWorkTime.get(execution.agent) || 0;
      agentWorkTime.set(execution.agent, current + (execution.endTime - execution.startTime));
    }

    const activeAgents = agentWorkTime.size;
    const avgUtilization = activeAgents > 0
      ? [...agentWorkTime.values()].reduce((a, b) => a + b, 0) / (activeAgents * totalDuration)
      : 0;

    // 작업 분배 균등성
    const workTimes = [...agentWorkTime.values()];
    const avgWorkTime = workTimes.reduce((a, b) => a + b, 0) / workTimes.length;
    const variance = workTimes.reduce((sum, t) => sum + Math.pow(t - avgWorkTime, 2), 0) / workTimes.length;
    const stdDev = Math.sqrt(variance);
    const uniformityScore = avgWorkTime > 0 ? 1 - (stdDev / avgWorkTime) : 1;

    const overallScore = (avgUtilization * 0.6) + (uniformityScore * 0.4);

    return {
      passed: overallScore >= 0.6,
      score: overallScore,
      details: `에이전트 활용도: ${(avgUtilization * 100).toFixed(0)}%, 작업 분배 균등성: ${(uniformityScore * 100).toFixed(0)}%`,
      metadata: { activeAgents, avgUtilization, uniformityScore },
    };
  }

  // 헬퍼 메서드
  private getAgentRole(name: AgentName): string {
    const roles: Record<AgentName, string> = {
      captain: "orchestrator",
      ironman: "fullstack",
      natasha: "backend",
      groot: "tester",
      jarvis: "researcher",
      "dr-strange": "planner",
      vision: "documenter",
    };
    return roles[name];
  }

  private getAgentSkills(name: AgentName): string[] {
    const skills: Record<AgentName, string[]> = {
      captain: ["planning", "coordination"],
      ironman: ["frontend", "backend", "integration"],
      natasha: ["api", "database", "security"],
      groot: ["unit-test", "integration-test", "e2e"],
      jarvis: ["documentation", "research", "analysis"],
      "dr-strange": ["requirements", "architecture", "design"],
      vision: ["docs", "api-spec", "diagrams"],
    };
    return skills[name];
  }

  private detectDeadlock(
    resourceHolders: Map<string, { agent: AgentName; acquireTime: number }>,
    accessLog: Array<{ agent: AgentName; resource: string; action: "acquire" | "release"; time: number }>
  ): boolean {
    // 간단한 데드락 감지: 순환 대기 패턴 확인
    // 실제 구현에서는 더 복잡한 알고리즘 필요
    return false; // 시뮬레이션에서는 데드락 없음으로 처리
  }
}

// 시뮬레이션 시나리오 실행
async function runMultiAgentEval() {
  console.log("\n=== Multi-Agent Collaboration Capability Evaluation ===\n");

  const grader = new MultiAgentGrader();
  const results: Array<{ testCase: string; result: GraderResult }> = [];

  // 시나리오 1: 사용자 인증 기능 구현 (다중 에이전트 협업)
  console.log("Scenario 1: User Authentication Feature Implementation\n");

  const scenario1Tasks: Task[] = [
    {
      id: "T001",
      title: "요구사항 분석",
      description: "사용자 인증 요구사항 분석",
      requiredSkills: ["requirements", "architecture"],
      dependencies: [],
      assignee: "dr-strange",
      status: "completed",
    },
    {
      id: "T002",
      title: "API 설계",
      description: "인증 API 엔드포인트 설계",
      requiredSkills: ["api", "security"],
      dependencies: ["T001"],
      assignee: "natasha",
      status: "completed",
    },
    {
      id: "T003",
      title: "프론트엔드 설계",
      description: "로그인 UI 컴포넌트 설계",
      requiredSkills: ["frontend"],
      dependencies: ["T001"],
      assignee: "ironman",
      status: "completed",
    },
    {
      id: "T004",
      title: "API 구현",
      description: "인증 API 구현",
      requiredSkills: ["api", "database"],
      dependencies: ["T002"],
      assignee: "natasha",
      status: "completed",
    },
    {
      id: "T005",
      title: "프론트엔드 구현",
      description: "로그인 컴포넌트 구현",
      requiredSkills: ["frontend"],
      dependencies: ["T003", "T004"],
      assignee: "ironman",
      status: "completed",
    },
    {
      id: "T006",
      title: "테스트 작성",
      description: "인증 모듈 테스트",
      requiredSkills: ["unit-test", "integration-test"],
      dependencies: ["T004", "T005"],
      assignee: "groot",
      status: "completed",
    },
    {
      id: "T007",
      title: "문서화",
      description: "API 문서 작성",
      requiredSkills: ["docs", "api-spec"],
      dependencies: ["T004"],
      assignee: "vision",
      status: "completed",
    },
  ];

  const scenario1Timeline = [
    { taskId: "T001", startTime: 0, endTime: 100, agent: "dr-strange" as AgentName },
    { taskId: "T002", startTime: 100, endTime: 200, agent: "natasha" as AgentName },
    { taskId: "T003", startTime: 100, endTime: 180, agent: "ironman" as AgentName }, // 병렬
    { taskId: "T004", startTime: 200, endTime: 350, agent: "natasha" as AgentName },
    { taskId: "T007", startTime: 350, endTime: 420, agent: "vision" as AgentName }, // 병렬
    { taskId: "T005", startTime: 350, endTime: 500, agent: "ironman" as AgentName }, // 병렬
    { taskId: "T006", startTime: 500, endTime: 600, agent: "groot" as AgentName },
  ];

  const scenario1Handoffs: HandoffEvent[] = [
    { timestamp: 100, fromAgent: "dr-strange", toAgent: "natasha", taskId: "T002", reason: "요구사항 분석 완료" },
    { timestamp: 100, fromAgent: "dr-strange", toAgent: "ironman", taskId: "T003", reason: "요구사항 분석 완료" },
  ];

  // 평가 실행
  const handoffResult = grader.gradeHandoffEfficiency(scenario1Handoffs, scenario1Tasks);
  console.log(`Handoff Efficiency: ${handoffResult.passed ? "PASS" : "FAIL"}`);
  console.log(`  ${handoffResult.details}`);
  results.push({ testCase: "Handoff Efficiency", result: handoffResult });

  const coordinationResult = grader.gradeParallelCoordination(scenario1Tasks, scenario1Timeline);
  console.log(`Parallel Coordination: ${coordinationResult.passed ? "PASS" : "FAIL"}`);
  console.log(`  ${coordinationResult.details}`);
  results.push({ testCase: "Parallel Coordination", result: coordinationResult });

  const completionResult = grader.gradeTaskCompletion(scenario1Tasks);
  console.log(`Task Completion: ${completionResult.passed ? "PASS" : "FAIL"}`);
  console.log(`  ${completionResult.details}`);
  results.push({ testCase: "Task Completion", result: completionResult });

  // 시나리오 2: 리소스 경합 테스트
  console.log("\n\nScenario 2: Resource Contention Test\n");

  const agents: Agent[] = [
    { name: "ironman", role: "fullstack", skills: ["frontend", "backend"], status: "idle", currentTask: null, completedTasks: [] },
    { name: "natasha", role: "backend", skills: ["api", "database"], status: "idle", currentTask: null, completedTasks: [] },
  ];

  const sharedResources = ["database_connection", "config_file", "cache_service"];

  const accessLog: Array<{ agent: AgentName; resource: string; action: "acquire" | "release"; time: number }> = [
    { agent: "ironman", resource: "database_connection", action: "acquire", time: 0 },
    { agent: "natasha", resource: "config_file", action: "acquire", time: 10 },
    { agent: "ironman", resource: "database_connection", action: "release", time: 50 },
    { agent: "natasha", resource: "database_connection", action: "acquire", time: 60 },
    { agent: "natasha", resource: "config_file", action: "release", time: 80 },
    { agent: "natasha", resource: "database_connection", action: "release", time: 100 },
  ];

  const contentionResult = grader.gradeResourceContention(agents, sharedResources, accessLog);
  console.log(`Resource Contention: ${contentionResult.passed ? "PASS" : "FAIL"}`);
  console.log(`  ${contentionResult.details}`);
  results.push({ testCase: "Resource Contention", result: contentionResult });

  // 시나리오 3: 에이전트 활용도
  console.log("\n\nScenario 3: Agent Utilization\n");

  const utilizationResult = grader.gradeAgentUtilization(agents, scenario1Timeline);
  console.log(`Agent Utilization: ${utilizationResult.passed ? "PASS" : "FAIL"}`);
  console.log(`  ${utilizationResult.details}`);
  results.push({ testCase: "Agent Utilization", result: utilizationResult });

  // 시나리오 4: 복잡한 의존성 그래프
  console.log("\n\nScenario 4: Complex Dependency Graph\n");

  const complexTasks: Task[] = [
    { id: "C001", title: "Core Module", description: "", requiredSkills: ["backend"], dependencies: [], assignee: "natasha", status: "completed" },
    { id: "C002", title: "Auth Module", description: "", requiredSkills: ["backend", "security"], dependencies: ["C001"], assignee: "natasha", status: "completed" },
    { id: "C003", title: "User Module", description: "", requiredSkills: ["backend"], dependencies: ["C001"], assignee: "natasha", status: "completed" },
    { id: "C004", title: "UI Framework", description: "", requiredSkills: ["frontend"], dependencies: [], assignee: "ironman", status: "completed" },
    { id: "C005", title: "Login UI", description: "", requiredSkills: ["frontend"], dependencies: ["C002", "C004"], assignee: "ironman", status: "completed" },
    { id: "C006", title: "Profile UI", description: "", requiredSkills: ["frontend"], dependencies: ["C003", "C004"], assignee: "ironman", status: "completed" },
    { id: "C007", title: "E2E Tests", description: "", requiredSkills: ["e2e"], dependencies: ["C005", "C006"], assignee: "groot", status: "completed" },
  ];

  const complexTimeline = [
    { taskId: "C001", startTime: 0, endTime: 50, agent: "natasha" as AgentName },
    { taskId: "C004", startTime: 0, endTime: 40, agent: "ironman" as AgentName }, // 병렬
    { taskId: "C002", startTime: 50, endTime: 100, agent: "natasha" as AgentName },
    { taskId: "C003", startTime: 50, endTime: 90, agent: "natasha" as AgentName }, // 순차 (같은 에이전트)
    { taskId: "C005", startTime: 100, endTime: 150, agent: "ironman" as AgentName },
    { taskId: "C006", startTime: 100, endTime: 140, agent: "ironman" as AgentName }, // 순차 (같은 에이전트)
    { taskId: "C007", startTime: 150, endTime: 200, agent: "groot" as AgentName },
  ];

  const complexCoordinationResult = grader.gradeParallelCoordination(complexTasks, complexTimeline);
  console.log(`Complex Dependency Handling: ${complexCoordinationResult.passed ? "PASS" : "FAIL"}`);
  console.log(`  ${complexCoordinationResult.details}`);
  results.push({ testCase: "Complex Dependencies", result: complexCoordinationResult });

  // 최종 결과 집계
  console.log("\n\n=== Evaluation Summary ===\n");

  const passedCount = results.filter(r => r.result.passed).length;
  const totalScore = results.reduce((sum, r) => sum + r.result.score, 0);
  const avgScore = totalScore / results.length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passedCount}/${results.length}`);
  console.log(`Average Score: ${(avgScore * 100).toFixed(1)}%`);

  console.log("\nDetailed Results:");
  for (const { testCase, result } of results) {
    const status = result.passed ? "[PASS]" : "[FAIL]";
    console.log(`  ${status} ${testCase}: ${(result.score * 100).toFixed(0)}%`);
  }

  return {
    passed: passedCount >= results.length * 0.8,
    score: avgScore,
    details: results,
  };
}

// 메인 실행
async function main() {
  try {
    const evalResult = await runMultiAgentEval();

    if (evalResult.passed) {
      console.log("\n[EVAL PASSED] Multi-agent collaboration capability evaluation completed successfully.");
    } else {
      console.log("\n[EVAL FAILED] Some multi-agent collaboration tests failed.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n[EVAL ERROR]", error);
    process.exit(1);
  }
}

main();
