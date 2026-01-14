/**
 * Assemble State Type Definitions
 *
 * `/assemble` 명령어와 Plan 모드 통합을 위한 상태 관리 타입입니다.
 */

import type { RequestAnalysis } from "../tools/analyze-request.js";

/**
 * Assemble 전용 상태 정보
 * Plan 모드에서 계획 수립 후 저장되는 정보
 */
export interface AssembleState {
  sessionId: string;
  timestamp: string;

  // 사용자 요청 정보
  request: string;

  // 분석 결과
  analysis: RequestAnalysis;

  // 실행 상태
  status: "planning" | "ready-to-execute" | "executing" | "completed" | "failed";

  // Plan 모드에서 수집한 정보
  researchResults?: {
    terms: string[];
    findings: string[];
    references?: string[];
  };

  // 계획 단계에서 결정된 작업 분배
  plannedTasks?: Array<{
    id: string;
    title: string;
    assignee: string;
    description?: string;
    priority?: "high" | "normal" | "low";
    dependencies?: string[];
  }>;

  // 실행 컨텍스트
  executionContext?: {
    planFile?: string;
    mode: "planning" | "execution";
    startedAt?: string;
    completedAt?: string;
  };

  // 에러 정보
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };

  // 메타데이터
  metadata?: {
    version: string;
    agent: string;
    branch?: string;
    commit?: string;
  };
}

/**
 * Assemble 계획 상태 (Plan 모드에서 사용)
 */
export interface AssemblePlanState {
  sessionId: string;
  timestamp: string;
  planFile: string;

  // 요청 분석 정보
  request: string;
  analysis: RequestAnalysis;

  // 계획 단계에서 수집한 정보
  research: {
    completed: boolean;
    depth: "quick" | "moderate" | "comprehensive";
    findings?: string[];
    references?: string[];
  };

  // 전략 수립 결과
  strategy: {
    requiredAgents: string[];
    phases: number[];
    estimatedDuration?: string;
    risks?: string[];
  };

  // 다음 단계 안내
  nextSteps: string[];

  // 상태
  status: "in-planning" | "plan-ready" | "awaiting-execution";
}

/**
 * Assemble 실행 상태 (일반 모드 또는 Plan 모드 종료 후)
 */
export interface AssembleExecutionState {
  sessionId: string;
  planSessionId?: string; // Plan 모드에서 계획했다면 참조
  timestamp: string;

  // 원본 요청 및 분석
  request: string;
  analysis: RequestAnalysis;

  // 현재 실행 상태
  currentPhase: number;
  status: "executing" | "paused" | "completed" | "failed";

  // 실행 진행 상황
  progress: {
    phasesCompleted: number[];
    phasesInProgress: number[];
    phasesPending: number[];
  };

  // 작업 실행 결과
  executedTasks?: Array<{
    id: string;
    title: string;
    assignee: string;
    status: "completed" | "failed" | "skipped";
    result?: unknown;
    error?: string;
    duration?: number;
  }>;

  // 최종 결과
  result?: {
    success: boolean;
    output?: unknown;
    artifacts?: string[]; // 생성된 파일 경로들
    metrics?: {
      totalDuration?: number;
      testsPassed?: number;
      testsFailed?: number;
      coverage?: number;
    };
  };
}

/**
 * Assemble 통합 상태 (모든 정보 포함)
 */
export type AssembleIntegratedState = AssembleState | AssemblePlanState | AssembleExecutionState;

/**
 * Assemble 상태를 저장할 때 사용하는 인터페이스
 */
export interface AssembleSavePayload {
  request: string;
  analysisData: Record<string, unknown>;
  mode: "planning" | "execution";
  workflow: string;
  completionLevel: string;
  researchResults?: string;
  plannedTasks?: Array<{
    title: string;
    assignee: string;
    description?: string;
  }>;
}
