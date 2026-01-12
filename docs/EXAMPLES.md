# Usage Examples

Avengers 사용 예시 모음입니다.

## Basic Examples

### 에이전트 팀 소집

```bash
claude> /assemble
```

### 미션 시작

```bash
# Research Only
claude> /mission Toss Place가 뭐야?

# Full Development
claude> /mission 사용자 인증 시스템 구현해줘
```

### 미션 결과 확인

```bash
claude> /debrief
```

## Development Examples

### 예제 1: 병렬 작업 실행

두 에이전트에게 동시에 독립적인 작업을 할당합니다.

```typescript
// 1. 두 에이전트 동시 디스패치
avengers_dispatch_agent({
  agent: "ironman",
  task: "프론트엔드 구현",
  worktree: true,
  context: {
    files: ["src/components/Login.tsx"],
    references: ["https://react.dev"]
  }
})

avengers_dispatch_agent({
  agent: "natasha",
  task: "API 구현",
  worktree: true,
  context: {
    files: ["src/api/auth.ts"]
  }
})

// 2. 결과 수집
avengers_collect_results({
  taskIds: ["T001", "T002"],
  format: "summary"
})
```

### 예제 2: 의존성 기반 순차 실행

API가 먼저 구현되어야 프론트엔드 연동이 가능한 경우:

```typescript
// 1. 의존성 정의
avengers_assign_task({
  title: "API 구현",
  assignee: "natasha"
})  // T001

avengers_assign_task({
  title: "프론트엔드 연동",
  assignee: "ironman",
  dependencies: ["T001"]  // T001 완료 후 시작
})  // T002

// 2. T001 먼저 진행
avengers_dispatch_agent({
  agent: "natasha",
  task: "API 구현",
  worktree: true
})

// 3. T001 완료 & 병합 후 T002 진행
avengers_merge_worktree({
  taskId: "T001"
})

avengers_dispatch_agent({
  agent: "ironman",
  task: "프론트엔드 연동",
  worktree: true
})
```

### 예제 3: TDD 워크플로우

```typescript
// RED: 실패하는 테스트 작성
avengers_skill_tdd({
  phase: "red",
  feature: "user-auth",
  testFile: "src/auth/__tests__/auth.test.ts"
})
// → 테스트 코드 작성

// GREEN: 테스트 통과하는 최소 코드
avengers_skill_tdd({
  phase: "green",
  feature: "user-auth",
  testResult: "fail"
})
// → 구현 코드 작성

// REFACTOR: 코드 개선
avengers_skill_tdd({
  phase: "refactor",
  feature: "user-auth",
  testResult: "pass"
})
// → 리팩토링

// COMPLETE
avengers_skill_tdd({
  phase: "complete",
  feature: "user-auth"
})
```

### 예제 4: 코드 리뷰

```typescript
// 1. 리뷰 요청 (개발자)
avengers_skill_code_review({
  phase: "request",
  files: ["src/auth/api.ts", "src/auth/types.ts"],
  taskId: "T001"
})

// 2. 리뷰 수행 (Groot)
avengers_skill_code_review({
  phase: "review",
  files: ["src/auth/api.ts", "src/auth/types.ts"]
})

// 3. 피드백 대응
avengers_skill_code_review({
  phase: "respond",
  findings: [
    {
      file: "src/auth/api.ts",
      line: 42,
      severity: "major",
      issue: "SQL Injection 취약점",
      suggestion: "Parameterized query 사용"
    }
  ]
})

// 4. 승인
avengers_skill_code_review({
  phase: "approve",
  taskId: "T001"
})
```

## State Management Examples

### 상태 저장 및 복구

```typescript
// 작업 중단 전 상태 저장
avengers_save_state({
  filename: "feature-auth",
  reason: "오늘 작업 종료"
})

// 다음 세션에서 복구
avengers_restore_state({
  filename: "feature-auth"
})
```

### 세션 요약 생성

