/**
 * Avengers MCP Evaluation Suite
 *
 * 이 파일은 모든 평가 테스트를 실행하는 엔트리포인트입니다.
 *
 * 사용법:
 *   npx tsx tests/evals/index.ts [category]
 *
 * 카테고리:
 *   - agent-coordination: 에이전트 조율 평가
 *   - tool-usage: 도구 사용 평가
 *   - regression: 회귀 테스트
 *   - capability: 능력 평가
 *   - all: 모든 평가 실행 (기본값)
 */

import { spawn } from "child_process";
import * as path from "path";

interface EvalResult {
  name: string;
  category: string;
  passed: boolean;
  score: number;
  duration: number;
  error?: string;
}

const EVALS = [
  {
    name: "Task Distribution",
    category: "agent-coordination",
    file: "agent-coordination/task-distribution.test.ts",
  },
  {
    name: "Parallel Execution",
    category: "agent-coordination",
    file: "agent-coordination/parallel-execution.test.ts",
  },
  {
    name: "Tool Selection",
    category: "tool-usage",
    file: "tool-usage/tool-selection.test.ts",
  },
  {
    name: "Basic Tasks Regression",
    category: "regression",
    file: "regression/basic-tasks.test.ts",
  },
  {
    name: "Multi-Agent Collaboration",
    category: "capability",
    file: "capability/multi-agent.test.ts",
  },
];

async function runEval(evalConfig: typeof EVALS[0]): Promise<EvalResult> {
  const startTime = Date.now();
  const evalPath = path.join(__dirname, evalConfig.file);

  return new Promise((resolve) => {
    const proc = spawn("npx", ["tsx", evalPath], {
      cwd: path.dirname(evalPath),
      stdio: ["pipe", "pipe", "pipe"],
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (data) => {
      stdout += data.toString();
    });

    proc.stderr.on("data", (data) => {
      stderr += data.toString();
    });

    proc.on("close", (code) => {
      const duration = Date.now() - startTime;

      // 결과 파싱
      const passedMatch = stdout.match(/\[EVAL (PASSED|FAILED)\]/);
      const scoreMatch = stdout.match(/Average Score: ([\d.]+)%/);

      const passed = passedMatch ? passedMatch[1] === "PASSED" : code === 0;
      const score = scoreMatch ? parseFloat(scoreMatch[1]) / 100 : (passed ? 1.0 : 0.0);

      resolve({
        name: evalConfig.name,
        category: evalConfig.category,
        passed,
        score,
        duration,
        error: code !== 0 ? stderr : undefined,
      });
    });

    proc.on("error", (error) => {
      resolve({
        name: evalConfig.name,
        category: evalConfig.category,
        passed: false,
        score: 0,
        duration: Date.now() - startTime,
        error: error.message,
      });
    });
  });
}

async function runAllEvals(category?: string): Promise<void> {
  console.log("\n" + "=".repeat(60));
  console.log("        AVENGERS MCP EVALUATION SUITE");
  console.log("=".repeat(60) + "\n");

  const evalsToRun = category && category !== "all"
    ? EVALS.filter(e => e.category === category)
    : EVALS;

  if (evalsToRun.length === 0) {
    console.error(`No evaluations found for category: ${category}`);
    console.log("Available categories: agent-coordination, tool-usage, regression, capability, all");
    process.exit(1);
  }

  console.log(`Running ${evalsToRun.length} evaluation(s)...\n`);

  const results: EvalResult[] = [];

  for (const evalConfig of evalsToRun) {
    console.log(`[${evalConfig.category}] ${evalConfig.name}...`);
    const result = await runEval(evalConfig);
    results.push(result);

    const status = result.passed ? "PASS" : "FAIL";
    const scoreStr = `${(result.score * 100).toFixed(1)}%`;
    const durationStr = `${(result.duration / 1000).toFixed(2)}s`;

    console.log(`  ${status} - Score: ${scoreStr} - Duration: ${durationStr}`);

    if (result.error) {
      console.log(`  Error: ${result.error.split("\n")[0]}`);
    }

    console.log();
  }

  // 결과 요약
  console.log("\n" + "=".repeat(60));
  console.log("                    SUMMARY");
  console.log("=".repeat(60) + "\n");

  const passedCount = results.filter(r => r.passed).length;
  const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  // 카테고리별 통계
  const categoryStats: Record<string, { passed: number; total: number; avgScore: number }> = {};

  for (const result of results) {
    if (!categoryStats[result.category]) {
      categoryStats[result.category] = { passed: 0, total: 0, avgScore: 0 };
    }
    categoryStats[result.category].total++;
    if (result.passed) {
      categoryStats[result.category].passed++;
    }
    categoryStats[result.category].avgScore += result.score;
  }

  for (const [cat, stats] of Object.entries(categoryStats)) {
    stats.avgScore /= stats.total;
  }

  console.log("By Category:");
  for (const [cat, stats] of Object.entries(categoryStats)) {
    const catStatus = stats.passed === stats.total ? "PASS" : "FAIL";
    console.log(`  [${catStatus}] ${cat}: ${stats.passed}/${stats.total} (${(stats.avgScore * 100).toFixed(1)}%)`);
  }

  console.log("\nOverall:");
  console.log(`  Total: ${passedCount}/${results.length} evaluations passed`);
  console.log(`  Average Score: ${(avgScore * 100).toFixed(1)}%`);
  console.log(`  Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);

  // 실패한 평가 목록
  const failedEvals = results.filter(r => !r.passed);
  if (failedEvals.length > 0) {
    console.log("\nFailed Evaluations:");
    for (const failed of failedEvals) {
      console.log(`  - [${failed.category}] ${failed.name}`);
    }
  }

  console.log("\n" + "=".repeat(60) + "\n");

  // 종료 코드 설정
  if (passedCount < results.length) {
    process.exit(1);
  }
}

// 메인 실행
const category = process.argv[2];
runAllEvals(category).catch((error) => {
  console.error("Evaluation suite error:", error);
  process.exit(1);
});
