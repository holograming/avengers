# Workflows

Avengers 유연한 워크플로우 가이드입니다.

## 핵심 원칙

**모든 요청이 코딩을 필요로 하지 않습니다.**

Captain이 요청 유형을 판단하여 필요한 에이전트만 호출합니다.

## Workflow Selection

```
┌─ Research Only (예: "Toss Place가 뭐야?")
│   └→ Jarvis → Captain → 응답 완료
│
├─ Planning Only (예: "X 어떻게 할지 계획 세워")
│   └→ Jarvis → Dr.Strange → Captain → 응답 완료
│
├─ Quick Fix (예: "이 버그 고쳐줘")
│   └→ IronMan/Natasha → Groot → Captain → 완료
│
├─ Documentation (예: "API 문서 작성해줘")
│   └→ Jarvis → Vision → Captain → 완료
│
└─ Full Development (예: "인증 시스템 구현해줘")
    └→ 전체 Phase 1-7 실행
```

## Phase 0: 요청 분석 (Captain)

모든 미션의 첫 단계로 **반드시** `avengers_analyze_request` 호출:

```typescript
avengers_analyze_request({
  request: "Toss Place 서비스를 만들고 싶어",
  forceResearch: true
})

// 반환 예시:
{
  type: "development",
  intent: "Toss Place 유사 서비스 클론 개발",
  requiredAgents: ["jarvis", "dr-strange", "ironman", "natasha", "groot", "vision"],
  workflow: "full-development",
  firstStep: "jarvis-research",
  confidenceScore: 85,
  reasoning: "서비스 개발 요청으로 판단. 먼저 Toss Place 서비스 리서치 필요."
}
```

## Full Development Workflow (Phase 1-7)

### Phase 1: 정보 수집 (Jarvis)

```typescript
avengers_dispatch_agent({
  agent: "jarvis",
  task: "Toss Place 서비스 리서치",
  mode: "foreground"
})
```

- 용어/서비스 웹 검색
- 기술 스택 분석
- 유사 서비스 비교
- 요구사항 추론

### Phase 2: 요구사항 분석 (Captain + Dr.Strange)

- 리서치 결과 기반 분석
- **부족한 정보만** 사용자에게 질문
- 스코프 확정

### Phase 3: 전략 수립 (Dr.Strange)

```typescript
avengers_skill_brainstorm({
  phase: "start",
  topic: "인증 시스템 아키텍처"
})

// understand → explore → design → finalize
```

### Phase 4: 작업 분배 (Captain)

```typescript
avengers_assign_task({
  title: "백엔드 API 구현",
  assignee: "natasha",
  dependencies: []
})

avengers_assign_task({
  title: "프론트엔드 컴포넌트",
  assignee: "ironman",
  dependencies: ["T001"]  // API 완료 후
})
```

### Phase 5: 병렬 실행 (IronMan + Natasha)

```typescript
// 병렬 실행
avengers_dispatch_agent({
  agent: "natasha",
  task: "API 구현",
  worktree: true,
  mode: "background"
})

avengers_dispatch_agent({
  agent: "ironman",
  task: "프론트엔드 구현",
  worktree: true,
  mode: "background"
})

// 결과 공유
avengers_update_shared_context({
  taskId: "T001",
  agent: "natasha",
  files: ["src/api/auth.ts"],
  summary: "JWT 기반 인증 API 구현 완료"
})
```

### Phase 6: 검증 (Groot)

```typescript
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
```

**Infinity War 원칙**: 검증 실패 시 Phase 5로 루프백

```
Phase 5 → Phase 6 (실패) → Phase 5 → Phase 6 (실패) → ...
```

끝날 때까지 끝나지 않습니다.

### Phase 7: 마무리 (Vision + Captain)

- Vision: 문서화
- Captain: 최종 검증 후 완료 선언

```typescript
avengers_merge_worktree({
  taskId: "T001",
  createPR: true
})
```

## Quick Workflows

### Research Only

```typescript
// 1. 분석
avengers_analyze_request({ request: "React 19 새 기능이 뭐야?" })
// → workflow: "research-only"

// 2. 리서치
avengers_dispatch_agent({
  agent: "jarvis",
  task: "React 19 새 기능 조사",
  mode: "foreground"
})

// 3. 완료 (자동)
```

### Quick Fix

```typescript
// 1. 분석
avengers_analyze_request({ request: "로그인 버그 고쳐줘" })
// → workflow: "quick-fix"

// 2. 수정
avengers_dispatch_agent({
  agent: "ironman",
  task: "로그인 버그 수정",
  worktree: false
})

// 3. 검증
avengers_validate_completion({ taskId: "T001", ... })
```

## Agent Communication

### Handoff Pattern

```typescript
// Natasha → IronMan 작업 인계
avengers_agent_communicate({
  from: "natasha",
  to: "ironman",
  type: "handoff",
  payload: {
    taskId: "T001",
    content: "API 구현 완료. 프론트엔드 연동 가능",
    artifacts: ["src/api/auth.ts", "src/types/auth.ts"]
  }
})
```

### Broadcast Pattern

```typescript
// Captain → All 상태 알림
avengers_broadcast({
  from: "captain",
  type: "notify",
  payload: {
    content: "Phase 5 완료. Phase 6 시작",
    priority: "high"
  }
})
```

### Context Sharing

```typescript
// 공유 컨텍스트 업데이트
avengers_update_shared_context({
  taskId: "T001",
  agent: "natasha",
  files: ["src/api/auth.ts"],
  summary: "JWT 인증 구현"
})

// 다른 에이전트가 조회
avengers_get_shared_context({
  taskId: "T001",
  filter: { agents: ["natasha"] }
})
```

## Best Practices

1. **항상 Phase 0 먼저**: `avengers_analyze_request`로 시작
2. **Jarvis 활용**: 모호한 요청은 리서치 먼저
3. **작은 단위 검증**: 큰 작업은 중간 검증 포함
4. **컨텍스트 공유**: `update_shared_context`로 결과 공유
5. **Infinity War**: 실패해도 포기하지 않기

## Related Documents

- [AGENTS.md](./AGENTS.md) - 에이전트 상세
- [FEATURES.md](./FEATURES.md) - API 레퍼런스
- [EXAMPLES.md](./EXAMPLES.md) - 사용 예시
