# Parallel Agents Skill

Background Task 기반 병렬 에이전트 실행을 가이드합니다.

## Quick Start

```typescript
// 병렬 작업 dispatch
avengers_dispatch_agent({
  agent: "ironman",
  task: "프론트엔드 컴포넌트 구현",
  worktree: true
})

avengers_dispatch_agent({
  agent: "natasha",
  task: "API 엔드포인트 구현",
  worktree: true
})

// 나중에 결과 확인
avengers_get_agent_status({})
```

---

## Overview

### Background Task 기반 병렬 실행이란?

Background Task 기반 병렬 실행은 여러 에이전트를 동시에 실행하여 독립적인 작업을 병렬로 처리하는 패턴입니다. 각 에이전트는 별도의 컨텍스트 윈도우에서 작업하여 상호 오염을 방지합니다.

### 장점

| 장점 | 설명 |
|------|------|
| **컨텍스트 분리** | 각 에이전트가 별도의 컨텍스트 윈도우를 사용하여 정보 오염 최소화 |
| **병렬 처리** | 독립적인 작업을 동시에 수행하여 시간 절약 |
| **집중력 향상** | 각 에이전트가 좁은 범위에만 집중 |
| **간섭 방지** | Worktree 분리로 파일 충돌 방지 |
| **확장성** | 작업 수에 따라 에이전트 추가 가능 |

### 언제 사용하는가?

**병렬 에이전트 사용:**
- 3개 이상의 독립적인 테스트 파일 실패
- 서로 다른 서브시스템에서 독립적인 버그 발생
- 작업 간 상태 공유가 필요 없는 경우
- 에이전트가 서로 간섭하지 않는 경우

**순차 실행 사용:**
- 작업 간 의존성이 있는 경우
- 전체 시스템 상태 이해가 필요한 경우
- 에이전트가 같은 파일을 수정해야 하는 경우
- 한 작업의 결과가 다른 작업에 영향을 주는 경우

```
독립적인 작업?
├── Yes → 상태 공유 필요?
│         ├── No → 병렬 에이전트 ✓
│         └── Yes → 순차 실행
└── No → 순차 실행
```

---

## Patterns

### 1. Context Isolation Pattern (컨텍스트 격리 패턴)

각 에이전트에게 필요한 컨텍스트만 명시적으로 전달합니다.

```typescript
// 좋은 예: 명시적 컨텍스트 전달
avengers_dispatch_agent({
  agent: "natasha",
  task: `
    Fix 3 failing tests in src/agents/agent-tool-abort.test.ts:

    1. "should abort tool with partial output" - expects 'interrupted at' in message
    2. "should handle mixed completed/aborted tools" - fast tool aborted instead of completed
    3. "should properly track pendingToolCount" - expects 3 results but gets 0

    These are timing/race condition issues. Replace arbitrary timeouts with event-based waiting.

    Return: Summary of root cause and what you fixed.
  `,
  worktree: true
})

// 나쁜 예: 전체 파일 내용 전달
avengers_dispatch_agent({
  agent: "natasha",
  task: `Fix this file: ${entireFileContent}`,  // 컨텍스트 낭비
  worktree: true
})
```

**컨텍스트 전달 체크리스트:**

- [ ] 작업 범위가 명확히 정의되어 있는가?
- [ ] 필요한 에러 메시지와 테스트 이름이 포함되어 있는가?
- [ ] 제약 조건이 명시되어 있는가?
- [ ] 기대하는 출력 형식이 정의되어 있는가?

### 2. Result Collection Pattern (결과 수집 패턴)

에이전트 결과를 선택적으로 수집하고 요약합니다.

```typescript
// 1. 에이전트 dispatch
avengers_dispatch_agent({ agent: "ironman", task: "Feature A", worktree: true })
avengers_dispatch_agent({ agent: "natasha", task: "Feature B", worktree: true })
avengers_dispatch_agent({ agent: "groot", task: "Write tests", worktree: true })

// 2. 상태 확인
const status = avengers_get_agent_status({})
// → { ironman: "working", natasha: "completed", groot: "working" }

// 3. 완료된 에이전트 결과 확인
const natashaResult = avengers_get_agent_status({ agent: "natasha" })
// → { status: "completed", result: "Fixed API race condition by..." }

// 4. 결과 요약 후 병합
// 전체 결과가 아닌 요약만 메인 컨텍스트로 가져오기
```

