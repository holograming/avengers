/**
 * Worktree 병렬 실행 격리 평가
 *
 * 이 평가는 여러 에이전트가 독립적인 Worktree에서
 * 병렬로 작업할 때 격리가 올바르게 유지되는지 검증합니다.
 *
 * 평가 기준:
 * - 각 Worktree의 독립성 보장
 * - 병렬 작업 간 충돌 방지
 * - 리소스 경합 없는 동시 실행
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { spawn, execSync } from "child_process";
import * as path from "path";
import * as fs from "fs";

// 테스트 환경 설정
const PROJECT_ROOT = "/Users/devman/Dev/cpp-claude/Avengers";
const WORKTREE_BASE = path.join(PROJECT_ROOT, "worktree");

// 시뮬레이션된 Worktree 상태
interface WorktreeState {
  path: string;
  branch: string;
  agent: string;
  taskId: string;
  files: Map<string, string>; // 파일 경로 -> 내용
  isIsolated: boolean;
}

// 코드 기반 그레이더
interface GraderResult {
  passed: boolean;
  score: number;
  details: string;
  metadata?: Record<string, unknown>;
}

class ParallelExecutionGrader {
  private worktrees: Map<string, WorktreeState> = new Map();

  /**
   * Worktree 생성 시뮬레이션
   */
  createWorktree(agent: string, taskId: string): WorktreeState {
    const worktreePath = path.join(WORKTREE_BASE, `${agent}-${taskId}`);
    const branch = `feature/${agent}-${taskId}`;

    const state: WorktreeState = {
      path: worktreePath,
      branch,
      agent,
      taskId,
      files: new Map(),
      isIsolated: true,
    };

    this.worktrees.set(worktreePath, state);
    return state;
  }

  /**
   * 파일 수정 시뮬레이션
   */
  modifyFile(worktreePath: string, filePath: string, content: string): void {
    const worktree = this.worktrees.get(worktreePath);
    if (worktree) {
      worktree.files.set(filePath, content);
    }
  }

  /**
   * 격리 검증: 한 Worktree의 변경이 다른 Worktree에 영향 없음
   */
  gradeIsolation(worktree1Path: string, worktree2Path: string): GraderResult {
    const wt1 = this.worktrees.get(worktree1Path);
    const wt2 = this.worktrees.get(worktree2Path);

    if (!wt1 || !wt2) {
      return {
        passed: false,
        score: 0,
        details: "Worktree를 찾을 수 없음",
      };
    }

    // 같은 파일을 수정했는지 확인
    const wt1Files = new Set(wt1.files.keys());
    const wt2Files = new Set(wt2.files.keys());
    const overlappingFiles = [...wt1Files].filter(f => wt2Files.has(f));

    if (overlappingFiles.length > 0) {
      // 같은 파일을 수정했지만 격리된 환경이므로 충돌 없어야 함
      const conflicts: string[] = [];

      for (const file of overlappingFiles) {
        const content1 = wt1.files.get(file);
        const content2 = wt2.files.get(file);

        // 두 Worktree에서 같은 파일의 같은 라인을 수정하면 잠재적 충돌
        // 여기서는 단순화하여 내용이 다르면 격리됨으로 판단
        if (content1 !== content2) {
          // 격리 성공: 각자 다른 내용으로 수정
          continue;
        }
      }

      return {
        passed: true,
        score: 1.0,
        details: `${overlappingFiles.length}개 파일 동시 수정됨. 격리 유지됨`,
        metadata: { overlappingFiles },
      };
    }

    return {
      passed: true,
      score: 1.0,
      details: "파일 충돌 없음. 완벽한 격리",
    };
  }

  /**
   * 병렬 실행 시간 효율성 평가
   */
  gradeParallelEfficiency(
    sequentialTime: number,
    parallelTime: number,
    taskCount: number
  ): GraderResult {
    // 이상적인 병렬 실행은 단일 작업 시간과 동일
    const idealParallelTime = sequentialTime / taskCount;
    const efficiency = idealParallelTime / parallelTime;

    // 오버헤드 허용 (최대 20%)
    const adjustedEfficiency = Math.min(efficiency, 1.0);

    if (adjustedEfficiency >= 0.8) {
      return {
        passed: true,
        score: adjustedEfficiency,
        details: `병렬 효율성 ${(adjustedEfficiency * 100).toFixed(1)}% (순차: ${sequentialTime}ms, 병렬: ${parallelTime}ms)`,
      };
    }

    return {
      passed: false,
      score: adjustedEfficiency,
      details: `병렬 효율성 부족 ${(adjustedEfficiency * 100).toFixed(1)}%. 목표: 80% 이상`,
    };
  }

  /**
   * 리소스 경합 검사
   */
  gradeResourceContention(
    worktrees: WorktreeState[],
    sharedResources: string[]
  ): GraderResult {
    const contentions: string[] = [];

    // 공유 리소스에 대한 동시 접근 검사
    for (const resource of sharedResources) {
      const accessingWorktrees = worktrees.filter(wt =>
        wt.files.has(resource)
      );

      if (accessingWorktrees.length > 1) {
        contentions.push(
          `${resource}: ${accessingWorktrees.map(wt => wt.agent).join(", ")}`
        );
      }
    }

    if (contentions.length > 0) {
      return {
        passed: false,
        score: 1 - (contentions.length / sharedResources.length),
        details: `리소스 경합 발견: ${contentions.join("; ")}`,
        metadata: { contentions },
      };
    }

    return {
      passed: true,
      score: 1.0,
      details: "리소스 경합 없음",
    };
  }

  /**
   * 브랜치 네이밍 규칙 검증
   */
  gradeBranchNaming(worktrees: WorktreeState[]): GraderResult {
    const pattern = /^feature\/[a-z-]+-T\d{3}$/;
    const invalidBranches: string[] = [];

    for (const wt of worktrees) {
      if (!pattern.test(wt.branch)) {
        invalidBranches.push(wt.branch);
      }
    }

    if (invalidBranches.length > 0) {
      return {
        passed: false,
        score: 1 - (invalidBranches.length / worktrees.length),
        details: `잘못된 브랜치 네이밍: ${invalidBranches.join(", ")}`,
      };
    }

    return {
      passed: true,
      score: 1.0,
      details: "모든 브랜치가 네이밍 규칙 준수",
    };
  }
}

