# Avengers Project

멀티 에이전트 개발 시스템입니다.
Claude Code와 통합되어 복잡한 개발 작업을 자동화합니다.

---

## 개발 절차

### 1단계: 미션 분석 (Captain)

새로운 기능 요청이 들어오면:

```typescript
// 1. 브레인스토밍으로 요구사항 분석
avengers_skill_brainstorm({ phase: "start", topic: "feature-name" })
avengers_skill_brainstorm({ phase: "understand", topic: "feature-name" })

// 2. 접근 방식 탐색 및 설계
avengers_skill_brainstorm({ phase: "explore", topic: "feature-name" })
avengers_skill_brainstorm({ phase: "design", topic: "feature-name" })
avengers_skill_brainstorm({ phase: "finalize", topic: "feature-name" })

// 3. 작업 분배
avengers_assign_task({
  title: "API 엔드포인트 구현",
  description: "사용자 인증 API 구현",
  assignee: "natasha"
})

avengers_assign_task({
  title: "프론트엔드 컴포넌트",
  description: "로그인 폼 컴포넌트 구현",
  assignee: "ironman"
})
```

### 2단계: 병렬 작업 (Worktree 기반)

**독립적인 작업은 별도의 Worktree에서 병렬로 진행:**

```typescript
// 에이전트 1: Natasha - 백엔드 작업
avengers_dispatch_agent({
  agent: "natasha",
  task: "사용자 인증 API 구현",
  worktree: true  // 새 worktree 생성
})
// → worktree/natasha-T001 디렉토리에서 작업

// 에이전트 2: IronMan - 프론트엔드 작업 (동시 진행)
avengers_dispatch_agent({
  agent: "ironman",
  task: "로그인 폼 컴포넌트 구현",
  worktree: true
})
// → worktree/ironman-T002 디렉토리에서 작업
```

**작업 상태 확인:**
```typescript
avengers_get_agent_status({})
// 또는 특정 에이전트만
avengers_get_agent_status({ agent: "natasha" })
```

### 3단계: TDD 개발 (각 에이전트)

각 에이전트는 TDD 사이클을 따름:

```typescript
// RED: 실패하는 테스트 작성
avengers_skill_tdd({ phase: "red", feature: "user-auth" })
// → 테스트 코드 작성

// GREEN: 테스트 통과하는 최소 코드
avengers_skill_tdd({ phase: "green", feature: "user-auth", testResult: "fail" })
// → 구현 코드 작성

// REFACTOR: 코드 개선
avengers_skill_tdd({ phase: "refactor", feature: "user-auth", testResult: "pass" })
// → 리팩토링

// 반복 또는 완료
avengers_skill_tdd({ phase: "complete", feature: "user-auth" })
```

### 4단계: 코드 리뷰

작업 완료 후 리뷰 요청:

```typescript
// 리뷰 요청 (개발자)
avengers_skill_code_review({
  phase: "request",
  files: ["src/auth/api.ts", "src/auth/types.ts"],
  taskId: "T001"
})

// 리뷰 수행 (Groot 또는 다른 에이전트)
avengers_skill_code_review({
  phase: "review",
  files: ["src/auth/api.ts", "src/auth/types.ts"]
})

// 피드백 대응
avengers_skill_code_review({
  phase: "respond",
  findings: [...]
})

// 승인
avengers_skill_code_review({ phase: "approve", taskId: "T001" })
```

### 5단계: 병합

리뷰 승인 후 Worktree 병합:

```typescript
avengers_merge_worktree({
  worktreePath: "worktree/natasha-T001",
  targetBranch: "main",
  createPR: true,
  prTitle: "feat: 사용자 인증 API 구현",
  prBody: "T001 완료\n- JWT 기반 인증\n- 테스트 커버리지 95%"
})
```

---

## 병렬 작업 가이드

### Worktree 구조

```
Avengers/
├── (main 브랜치 - 메인 작업 공간)
└── worktree/
    ├── ironman-T001/     # IronMan의 독립 작업 공간
    ├── natasha-T002/     # Natasha의 독립 작업 공간
    └── groot-T003/       # Groot의 테스트 작업 공간
```

### 병렬 작업 시나리오

**시나리오 1: 독립적인 기능 2개 동시 개발**