**결과 수집 전략:**

| 전략 | 사용 시점 | 설명 |
|------|----------|------|
| 즉시 수집 | 다음 작업이 결과에 의존 | 완료 즉시 결과 확인 |
| 배치 수집 | 모든 작업 완료 후 통합 | 전체 완료 대기 후 일괄 처리 |
| 선택적 수집 | 특정 결과만 필요 | 필요한 에이전트 결과만 가져오기 |

### 3. Worktree Isolation Pattern (Worktree 격리 패턴)

파일 변경이 필요한 작업은 반드시 Worktree로 격리합니다.

```
Project/
├── (main 브랜치 - 안정적인 메인 코드)
└── worktree/
    ├── ironman-T001/     # IronMan 작업 공간
    │   └── (Feature A 변경사항)
    ├── natasha-T002/     # Natasha 작업 공간
    │   └── (Feature B 변경사항)
    └── groot-T003/       # Groot 작업 공간
        └── (테스트 추가)
```

```typescript
// Worktree 격리 사용
avengers_dispatch_agent({
  agent: "ironman",
  task: "Implement login component",
  worktree: true  // 반드시 true
})

// 작업 완료 후 병합
avengers_merge_worktree({
  taskId: "T001",
  createPR: true,
  commitMessage: "feat: Add login component"
})
```

**Worktree 사용 규칙:**

1. 파일을 수정하는 모든 에이전트는 `worktree: true` 사용
2. 읽기 전용 작업(조사, 분석)만 `worktree: false` 허용
3. 같은 파일을 수정하는 에이전트는 병렬 실행 금지
4. 병합 전 충돌 확인 필수

### 4. Error Handling Pattern (에러 처리 패턴)

에이전트 실패 시 복구 전략입니다.

```typescript
// 1. 에이전트 dispatch
avengers_dispatch_agent({
  agent: "natasha",
  task: "API 구현",
  worktree: true
})

// 2. 상태 확인
const status = avengers_get_agent_status({ agent: "natasha" })

if (status.status === "failed") {
  // 3a. 실패 원인 분석 후 재시도
  avengers_dispatch_agent({
    agent: "natasha",
    task: `
      이전 작업이 실패했습니다.
      실패 원인: ${status.error}

      다음을 수정하여 다시 시도하세요:
      1. [구체적인 수정 지침]
    `,
    worktree: true
  })
}

if (status.status === "blocked") {
  // 3b. 블로킹 해결 후 계속
  // 의존성 작업 먼저 완료
  // 또는 다른 에이전트로 블로킹 해결
}
```

**에러 복구 체크리스트:**

- [ ] 실패 원인이 명확히 파악되었는가?
- [ ] Worktree 상태가 정리되었는가?
- [ ] 다른 에이전트에 영향이 없는가?
- [ ] 재시도 시 추가 컨텍스트가 제공되었는가?

---

## Best Practices

### 에이전트에게 전달해야 할 것

**필수 항목:**
```markdown
1. 명확한 작업 범위
   - 어떤 파일/테스트/모듈을 다루는가
   - 무엇을 달성해야 하는가

2. 문제 컨텍스트
   - 에러 메시지 (전체가 아닌 핵심만)
   - 실패한 테스트 이름
   - 관련 코드 위치 (파일 경로)

3. 제약 조건
   - 수정하면 안 되는 것
   - 따라야 하는 규칙
   - 시간/리소스 제한

4. 기대 출력
   - 어떤 형식으로 결과를 반환할지
   - 요약 vs 상세
```

**좋은 예시:**
```typescript
avengers_dispatch_agent({
  agent: "natasha",
  task: `
    Fix the 3 failing tests in src/auth/jwt.test.ts:

    Failures:
    1. "should validate expired tokens" - expects TokenExpiredError
    2. "should reject malformed tokens" - getting undefined instead of error
    3. "should refresh tokens correctly" - timing issue

    Context: Using jose library for JWT handling.

    Constraints:
    - Do NOT change the public API
    - Keep backward compatibility

    Return: Brief summary of root cause and changes made.
  `,
  worktree: true
})
```

### 에이전트에게 전달하지 말아야 할 것

**피해야 할 것:**

