# Avengers Project

멀티 에이전트 개발 시스템입니다.
Claude Code와 통합되어 복잡한 개발 작업을 자동화합니다.

---

## MCP 서버

### avengers-core
핵심 에이전트 관리 및 작업 분배 시스템

**도구:**
- `avengers_dispatch_agent` - 에이전트 호출 및 작업 할당
- `avengers_get_agent_status` - 에이전트 상태 조회
- `avengers_assign_task` - 작업 생성 및 할당
- `avengers_merge_worktree` - Worktree 병합

### avengers-skills
개발 스킬 도구 모음

**도구:**
- `avengers_skill_tdd` - TDD 워크플로우 (RED → GREEN → REFACTOR)
- `avengers_skill_brainstorm` - 구조화된 브레인스토밍
- `avengers_skill_code_review` - 체계적인 코드 리뷰

---

## 에이전트 역할

| 에이전트 | 역할 | 권한 |
|---------|------|------|
| Captain | 오케스트레이터 | readonly |
| IronMan | 풀스택 개발자 | edit, bash, write, read |
| Natasha | 백엔드 개발자 | edit, bash, write, read |
| Groot | 테스트 전문가 | read, write-test-only |
| Jarvis | 리서처 | readonly, web-search |
| Dr.Strange | 기획자 | readonly |
| Vision | 문서화 담당 | write-docs-only |

---

## 워크플로우

### 1. 미션 시작
```
Captain이 작업 분석 → 에이전트 할당 → Worktree 생성
```

### 2. 개발 진행
```
IronMan/Natasha가 TDD로 구현 → Groot가 테스트 검증
```

### 3. 완료 및 병합
```
코드 리뷰 → Worktree 병합 → PR 생성
```

---

## 스킬 사용법

### TDD 스킬
```typescript
// 1. 시작
avengers_skill_tdd({ phase: "start", feature: "user-login" })

// 2. RED - 실패하는 테스트 작성
avengers_skill_tdd({ phase: "red", feature: "user-login" })

// 3. GREEN - 최소 구현
avengers_skill_tdd({ phase: "green", feature: "user-login", testResult: "fail" })

// 4. REFACTOR - 리팩토링
avengers_skill_tdd({ phase: "refactor", feature: "user-login", testResult: "pass" })
```

### 브레인스토밍 스킬
```typescript
// 1. 시작
avengers_skill_brainstorm({ phase: "start", topic: "auth-system" })

// 2. 이해
avengers_skill_brainstorm({ phase: "understand", topic: "auth-system" })

// 3. 탐색 (옵션 제시)
avengers_skill_brainstorm({ phase: "explore", topic: "auth-system" })

// 4. 설계
avengers_skill_brainstorm({ phase: "design", topic: "auth-system" })

// 5. 마무리
avengers_skill_brainstorm({ phase: "finalize", topic: "auth-system" })
```

### 코드 리뷰 스킬
```typescript
// 1. 리뷰 요청
avengers_skill_code_review({ phase: "request", files: ["src/auth.ts"] })

// 2. 리뷰 수행
avengers_skill_code_review({ phase: "review", files: ["src/auth.ts"] })

// 3. 피드백 응답
avengers_skill_code_review({ phase: "respond", findings: [...] })

// 4. 승인
avengers_skill_code_review({ phase: "approve" })
```

---

## 기본 규칙

1. **TDD 필수**: 모든 기능은 TDD로 개발
2. **Worktree 격리**: 병렬 작업은 Worktree로 격리
3. **코드 리뷰**: 병합 전 반드시 리뷰 수행
4. **Progressive Disclosure**: 스킬은 단계별로 로드

---

## 참고 문서

- `reference/docs/*.md` - Claude Code 공식 문서
- `reference/superpowers/` - 참고용 구조 (실제 구현은 MCP 기반)
- `Requirements.md` - 프로젝트 요구사항
