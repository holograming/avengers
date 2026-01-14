# Avengers Project

멀티 에이전트 개발 시스템입니다.
Claude Code와 통합되어 복잡한 개발 작업을 자동화합니다.

---

## 유연한 워크플로우 (핵심 원칙)

**모든 요청이 코딩을 필요로 하지 않습니다.**
Captain이 요청을 분석하여 필요한 에이전트만 호출합니다.

### 0단계: 요청 분석 (Captain) - 필수

모든 미션 시작 전 반드시 요청 분석 수행:

```typescript
// 첫 번째 단계로 반드시 호출
avengers_analyze_request({
  request: "사용자 요청 내용",
  forceResearch: true,  // 항상 comprehensive 리서치
  executionMode: "auto"  // 또는 "planning", "execution"
})
```

**executionMode 파라미터 (Plan 모드 통합)**

- `"auto"` (기본값): 일반 모드에서 요청 유형에 따라 자동 결정
- `"planning"`: Plan 모드에서 계획만 수립 (Phase 0-3)
- `"execution"`: 일반 모드에서 전체 실행 (Phase 0-8)

Claude가 현재 Plan 모드에 있다면 자동으로 `"planning"` 모드를 선택하고, 일반 모드에서는 `"auto"` 또는 `"execution"`을 전달합니다.

**분석 결과에 따른 워크플로우 선택:**

| 요청 유형 | 예시 | 호출 에이전트 |
|----------|------|--------------|
| Research Only | "Toss Place가 뭐야?" | Jarvis만 |
| Planning Only | "API 설계해줘" | Jarvis → Dr.Strange |
| Quick Fix | "버그 고쳐줘" | IronMan/Natasha → Groot |
| Documentation | "문서 작성해줘" | Jarvis → Vision |
| Full Development | "서비스 만들어줘" | 전체 팀 |

### 에이전트 계층

```
              ┌─────────────────────┐
              │      Captain        │  ← Orchestrator
              └──────────┬──────────┘
                         │
    ┌────────────────────┼────────────────────┐
    │                    │                    │
┌───▼────┐          ┌────▼────┐          ┌────▼───┐
│ Jarvis │          │Dr.Strange│          │ Vision │
│Research│          │ Planning │          │  Docs  │
└────────┘          └──────────┘          └────────┘
         Advisory Layer (동등 레벨)
```

**중요**: Jarvis는 IronMan의 하위가 아닌, Captain의 직속 자문입니다.

---

## 완료 기준 선택

모든 미션 시작 시 Captain이 완료 기준을 분석하고 제시합니다. 사용자의 요청 성격에 따라 적절한 완료 수준을 결정합니다:

| 완료 기준 | 포함 내용 | 사용 시나리오 |
|----------|----------|-------------|
| **code_only** | 코드 작성 + 타입 체크 | 프로토타입, 빠른 실험, 컴파일 언어 |
| **with_tests** (기본) | 코드 + 단위/통합 테스트 | 일반적인 개발 작업 |
| **with_execution** | 코드 + 테스트 + 실행 확인 | 중요 기능, 사용자 대면 기능 |
| **with_docs** | 코드 + 테스트 + 실행 + 문서 | API 공개, 팀 공유 라이브러리 |
| **full_cicd** | 코드 + 테스트 + 실행 + 문서 + CI/CD | 프로덕션 배포, 자동화 파이프라인 |

### 명시적 지정

완료 기준을 명시적으로 지정할 수 있습니다:

```typescript
avengers_analyze_request({
  request: "사용자 인증 API 구현",
  completionLevel: "with_execution"  // 실행 확인까지 필요
})
```

### 자동 판단