| 피할 것 | 이유 | 대안 |
|--------|------|------|
| 전체 파일 내용 | 컨텍스트 낭비 | 관련 라인 번호만 제공 |
| 다른 작업 결과 | 컨텍스트 오염 | 필요한 요약만 전달 |
| 불필요한 히스토리 | 혼란 유발 | 현재 상태만 전달 |
| 모호한 지시 | 잘못된 방향 | 구체적인 목표 제시 |

**나쁜 예시:**
```typescript
// 너무 모호함
avengers_dispatch_agent({
  agent: "natasha",
  task: "Fix the bugs",
  worktree: true
})

// 너무 많은 정보
avengers_dispatch_agent({
  agent: "natasha",
  task: `
    전체 프로젝트 히스토리: ${longHistory}
    모든 파일 목록: ${allFiles}
    이전 세션의 모든 대화: ${previousConversation}
    그리고 이 버그 좀 고쳐줘.
  `,
  worktree: true
})
```

### 결과 요약 전략

결과를 메인 컨텍스트로 가져오기 전에 요약합니다.

```typescript
// 에이전트가 반환한 상세 결과
const rawResult = `
  Analyzed 50 files, found 3 issues:
  1. src/auth/jwt.ts:45 - Race condition in token refresh
     - Previous code waited 0ms, now waits for promise
     - Added mutex for concurrent refresh prevention
  2. src/auth/jwt.ts:78 - Error handling missing
     - Added try-catch for jose.jwtVerify
  3. src/auth/types.ts:12 - Type mismatch
     - Changed TokenPayload.exp from string to number

  All 3 tests now pass. Committed as abc1234.
`;

// 메인 컨텍스트에 저장할 요약
const summary = `
  JWT 인증 수정 완료:
  - Race condition 해결 (mutex 추가)
  - 에러 처리 추가
  - 타입 수정
  Commit: abc1234
`;
```

---

## Anti-patterns

### 1. Context Pollution (컨텍스트 오염)

**문제:** 모든 에이전트 결과를 메인 컨텍스트에 그대로 저장

```typescript
// Anti-pattern
const results = [];
for (const agent of agents) {
  const result = await getFullResult(agent);  // 전체 결과
  results.push(result);  // 컨텍스트에 누적
}
analyzeAllResults(results);  // 거대한 컨텍스트
```

**해결:** 결과를 요약하여 선택적으로 수집

```typescript
// Best practice
const summaries = [];
for (const agent of agents) {
  const summary = await getSummary(agent);  // 요약만
  summaries.push(summary);
}
integrateSummaries(summaries);  // 작은 컨텍스트
```

### 2. Shared State Conflicts (공유 상태 충돌)

**문제:** 여러 에이전트가 같은 파일을 동시에 수정

```typescript
// Anti-pattern
avengers_dispatch_agent({
  agent: "ironman",
  task: "Update src/config.ts",  // 같은 파일
  worktree: true
})
avengers_dispatch_agent({
  agent: "natasha",
  task: "Modify src/config.ts",  // 같은 파일
  worktree: true
})
// 병합 시 충돌 발생!
```

**해결:** 공유 리소스가 있는 작업은 순차 실행

```typescript
// Best practice
// 1. 먼저 config 변경
avengers_dispatch_agent({
  agent: "ironman",
  task: "Update src/config.ts",
  worktree: true
})
// 2. 완료 후 병합
avengers_merge_worktree({ taskId: "T001" })
// 3. 그 다음 의존 작업
avengers_dispatch_agent({
  agent: "natasha",
  task: "Use updated config in API",
  worktree: true
})
```

### 3. Missing Context (컨텍스트 누락)

**문제:** 에이전트에게 충분한 정보를 제공하지 않음

```typescript
// Anti-pattern
avengers_dispatch_agent({
  agent: "natasha",
  task: "Fix the race condition",  // 어디? 무엇?
  worktree: true
})
```

**해결:** 구체적인 컨텍스트 제공

```typescript
// Best practice
avengers_dispatch_agent({
  agent: "natasha",
  task: `
    Fix race condition in src/auth/jwt.ts:

    Issue: Line 45, token refresh can be called concurrently
    Symptom: Intermittent 401 errors during high load
    Test: src/auth/jwt.test.ts - "should handle concurrent refresh"

    Suggested approach: Add mutex or queue for refresh operations
  `,
  worktree: true
})
```

### 4. Premature Integration (조기 통합)

**문제:** 검증 없이 에이전트 결과를 병합