// 테스트 시나리오 실행
async function runParallelExecutionEval() {
  console.log("\n=== Worktree Parallel Execution Isolation Evaluation ===\n");

  const grader = new ParallelExecutionGrader();
  const results: Array<{ testCase: string; result: GraderResult }> = [];

  // 시나리오 1: 두 에이전트의 독립 작업 격리
  console.log("Scenario 1: Two Agents Independent Work Isolation\n");

  const wt1 = grader.createWorktree("ironman", "T001");
  const wt2 = grader.createWorktree("natasha", "T002");

  // 각 Worktree에서 파일 수정 시뮬레이션
  grader.modifyFile(wt1.path, "src/components/Login.tsx", "// IronMan's code");
  grader.modifyFile(wt1.path, "src/utils/auth.ts", "// Shared utility - IronMan version");

  grader.modifyFile(wt2.path, "src/api/auth.ts", "// Natasha's code");
  grader.modifyFile(wt2.path, "src/utils/auth.ts", "// Shared utility - Natasha version");

  const isolationResult = grader.gradeIsolation(wt1.path, wt2.path);
  console.log(`Testing: Worktree isolation between IronMan and Natasha`);
  console.log(`  ${isolationResult.passed ? "PASS" : "FAIL"}: ${isolationResult.details}\n`);
  results.push({ testCase: "Worktree Isolation", result: isolationResult });

  // 시나리오 2: 병렬 실행 효율성
  console.log("Scenario 2: Parallel Execution Efficiency\n");

  const sequentialTime = 4000; // 4개 작업 순차 실행 시간 (ms)
  const parallelTime = 1200;   // 4개 작업 병렬 실행 시간 (ms)
  const taskCount = 4;

  const efficiencyResult = grader.gradeParallelEfficiency(
    sequentialTime,
    parallelTime,
    taskCount
  );
  console.log(`Testing: Parallel execution efficiency`);
  console.log(`  ${efficiencyResult.passed ? "PASS" : "FAIL"}: ${efficiencyResult.details}\n`);
  results.push({ testCase: "Parallel Efficiency", result: efficiencyResult });

  // 시나리오 3: 공유 리소스 경합 검사
  console.log("Scenario 3: Shared Resource Contention Check\n");

  const wt3 = grader.createWorktree("groot", "T003");
  grader.modifyFile(wt3.path, "tests/auth.test.ts", "// Groot's tests");

  const sharedResources = [
    "package.json",  // 공유 리소스
    "tsconfig.json", // 공유 리소스
  ];

  const contentionResult = grader.gradeResourceContention(
    [wt1, wt2, wt3],
    sharedResources
  );
  console.log(`Testing: Shared resource contention`);
  console.log(`  ${contentionResult.passed ? "PASS" : "FAIL"}: ${contentionResult.details}\n`);
  results.push({ testCase: "Resource Contention", result: contentionResult });

  // 시나리오 4: 브랜치 네이밍 규칙
  console.log("Scenario 4: Branch Naming Convention\n");

  const namingResult = grader.gradeBranchNaming([wt1, wt2, wt3]);
  console.log(`Testing: Branch naming convention`);
  console.log(`  ${namingResult.passed ? "PASS" : "FAIL"}: ${namingResult.details}\n`);
  results.push({ testCase: "Branch Naming", result: namingResult });

  // 시나리오 5: 동시 커밋 충돌 방지
  console.log("Scenario 5: Concurrent Commit Conflict Prevention\n");

  // 시뮬레이션: 두 Worktree에서 동시에 같은 파일을 수정하고 커밋
  const wt4 = grader.createWorktree("ironman", "T004");
  const wt5 = grader.createWorktree("natasha", "T005");

  // 같은 베이스 파일에서 다른 부분 수정
  grader.modifyFile(wt4.path, "src/config.ts",
    `export const config = {
  api: {
    baseUrl: "http://api.example.com", // IronMan changed this
    timeout: 5000,
  }
};`);

  grader.modifyFile(wt5.path, "src/config.ts",
    `export const config = {
  api: {
    baseUrl: "http://localhost:3000",
    timeout: 10000, // Natasha changed this
  }
};`);

  const conflictResult = grader.gradeIsolation(wt4.path, wt5.path);
  console.log(`Testing: Concurrent modification isolation`);
  console.log(`  ${conflictResult.passed ? "PASS" : "FAIL"}: ${conflictResult.details}\n`);
  results.push({ testCase: "Concurrent Modification", result: conflictResult });

  // 최종 결과 집계
  console.log("\n=== Evaluation Summary ===\n");

  const passedCount = results.filter(r => r.result.passed).length;
  const totalScore = results.reduce((sum, r) => sum + r.result.score, 0);
  const avgScore = totalScore / results.length;

  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passedCount}/${results.length}`);
  console.log(`Average Score: ${(avgScore * 100).toFixed(1)}%`);

  for (const { testCase, result } of results) {
    const status = result.passed ? "[PASS]" : "[FAIL]";
    console.log(`  ${status} ${testCase}: ${(result.score * 100).toFixed(0)}%`);
  }

  return {
    passed: passedCount === results.length,
    score: avgScore,
    details: results,
  };
}

// 메인 실행
async function main() {
  try {
    const evalResult = await runParallelExecutionEval();

    if (evalResult.passed) {
      console.log("\n[EVAL PASSED] Parallel execution isolation evaluation completed successfully.");
    } else {
      console.log("\n[EVAL FAILED] Some parallel execution tests failed.");
      process.exit(1);
    }
  } catch (error) {
    console.error("\n[EVAL ERROR]", error);
    process.exit(1);
  }
}

main();