파라미터를 생략하면 Captain이 요청 유형에 따라 적절한 기본값을 선택합니다:
- 기본값: `with_tests` (모든 코드 기능은 테스트 포함)
- Research, Planning, Documentation 유형은 완료 기준 미적용

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
| `avengers_analyze_request` | Captain 판단 도구 | request, forceResearch, context, completionLevel |
| `avengers_validate_completion` | 완료 검증 | taskId, testResults, strictness |
| `avengers_agent_communicate` | 에이전트 간 메시지 | from, to, type, payload |
| `avengers_broadcast` | 전체 알림 | from, type, payload |
| `avengers_get_shared_context` | 공유 컨텍스트 조회 | taskId, filter |
| `avengers_update_shared_context` | 공유 컨텍스트 업데이트 | taskId, agent, files, summary |
| `avengers_dispatch_agent` | 에이전트 호출 | agent, task, worktree, context, mode, dependencies |
| `avengers_get_agent_status` | 상태 조회 | agent (optional) |
| `avengers_assign_task` | 작업 생성 | title, assignee, dependencies |
| `avengers_merge_worktree` | Worktree 병합 | worktreePath, targetBranch, createPR |
| `avengers_collect_results` | 백그라운드 결과 수집 | taskIds, timeout, format |
| `avengers_save_state` | 세션 상태 저장 | key, includeAgents, includeTasks |
| `avengers_restore_state` | 세션 상태 복구 | key |
| `avengers_summarize_session` | 세션 요약 생성 | format, includeMetrics |
| `avengers_run_tests` | **실제 테스트 실행** | taskId, projectPath, testType, coverage |
| `avengers_build_project` | **프로젝트 빌드** | taskId, projectPath, buildType |
| `avengers_run_local` | **로컬 실행 및 헬스체크** | taskId, projectPath, mode, healthCheck |
| `avengers_stop_process` | **프로세스 종료** | taskId, pid, force |
| `avengers_generate_cicd` | **CI/CD 설정 생성** | taskId, platform, projectType, features, deployment |

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
| Groot | 테스트 전문가 | read, write-test-only, **execute-tests** | 테스트 작성, **실행**, 검증 |
| Jarvis | 리서처 | readonly, web-search | 기술 조사, 문서 검색 |
| Dr.Strange | 기획자 | readonly | 요구사항 분석, 설계 |
| Vision | 문서화 담당 | write-docs-only | 문서 작성, API 명세 |
| **Hawkeye** | **DevOps 전문가** | **write-cicd-only, execute-build** | **CI/CD, 배포, 인프라** |

---

## 슬래시 커맨드

| 커맨드 | 설명 |
|--------|------|
| `/assemble` | 에이전트 팀 소집하여 문제 해결 |

---

## 기본 규칙

### 핵심 규칙
1. **Captain 판단 우선**: 모든 미션은 `avengers_analyze_request` 호출로 시작
2. **유연한 워크플로우**: 요청 유형에 맞는 에이전트만 호출 (Research Only, Quick Fix 등)
3. **Plan 모드 통합**:
   - Plan 모드에서는 자동으로 `executionMode: "planning"` 적용
   - 계획 단계 완료 후 상태 저장 → Plan 모드 종료 → "실행해줘" 요청
4. **Infinity War 원칙**: 끝날 때까지 끝나지 않음. 검증 통과 전 완료 선언 금지

### 개발 규칙
5. **TDD 필수**: 모든 기능은 테스트 먼저 작성
6. **Worktree 격리**: 병렬 작업은 반드시 Worktree로 분리
7. **코드 리뷰 필수**: 병합 전 리뷰 승인 필요
8. **의존성 관리**: 작업 간 의존성 명시적으로 정의
9. **상태 확인**: 작업 시작 전 에이전트 상태 확인
10. **프로젝트 내 상태 저장**: Plan 파일과 세션 정보는 프로젝트의 `.claude/` 디렉토리에 저장

### 완료 검증
```typescript
// 모든 개발 작업 완료 전 필수 호출
avengers_validate_completion({
  taskId: "T001",
  testResults: { ... },
  strictness: "moderate"  // 테스트 통과 필수, 커버리지 권장
})
```

- **필수**: 모든 테스트 통과
- **권장**: 테스트 커버리지 80%+, 문서화
- **무제한 루프백**: 검증 실패 시 수정 후 재시도

---

## 상태 저장 및 Resume

### 디렉토리 구조

```
.claude/
├── commands/          # 커스텀 슬래시 커맨드
├── plans/             # 로드맵 및 계획 파일
│   └── <plan-name>.md # 현재 진행 중인 계획
├── resume/            # Resume 정보 (선택)
│   └── latest.md      # 마지막 세션 상태
└── settings.json      # 프로젝트 설정
```

### Plan 파일 저장 규칙

**중요**: Plan 파일은 반드시 프로젝트 내 `.claude/plans/` 디렉토리에 저장합니다.
- 사용자 홈 디렉토리(`~/.claude/plans/`)가 아닌 프로젝트 디렉토리 사용
- 계획 파일은 git에 커밋하여 버전 관리 가능
- 팀원 간 계획 공유 용이

```typescript
// 올바른 경로
.claude/plans/roadmap.md
.claude/plans/milestone-1.md

// 잘못된 경로 (사용 금지)
~/.claude/plans/...
/Users/<user>/.claude/plans/...
```

### Resume 정보 저장

세션 종료 시 Resume 정보를 `.claude/resume/latest.md`에 저장:

```markdown
# Resume 정보

## 마지막 커밋
- Hash: <commit-hash>
- Message: <commit-message>

## 완료된 Milestone
- [x] Milestone 1: 설명
- [ ] Milestone 2: 설명

## 다음 작업
- 작업 1 설명
- 작업 2 설명

## 진행 중인 에이전트
- Agent: task description
```

---

## 병렬 에이전트 패턴

### MCP 도구 vs Task 도구

