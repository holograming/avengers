# Avengers Features - Claude Code Integration

이 문서는 Avengers 시스템이 제공하는 Claude Code 기반 기능들을 상세히 설명합니다.

## Table of Contents

1. [Overview](#overview)
2. [MCP Tools API Reference](#mcp-tools-api-reference)
3. [Parallel Agent System](#parallel-agent-system-m4)
4. [Efficiency System](#efficiency-system-m3)
5. [Evaluation Framework](#evaluation-framework-m1)
6. [Specialized Skills](#specialized-skills-m2)
7. [Agent Templates](#agent-templates)

---

## Overview

Avengers는 Claude Code의 다음 기능들을 활용합니다:

| Claude Code 기능 | Avengers 활용 |
|-----------------|---------------|
| **Background Task** | 병렬 에이전트 실행 |
| **MCP (Model Context Protocol)** | 11개 커스텀 도구 제공 |
| **Git Worktree** | 에이전트별 독립 작업 공간 |
| **Slash Commands** | /mission, /assemble, /debrief |
| **Plan Mode** | 로드맵 기반 작업 관리 |

---

## MCP Tools API Reference

### avengers-core (14개 도구)

#### avengers_analyze_request

Captain의 요청 분석 도구. 요청 유형을 판단하여 적절한 워크플로우를 선택합니다.

```typescript
interface AnalyzeRequestParams {
  request: string;              // 사용자 요청
  context?: string;             // 추가 컨텍스트
  forceResearch?: boolean;      // 리서치 강제 여부
}

// 반환:
interface RequestAnalysis {
  type: "research" | "planning" | "development" | "testing" | "documentation" | "review" | "bugfix" | "hybrid";
  workflow: "research-only" | "planning-only" | "quick-fix" | "documentation-only" | "full-development";
  requiredAgents: string[];
  firstStep: string;
  confidenceScore: number;
  reasoning: string;
}
```

#### avengers_validate_completion

완료 검증 도구. Infinity War 원칙에 따라 검증 통과 전까지 완료 불가.

```typescript
interface ValidateCompletionParams {
  taskId: string;
  testResults?: {
    unit: { passed: number; failed: number; skipped: number };
    integration: { passed: number; failed: number; skipped: number };
    e2e: { passed: number; failed: number; skipped: number };
    coverage: number;
  };
  strictness?: "strict" | "moderate" | "flexible";
}

// 반환:
interface ValidationResult {
  complete: boolean;
  score: number;
  blockers: string[];
  warnings: string[];
  canMerge: boolean;
  retryCount: number;
}
```

#### avengers_agent_communicate

에이전트 간 메시지 전달 도구.

```typescript
interface AgentCommunicateParams {
  from: AgentType;
  to: AgentType | "all";
  type: "result" | "request" | "notify" | "handoff";
  payload: {
    taskId?: string;
    content: string;
    artifacts?: string[];
    priority?: "critical" | "high" | "medium" | "low";
  };
}
```

#### avengers_broadcast

전체 에이전트에게 알림 전송.

```typescript
interface BroadcastParams {
  from: AgentType;
  type?: "notify" | "result";
  payload: {
    content: string;
    priority?: "critical" | "high" | "medium" | "low";
  };
}
```

#### avengers_get_shared_context

공유 컨텍스트 조회.

```typescript
interface GetSharedContextParams {
  taskId: string;
  filter?: { agents?: AgentType[] };
}
```

#### avengers_update_shared_context

공유 컨텍스트 업데이트.

```typescript
interface UpdateSharedContextParams {
  taskId: string;
  agent: AgentType;
  files?: string[];
  summary: string;
}
```

---

### avengers-core 기존 도구 (8개)

#### avengers_dispatch_agent

에이전트를 특정 작업에 디스패치합니다.

```typescript
interface DispatchAgentParams {
  agent: "captain" | "ironman" | "natasha" | "groot" | "jarvis" | "dr-strange" | "vision";
  task: string;

  // 명시적 컨텍스트 (신규)
  context?: {
    files?: string[];           // 참조할 파일 경로
    snippets?: CodeSnippet[];   // 특정 코드 섹션
    references?: string[];      // URL 또는 문서 경로
  };

  worktree?: boolean;           // 독립 브랜치 생성 (default: false)
  priority?: "critical" | "high" | "medium" | "low";

  // 실행 모드 (신규)
  mode?: "background" | "foreground";  // default: background
  outputFormat?: "summary" | "json" | "full";

  // 의존성 (신규)
  dependencies?: string[];      // 선행 완료 필요 Task ID

  // 품질 기준 (신규)
  acceptanceCriteria?: string[];
  constraints?: string[];
}
```

**응답:**

```typescript
interface DispatchResponse {
  taskId: string;               // 예: "T001"
  agent: AgentType;
  status: "dispatched" | "queued" | "blocked";
  role: string;
  permissions: string[];
  worktree?: string;            // 예: "../avengers-T001"
  branchName?: string;          // 예: "feature/T001-ironman"
  priority: string;
  mode: "background" | "foreground";
  estimatedDuration: string;    // 예: "~15 minutes"
  agentPrompt: string;          // 생성된 에이전트 프롬프트
  contextSummary: {
    filesCount: number;
    snippetsCount: number;
    referencesCount: number;
  };
}
```

#### avengers_collect_results

여러 백그라운드 작업의 결과를 수집하고 집계합니다.

```typescript
interface CollectResultsParams {
  taskIds: string[];            // 수집할 Task ID 배열
  timeout?: number;             // 대기 시간 (ms, default: 60000)
  format?: "summary" | "detailed" | "json";
}
```

**응답:**

```typescript
interface AggregatedResults {
  tasks: TaskResult[];
  allSucceeded: boolean;
  failedTasks: string[];
  totalFilesChanged: number;
  totalTestsPassed: number;
  totalTestsFailed: number;
  conflicts: FileConflict[];    // 여러 에이전트가 같은 파일 수정 시
  summary: string;              // 실행 요약 마크다운
}

interface FileConflict {
  file: string;
  agents: string[];             // 해당 파일을 수정한 에이전트들
}
```

#### avengers_get_agent_status

에이전트의 현재 상태를 조회합니다.

```typescript
interface GetAgentStatusParams {
  agent?: string;               // 특정 에이전트 (없으면 전체)
}
```

#### avengers_assign_task

새 작업을 생성하고 에이전트에 할당합니다.

```typescript
interface AssignTaskParams {
  title: string;
  description?: string;
  assignee?: string;            // 에이전트 이름
  priority?: "critical" | "high" | "medium" | "low";
  dependencies?: string[];      // 선행 Task ID
}
```

#### avengers_merge_worktree

완료된 worktree를 메인 브랜치에 병합합니다.

```typescript
interface MergeWorktreeParams {
  taskId: string;
  commitMessage?: string;
  createPR?: boolean;           // PR 생성 여부
}
```

#### avengers_save_state

현재 세션 상태를 저장합니다.

```typescript
interface SaveStateParams {
  key: string;                  // 저장 키
  includeAgents?: boolean;
  includeTasks?: boolean;
  metadata?: Record<string, unknown>;
}
```

#### avengers_restore_state

저장된 세션 상태를 복구합니다.

```typescript
interface RestoreStateParams {
  key: string;
}
```

#### avengers_summarize_session

현재 세션의 요약을 생성합니다.

```typescript
interface SummarizeSessionParams {
  format?: "markdown" | "json";
  includeMetrics?: boolean;
}
```

### avengers-skills (3개 도구)

#### avengers_skill_tdd

TDD 워크플로우를 관리합니다.

```typescript
interface TDDParams {
  phase: "start" | "red" | "green" | "refactor" | "complete";
  feature: string;
  testFile?: string;
  testResult?: "pass" | "fail";
}
```

#### avengers_skill_brainstorm

구조화된 브레인스토밍을 진행합니다.

```typescript
interface BrainstormParams {
  phase: "start" | "understand" | "explore" | "design" | "finalize";
  topic: string;
  context?: string;
  options?: string[];
}
```

#### avengers_skill_code_review

체계적인 코드 리뷰를 수행합니다.

```typescript
interface CodeReviewParams {
  phase: "request" | "review" | "respond" | "approve";
  files?: string[];
  taskId?: string;
  findings?: ReviewFinding[];
}
```

---

## Parallel Agent System

### 핵심 개념

Background Task 기반 병렬 실행 시스템으로, 다음을 제공합니다:

1. **컨텍스트 격리**: 각 에이전트가 독립된 컨텍스트 윈도우에서 실행
2. **명시적 컨텍스트**: 필요한 정보만 선택적으로 전달
3. **결과 집계**: 여러 에이전트의 결과를 자동 수집 및 충돌 감지

### 사용 패턴

#### Pattern 1: 독립 작업 병렬화

```typescript
// 1. 두 에이전트 동시 디스패치
const task1 = avengers_dispatch_agent({
  agent: "ironman",
  task: "프론트엔드 구현",
  worktree: true,
  mode: "background"
});

const task2 = avengers_dispatch_agent({
  agent: "natasha",
  task: "API 구현",
  worktree: true,
  mode: "background"
});

// 2. 결과 수집 (자동 대기)
const results = avengers_collect_results({
  taskIds: [task1.taskId, task2.taskId],
  format: "summary"
});
```

#### Pattern 2: 의존성 기반 순차 실행

```typescript
// API 먼저 구현
const apiTask = avengers_dispatch_agent({
  agent: "natasha",
  task: "API 구현"
});

// API 완료 후 프론트엔드 (자동 대기)
avengers_dispatch_agent({
  agent: "ironman",
  task: "프론트엔드 연동",
  dependencies: [apiTask.taskId]
});
```

#### Pattern 3: 명시적 컨텍스트 전달

```typescript
avengers_dispatch_agent({
  agent: "groot",
  task: "인증 모듈 테스트 작성",
  context: {
    files: ["src/auth/service.ts", "src/auth/types.ts"],
    snippets: [
      { path: "src/config.ts", lines: [1, 20] }
    ],
    references: [
      "https://jestjs.io/docs/mock-functions"
    ]
  },
  acceptanceCriteria: [
    "커버리지 80% 이상",
    "에지 케이스 포함"
  ]
});
```

### 충돌 감지

`avengers_collect_results`는 자동으로 파일 충돌을 감지합니다:

```json
{
  "conflicts": [
    {
      "file": "src/shared/types.ts",
      "agents": ["ironman", "natasha"]
    }
  ]
}
```

충돌 발생 시 수동 머지가 필요합니다.

---

## Efficiency System

### 상태 관리

세션 중단/재개를 위한 체크포인트 시스템:

```typescript
// 작업 중단 전
avengers_save_state({
  key: "feature-auth-v1",
  includeAgents: true,
  includeTasks: true,
  metadata: {
    milestone: "M4",
    progress: "50%"
  }
});

// 다음 세션에서
avengers_restore_state({
  key: "feature-auth-v1"
});
```

### 세션 요약

```typescript
const summary = avengers_summarize_session({
  format: "markdown",
  includeMetrics: true
});

// 출력 예시:
// ## 세션 요약
// - 완료된 작업: 5개
// - 진행 중: 2개
// - 변경된 파일: 15개
// - 테스트 통과율: 95%
```

---

## Evaluation Framework

### 평가 구조

```yaml
평가(Eval):
  ├── 작업(Task): 정의된 입력과 성공 기준
  ├── 시도(Trial): 각 실행 (비결정성 대비)
  ├── 그레이더(Grader): 채점 로직
  │   ├── 코드 기반: 빠름, 객관적
  │   ├── 모델 기반: 유연함
  │   └── 인간 기반: 황금 표준
  └── 평가 스위트: 작업 모음
```

### 메트릭

- **pass@k**: k번 중 1회 이상 성공 확률 (문제 해결 능력)
- **pass^k**: k번 모두 성공 확률 (일관성)

### 평가 파일 위치

```
tests/evals/
├── agent-coordination/     # 에이전트 협업 평가
├── tool-usage/             # 도구 활용 평가
├── capability/             # 능력 향상 평가
└── regression/             # 회귀 방지 평가
```

---

## Specialized Skills

### Frontend (IronMan)

```
skills/specialized/frontend/SKILL.md
```

- React/Vue 컴포넌트 개발
- CSS/Tailwind 스타일링
- 상태 관리 (Redux, Context)

### Backend (Natasha)

```
skills/specialized/backend/SKILL.md
```

- REST/GraphQL API 설계
- 데이터베이스 스키마
- 인증/권한 관리

### Systematic Debugging (Jarvis)

```
skills/specialized/systematic-debugging/SKILL.md
```

- 체계적 디버깅 방법론
- 로그 분석
- 성능 프로파일링

### CI/CD (Vision)

```
skills/specialized/cicd/SKILL.md
```

- GitHub Actions 워크플로우
- 배포 자동화
- 테스트 파이프라인

---

## Agent Templates

각 에이전트는 고유한 시스템 프롬프트 템플릿을 가집니다:

```typescript
// mcp-servers/avengers-core/src/agent-templates.ts

const agentRoles = {
  captain: "Orchestrator - 작업 분석, 할당, 조율",
  ironman: "Fullstack Developer - UI/API 구현",
  natasha: "Backend Specialist - 서버 로직, DB",
  groot: "Test Expert - 테스트 작성, 품질 검증",
  jarvis: "Researcher - 기술 조사, 문서 검색",
  "dr-strange": "Architect - 요구사항 분석, 설계",
  vision: "Documentation - 문서 작성, API 명세"
};

const agentPermissions = {
  captain: ["read"],
  ironman: ["read", "write", "edit", "bash"],
  natasha: ["read", "write", "edit", "bash"],
  groot: ["read", "write-test-only"],
  jarvis: ["read", "web-search"],
  "dr-strange": ["read"],
  vision: ["read", "write-docs-only"]
};
```

### 프롬프트 구조

```typescript
function assembleAgentPrompt(agent: AgentType, context: TaskContext): string {
  return `
# ${agent.toUpperCase()} Agent

## Role
${agentRoles[agent]}

## Permissions
${agentPermissions[agent].join(", ")}

## Task
${context.task}

## Context
${formatContext(context)}

## Acceptance Criteria
${context.acceptanceCriteria?.join("\n") || "None specified"}

## Constraints
${context.constraints?.join("\n") || "None specified"}
  `;
}
```

---

## Testing

```bash
# 전체 테스트 실행
cd mcp-servers/avengers-core
npm test

# 결과: 39개 테스트 (8 효율성 + 31 병렬)
```

### 테스트 구조

```
mcp-servers/avengers-core/tests/
├── efficiency.test.ts      # 상태 관리 테스트 (8개)
└── parallel.test.ts        # 병렬 에이전트 테스트 (31개)
    ├── dispatch-agent      # 11개
    ├── collect-results     # 10개
    └── agent-templates     # 10개
```

---

## Related Documents

- [README.md](../README.md) - 프로젝트 개요
- [CLAUDE.md](../CLAUDE.md) - Claude Code 통합 가이드
- [skills/parallel-agents/SKILL.md](../skills/parallel-agents/SKILL.md) - 병렬 에이전트 상세 가이드
- [.claude/designs/parallel-patterns.md](../.claude/designs/parallel-patterns.md) - 아키텍처 설계