```typescript
// 현재 세션 요약
avengers_summarize_session({
  tasks: [
    { title: "API 구현", status: "completed", outcome: "JWT 인증 완료" },
    { title: "프론트엔드", status: "partial", outcome: "50% 진행" }
  ],
  decisions: [
    { topic: "인증 방식", decision: "JWT", rationale: "확장성 고려" }
  ],
  nextSteps: [
    { task: "프론트엔드 완료", priority: "high", assignee: "ironman" }
  ]
})
```

## M5 Workflow Examples

### 요청 분석

```typescript
// Captain이 요청 유형 판단
avengers_analyze_request({
  request: "Toss Place 서비스를 만들고 싶어",
  forceResearch: true
})

// 반환:
{
  type: "development",
  workflow: "full-development",
  requiredAgents: ["jarvis", "dr-strange", "ironman", "natasha", "groot", "vision"],
  firstStep: "jarvis-research"
}
```

### 완료 검증

```typescript
// Infinity War: 검증 통과 전까지 완료 불가
avengers_validate_completion({
  taskId: "T001",
  testResults: {
    unit: { passed: 15, failed: 0, skipped: 0 },
    integration: { passed: 5, failed: 0, skipped: 0 },
    e2e: { passed: 3, failed: 0, skipped: 0 },
    coverage: 85
  },
  strictness: "moderate"
})

// 결과:
{
  complete: true,
  score: 95,
  canMerge: true,
  blockers: [],
  warnings: [],
  recommendations: ["문서화 추가 권장"]
}
```

### 에이전트 간 소통

```typescript
// Natasha → IronMan 결과 공유
avengers_agent_communicate({
  from: "natasha",
  to: "ironman",
  type: "result",
  payload: {
    taskId: "T001",
    content: "API 엔드포인트 구현 완료",
    artifacts: [
      "src/api/auth.ts",
      "src/types/auth.ts"
    ]
  }
})

// 공유 컨텍스트 업데이트
avengers_update_shared_context({
  taskId: "T001",
  agent: "natasha",
  files: ["src/api/auth.ts"],
  summary: "POST /api/auth/login, /api/auth/register 구현"
})

// IronMan이 컨텍스트 조회
avengers_get_shared_context({
  taskId: "T001"
})
```

## Complete Mission Example

전체 미션 수행 예시:

```typescript
// Phase 0: 요청 분석
const analysis = avengers_analyze_request({
  request: "GitHub OAuth 로그인 구현해줘"
})
// → workflow: "full-development"

// Phase 1: 정보 수집
avengers_dispatch_agent({
  agent: "jarvis",
  task: "GitHub OAuth 스펙 및 Best Practice 조사",
  mode: "foreground"
})

// Phase 2-3: 요구사항 분석 & 전략 수립
avengers_skill_brainstorm({
  phase: "start",
  topic: "GitHub OAuth 구현"
})
// → understand, explore, design, finalize

// Phase 4: 작업 분배
const backendTask = avengers_assign_task({
  title: "OAuth 백엔드 구현",
  assignee: "natasha"
})

const frontendTask = avengers_assign_task({
  title: "OAuth UI 구현",
  assignee: "ironman",
  dependencies: [backendTask.taskId]
})

// Phase 5: 병렬 실행
avengers_dispatch_agent({
  agent: "natasha",
  task: "OAuth 콜백 API 구현",
  worktree: true
})

// Phase 6: 검증
avengers_validate_completion({
  taskId: backendTask.taskId,
  testResults: { ... },
  strictness: "moderate"
})

// Phase 7: 병합
avengers_merge_worktree({
  taskId: backendTask.taskId,
  createPR: true
})
```

## Related Documents

- [WORKFLOWS.md](./WORKFLOWS.md) - 워크플로우 상세
- [FEATURES.md](./FEATURES.md) - API 레퍼런스
- [AGENTS.md](./AGENTS.md) - 에이전트 상세