Avengers 시스템은 두 가지 도구를 사용합니다:

| 도구 | 역할 | 실제 병렬 실행 |
|------|------|--------------|
| MCP 도구 (`avengers_dispatch_agent`) | 상태 관리, 작업 등록 | ❌ 상태만 등록 |
| Task 도구 (`Task`) | 실제 서브에이전트 spawn | ✅ 진정한 병렬 |

**중요**: 진정한 병렬 실행을 위해서는 **Claude의 Task 도구**를 사용해야 합니다.

### Task 도구 기반 병렬 실행 (권장)

```typescript
// 1. 상태 등록 (MCP 도구)
avengers_assign_task({ title: "Feature A", assignee: "ironman" })
avengers_assign_task({ title: "Feature B", assignee: "natasha" })

// 2. 실제 병렬 spawn (Task 도구 - 단일 응답에서 모두 호출!)
Task({
  subagent_type: "general-purpose",
  description: "IronMan: Feature A 구현",
  prompt: `
    당신은 IronMan (풀스택 개발자)입니다.
    ## 작업: Feature A 구현
    ## 컨텍스트: ${relevantFiles}
    ## 완료 조건: TDD 방식, 테스트 통과
  `,
  run_in_background: true
})

Task({
  subagent_type: "general-purpose",
  description: "Natasha: Feature B 구현",
  prompt: `
    당신은 Natasha (백엔드 개발자)입니다.
    ## 작업: Feature B 구현
    ...
  `,
  run_in_background: true
})

// 3. 결과 수집
TaskOutput({ task_id: "ironman-xxx", block: true })
TaskOutput({ task_id: "natasha-xxx", block: true })
```

### Phase별 subagent_type 선택

| Phase | 작업 유형 | subagent_type |
|-------|----------|---------------|
| Phase 1 (리서치) | 코드/문서 탐색 | `Explore` |
| Phase 2-3 (기획) | 설계 계획 수립 | `Plan` |
| Phase 5 (개발) | 코드 작성, 테스트 | `general-purpose` |
| Phase 7 (문서화) | 문서 생성 | `general-purpose` |

### 병렬 실행 규칙

1. **단일 응답에서 모든 Task 호출**: 여러 Task를 병렬로 실행하려면 하나의 응답에서 모두 호출
2. **run_in_background: true**: 백그라운드 실행으로 병렬 처리
3. **결과 수집 전 대기**: TaskOutput으로 각 결과 확인

### Background Task 기반 병렬 실행 (MCP만 사용 시)

```typescript
// 명시적 컨텍스트와 함께 에이전트 디스패치
avengers_dispatch_agent({
  agent: "ironman",
  task: "React 컴포넌트 구현",
  worktree: true,
  mode: "background",  // 백그라운드 실행
  context: {
    files: ["src/components/Login.tsx"],
    snippets: [{ path: "src/types.ts", lines: [10, 50] }],
    references: ["https://react.dev"]
  },
  acceptanceCriteria: ["테스트 통과", "타입 안전성"],
  constraints: ["기존 스타일 유지"]
})
```

**참고**: MCP 도구만 사용 시 상태만 등록되며, 실제 병렬 실행은 Claude가 순차적으로 처리합니다.

### 결과 수집

```typescript
// 여러 백그라운드 작업 결과 집계
avengers_collect_results({
  taskIds: ["T001", "T002", "T003"],
  timeout: 60000,  // 60초 대기
  format: "summary"  // summary | detailed | json
})
```

### 컨텍스트 오염 방지

1. **명시적 컨텍스트**: 필요한 파일/스니펫만 전달
2. **Worktree 격리**: 각 에이전트가 독립 브랜치에서 작업
3. **결과 선택적 소비**: 필요한 결과만 메인 컨텍스트로 가져오기

---

## 효율성 패턴

### 상태 저장/복구

```typescript
// 작업 중단 전 상태 저장
avengers_save_state({
  key: "feature-auth",
  includeAgents: true,
  includeTasks: true
})

// 다음 세션에서 복구
avengers_restore_state({ key: "feature-auth" })
```

### 세션 요약

```typescript
// 현재 세션 상태 요약
avengers_summarize_session({
  format: "markdown",
  includeMetrics: true
})
```

---

## 참고 문서

- `skills/tdd/SKILL.md` - TDD 상세 가이드
- `skills/brainstorming/SKILL.md` - 브레인스토밍 가이드
- `skills/code-review/SKILL.md` - 코드 리뷰 가이드
- `skills/parallel-agents/SKILL.md` - 병렬 에이전트 패턴
- `skills/efficiency/SKILL.md` - 효율성 가이드
- `skills/evaluation/SKILL.md` - 평가 프레임워크
- `reference/docs/*.md` - Claude Code 공식 문서
- `docs/FEATURES.md` - 기능 상세 문서