```typescript
// 1. 작업 할당
avengers_assign_task({ title: "Feature A", assignee: "ironman" })  // T001
avengers_assign_task({ title: "Feature B", assignee: "natasha" })  // T002

// 2. 각각 Worktree에서 병렬 작업 시작
avengers_dispatch_agent({ agent: "ironman", task: "Feature A 구현", worktree: true })
avengers_dispatch_agent({ agent: "natasha", task: "Feature B 구현", worktree: true })

// 3. 상태 모니터링
avengers_get_agent_status({})
// → ironman: working (T001), natasha: working (T002)

// 4. 완료된 순서대로 리뷰 & 병합
avengers_merge_worktree({ worktreePath: "worktree/ironman-T001", ... })
avengers_merge_worktree({ worktreePath: "worktree/natasha-T002", ... })
```

**시나리오 2: 의존성 있는 작업**

```typescript
// 1. 의존성 정의하여 작업 생성
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
avengers_dispatch_agent({ agent: "natasha", task: "API 구현", worktree: true })

// 3. T001 완료 & 병합 후 T002 진행
avengers_merge_worktree({ worktreePath: "worktree/natasha-T001", ... })
avengers_dispatch_agent({ agent: "ironman", task: "프론트엔드 연동", worktree: true })
```

**시나리오 3: 테스트 병렬 실행**

```typescript
// Groot가 여러 테스트를 병렬로 실행
avengers_dispatch_agent({
  agent: "groot",
  task: "Unit 테스트 실행",
  worktree: false  // 메인에서 실행
})

avengers_dispatch_agent({
  agent: "groot",
  task: "Integration 테스트 실행",
  worktree: true  // 별도 worktree
})
```

---

## MCP 도구 레퍼런스

### avengers-core

| 도구 | 설명 | 주요 파라미터 |
|------|------|--------------|
| `avengers_dispatch_agent` | 에이전트 호출 | agent, task, worktree |
| `avengers_get_agent_status` | 상태 조회 | agent (optional) |
| `avengers_assign_task` | 작업 생성 | title, assignee, dependencies |
| `avengers_merge_worktree` | Worktree 병합 | worktreePath, targetBranch, createPR |

### avengers-skills

| 도구 | 설명 | 주요 파라미터 |
|------|------|--------------|
| `avengers_skill_tdd` | TDD 워크플로우 | phase, feature, testResult |
| `avengers_skill_brainstorm` | 브레인스토밍 | phase, topic, options |
| `avengers_skill_code_review` | 코드 리뷰 | phase, files, findings |

---

## 에이전트 역할

| 에이전트 | 역할 | 권한 | 주요 업무 |
|---------|------|------|----------|
| Captain | 오케스트레이터 | readonly | 작업 분석, 할당, 조율 |
| IronMan | 풀스택 개발자 | edit, bash, write, read | 프론트엔드/백엔드 구현 |
| Natasha | 백엔드 개발자 | edit, bash, write, read | API, DB, 서버 로직 |
| Groot | 테스트 전문가 | read, write-test-only | 테스트 작성 및 검증 |
| Jarvis | 리서처 | readonly, web-search | 기술 조사, 문서 검색 |
| Dr.Strange | 기획자 | readonly | 요구사항 분석, 설계 |
| Vision | 문서화 담당 | write-docs-only | 문서 작성, API 명세 |

---

## 슬래시 커맨드

| 커맨드 | 설명 |
|--------|------|
| `/mission` | 새 미션 시작 (전체 워크플로우) |
| `/assemble` | 에이전트 팀 소집 |
| `/debrief` | 미션 결과 정리 |

---

## 기본 규칙

1. **TDD 필수**: 모든 기능은 테스트 먼저 작성
2. **Worktree 격리**: 병렬 작업은 반드시 Worktree로 분리
3. **코드 리뷰 필수**: 병합 전 리뷰 승인 필요
4. **의존성 관리**: 작업 간 의존성 명시적으로 정의
5. **상태 확인**: 작업 시작 전 에이전트 상태 확인

---

## 참고 문서

- `skills/tdd/SKILL.md` - TDD 상세 가이드
- `skills/brainstorming/SKILL.md` - 브레인스토밍 가이드
- `skills/code-review/SKILL.md` - 코드 리뷰 가이드
- `reference/docs/*.md` - Claude Code 공식 문서
- `Requirements.md` - 프로젝트 요구사항