```typescript
// Anti-pattern
avengers_dispatch_agent({ agent: "ironman", task: "...", worktree: true })
// 바로 병합
avengers_merge_worktree({ taskId: "T001" })  // 테스트 안 함!
```

**해결:** 병합 전 검증 단계 수행

```typescript
// Best practice
// 1. 작업 완료 확인
const status = avengers_get_agent_status({ agent: "ironman" })

if (status.status === "completed") {
  // 2. 결과 검토
  // 3. 테스트 실행 확인
  // 4. 충돌 확인
  // 5. 병합
  avengers_merge_worktree({
    taskId: "T001",
    createPR: true  // PR로 추가 검토
  })
}
```

### 5. Agent Overload (에이전트 과부하)

**문제:** 하나의 에이전트에게 너무 많은 작업 할당

```typescript
// Anti-pattern
avengers_dispatch_agent({
  agent: "ironman",
  task: `
    1. Implement login
    2. Implement registration
    3. Implement password reset
    4. Add OAuth integration
    5. Write all tests
    6. Update documentation
  `,
  worktree: true
})
```

**해결:** 작업을 작은 단위로 분할

```typescript
// Best practice
avengers_assign_task({ title: "Login", assignee: "ironman" })
avengers_assign_task({ title: "Registration", assignee: "natasha" })
avengers_assign_task({ title: "Password reset", assignee: "ironman" })
// 각각 독립적으로 dispatch
```

---

## Rules

### 필수 규칙

1. **Worktree 필수**: 파일을 수정하는 에이전트는 반드시 `worktree: true` 사용
2. **컨텍스트 최소화**: 에이전트에게 필요한 정보만 전달
3. **결과 요약**: 전체 결과가 아닌 요약만 메인 컨텍스트로 가져오기
4. **충돌 방지**: 같은 파일을 수정하는 에이전트는 병렬 실행 금지
5. **검증 후 병합**: 테스트 통과 확인 후에만 병합

### 권장 규칙

6. **명확한 범위**: 각 에이전트에게 좁고 명확한 작업 범위 할당
7. **출력 형식 지정**: 에이전트에게 기대하는 결과 형식 명시
8. **에러 처리**: 실패 시 복구 전략 준비
9. **상태 모니터링**: 주기적으로 에이전트 상태 확인
10. **점진적 통합**: 완료된 작업부터 순차적으로 병합

### 금지 사항

11. **전체 파일 전달 금지**: 파일 내용 대신 경로와 라인 번호 사용
12. **무한 대기 금지**: 타임아웃 설정
13. **맹목적 병합 금지**: 충돌 확인 없이 병합하지 않기
14. **컨텍스트 누적 금지**: 불필요한 히스토리 전달하지 않기

---

## Integration

### 관련 스킬

| 스킬 | 설명 | 사용 시점 |
|------|------|----------|
| `skills/tdd` | TDD 워크플로우 | 각 에이전트 작업 내 |
| `skills/code-review` | 코드 리뷰 | 병합 전 검증 |
| `skills/efficiency` | 토큰 효율성 | 컨텍스트 관리 |
| `skills/brainstorming` | 브레인스토밍 | 작업 분배 전 기획 |

### 사용 예시 워크플로우

```typescript
// 1. 브레인스토밍으로 작업 분석
avengers_skill_brainstorm({ phase: "start", topic: "multi-feature" })

// 2. 작업 분배
avengers_assign_task({ title: "Feature A", assignee: "ironman" })
avengers_assign_task({ title: "Feature B", assignee: "natasha" })
avengers_assign_task({ title: "Tests", assignee: "groot" })

// 3. 병렬 dispatch
avengers_dispatch_agent({ agent: "ironman", task: "...", worktree: true })
avengers_dispatch_agent({ agent: "natasha", task: "...", worktree: true })
avengers_dispatch_agent({ agent: "groot", task: "...", worktree: true })

// 4. 상태 모니터링
avengers_get_agent_status({})

// 5. 코드 리뷰 후 병합
avengers_skill_code_review({ phase: "request", taskId: "T001" })
avengers_merge_worktree({ taskId: "T001", createPR: true })
```

---

## Reference

- `CLAUDE.md` - 프로젝트 개발 절차
- `reference/docs/04_advanced_tool_use.md` - Programmatic Tool Calling
- `reference/superpowers/skills/dispatching-parallel-agents/SKILL.md` - 참조 구현
